import {
  appendAuditLog,
  createSession,
  findActiveSessionByTokenHash,
  findPasswordCredentialByUserId,
  findTenantBySlug,
  findUserByEmail,
  listRoleSummariesByTenant,
  listUserPermissionKeys,
  listUserRoleAssignmentsByTenant,
  listUsersByTenant,
  revokeSessionByTokenHash,
  touchSession,
  upsertPasswordCredential,
  type RoleSummary,
  type Tenant,
  type User,
  type UserRoleAssignmentSummary,
} from "@custivio/db";
import { logger, recordAuthLoginAttempt } from "@custivio/telemetry";

import { AuthError } from "./errors";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "./passwords";

export const SESSION_COOKIE_NAME = "custivio_session";
const sessionTtlMs = 12 * 60 * 60 * 1000;

export interface AuthenticatedSession {
  sessionId: string;
  tenant: Pick<Tenant, "id" | "slug" | "name" | "status">;
  user: Pick<User, "id" | "email" | "displayName" | "status">;
  permissionKeys: string[];
  expiresAt: Date;
}

export interface LoginInput {
  tenantSlug: string;
  email: string;
  password: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  requestId?: string;
}

export interface LoginResult {
  sessionToken: string;
  session: AuthenticatedSession;
}

export interface CreatePasswordInput {
  tenantId: string;
  userId: string;
  password: string;
}

function normalizeTenantSlug(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function requireNonEmpty(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new AuthError("invalid_credentials", `${fieldName} is required.`, 400);
  }

  return trimmed;
}

function toAuthenticatedSession(
  record: Awaited<ReturnType<typeof findActiveSessionByTokenHash>>,
  permissionKeys: string[],
): AuthenticatedSession {
  if (!record) {
    throw new AuthError("missing_session", "Session is missing or expired.", 401);
  }

  return {
    sessionId: record.session.id,
    tenant: {
      id: record.tenant.id,
      slug: record.tenant.slug,
      name: record.tenant.name,
      status: record.tenant.status,
    },
    user: {
      id: record.user.id,
      email: record.user.email,
      displayName: record.user.displayName,
      status: record.user.status,
    },
    permissionKeys,
    expiresAt: record.session.expiresAt,
  };
}

export async function setUserPassword(input: CreatePasswordInput): Promise<void> {
  const passwordHash = await hashPassword(input.password);

  await upsertPasswordCredential({
    tenantId: input.tenantId,
    userId: input.userId,
    passwordHash,
  });
}

export async function authenticateWithPassword(input: LoginInput): Promise<LoginResult> {
  const tenantSlug = normalizeTenantSlug(requireNonEmpty(input.tenantSlug, "Tenant"));
  const email = normalizeEmail(requireNonEmpty(input.email, "Email"));
  const password = requireNonEmpty(input.password, "Password");

  recordAuthLoginAttempt("attempt");

  const tenant = await findTenantBySlug(tenantSlug);

  if (tenant?.status !== "active") {
    recordAuthLoginAttempt("failure");
    throw new AuthError("invalid_credentials", "Invalid tenant, email, or password.", 401);
  }

  const user = await findUserByEmail(tenant.id, email);

  if (!user) {
    recordAuthLoginAttempt("failure");
    await appendAuditLog({
      tenantId: tenant.id,
      action: "auth.login_failed",
      entityType: "user",
      entityId: email,
      metadata: { reason: "unknown_user" },
      requestId: input.requestId,
    });
    throw new AuthError("invalid_credentials", "Invalid tenant, email, or password.", 401);
  }

  if (user.status !== "active") {
    recordAuthLoginAttempt("failure");
    await appendAuditLog({
      tenantId: tenant.id,
      actorUserId: user.id,
      action: "auth.login_failed",
      entityType: "user",
      entityId: user.id,
      metadata: { reason: "inactive_user" },
      requestId: input.requestId,
    });
    throw new AuthError("inactive_user", "User account is not active.", 403);
  }

  const credential = await findPasswordCredentialByUserId(tenant.id, user.id);
  const validPassword = credential
    ? await verifyPassword(password, credential.passwordHash)
    : false;

  if (!validPassword) {
    recordAuthLoginAttempt("failure");
    await appendAuditLog({
      tenantId: tenant.id,
      actorUserId: user.id,
      action: "auth.login_failed",
      entityType: "user",
      entityId: user.id,
      metadata: { reason: "invalid_password" },
      requestId: input.requestId,
    });
    throw new AuthError("invalid_credentials", "Invalid tenant, email, or password.", 401);
  }

  const sessionToken = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionTtlMs);
  const session = await createSession({
    tenantId: tenant.id,
    userId: user.id,
    tokenHash: hashSessionToken(sessionToken),
    userAgent: input.userAgent ?? undefined,
    ipAddress: input.ipAddress ?? undefined,
    expiresAt,
  });
  const permissionKeys = await listUserPermissionKeys(tenant.id, user.id);

  await appendAuditLog({
    tenantId: tenant.id,
    actorUserId: user.id,
    action: "auth.login_success",
    entityType: "session",
    entityId: session.id,
    requestId: input.requestId,
  });

  recordAuthLoginAttempt("success");

  logger.info("User logged in", {
    ...(input.requestId ? { requestId: input.requestId } : {}),
    tenantId: tenant.id,
    userId: user.id,
  });

  return {
    sessionToken,
    session: {
      sessionId: session.id,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
      },
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
      },
      permissionKeys,
      expiresAt,
    },
  };
}

export async function getAuthenticatedSession(
  sessionToken: string | undefined,
): Promise<AuthenticatedSession | undefined> {
  if (!sessionToken) {
    return undefined;
  }

  const record = await findActiveSessionByTokenHash(hashSessionToken(sessionToken));

  if (!record) {
    return undefined;
  }

  await touchSession(record.session.id);

  const permissionKeys = await listUserPermissionKeys(record.tenant.id, record.user.id);

  return toAuthenticatedSession(record, permissionKeys);
}

export async function requireAuthenticatedSession(
  sessionToken: string | undefined,
): Promise<AuthenticatedSession> {
  const session = await getAuthenticatedSession(sessionToken);

  if (!session) {
    throw new AuthError("missing_session", "Authentication is required.", 401);
  }

  return session;
}

export function hasPermission(session: AuthenticatedSession, permissionKey: string): boolean {
  return session.permissionKeys.includes(permissionKey);
}

export async function requirePermission(
  sessionToken: string | undefined,
  permissionKey: string,
): Promise<AuthenticatedSession> {
  const session = await requireAuthenticatedSession(sessionToken);

  if (!hasPermission(session, permissionKey)) {
    throw new AuthError("forbidden", "Permission denied.", 403);
  }

  return session;
}

export async function logoutSession(
  sessionToken: string | undefined,
  requestId?: string,
): Promise<void> {
  if (!sessionToken) {
    return;
  }

  const tokenHash = hashSessionToken(sessionToken);
  const session = await revokeSessionByTokenHash(tokenHash);

  if (!session) {
    return;
  }

  await appendAuditLog({
    tenantId: session.tenantId,
    actorUserId: session.userId,
    action: "auth.logout",
    entityType: "session",
    entityId: session.id,
    requestId,
  });
}

export async function listUsersForSession(sessionToken: string | undefined): Promise<User[]> {
  const session = await requirePermission(sessionToken, "users.manage");

  return listUsersByTenant(session.tenant.id);
}

export async function listRolesForSession(
  sessionToken: string | undefined,
): Promise<RoleSummary[]> {
  const session = await requirePermission(sessionToken, "roles.manage");

  return listRoleSummariesByTenant(session.tenant.id);
}

export async function listAssignmentsForSession(
  sessionToken: string | undefined,
): Promise<UserRoleAssignmentSummary[]> {
  const session = await requirePermission(sessionToken, "roles.manage");

  return listUserRoleAssignmentsByTenant(session.tenant.id);
}
