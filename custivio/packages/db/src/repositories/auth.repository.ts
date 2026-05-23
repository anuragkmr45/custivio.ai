import { and, eq, gt, isNull } from "drizzle-orm";

import { getDb } from "../client";
import {
  passwordCredentials,
  sessions,
  tenants,
  users,
  type NewPasswordCredential,
  type NewSession,
  type PasswordCredential,
  type Session,
  type Tenant,
  type User,
} from "../schema";

export interface AuthenticatedSessionRecord {
  session: Session;
  tenant: Tenant;
  user: User;
}

export async function upsertPasswordCredential(
  values: Pick<NewPasswordCredential, "tenantId" | "userId" | "passwordHash">,
): Promise<PasswordCredential> {
  const [credential] = await getDb()
    .insert(passwordCredentials)
    .values({
      tenantId: values.tenantId,
      userId: values.userId,
      passwordHash: values.passwordHash,
      passwordUpdatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: passwordCredentials.userId,
      set: {
        passwordHash: values.passwordHash,
        passwordUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!credential) {
    throw new Error("Failed to upsert password credential.");
  }

  return credential;
}

export async function findPasswordCredentialByUserId(
  tenantId: string,
  userId: string,
): Promise<PasswordCredential | undefined> {
  const [credential] = await getDb()
    .select()
    .from(passwordCredentials)
    .where(and(eq(passwordCredentials.tenantId, tenantId), eq(passwordCredentials.userId, userId)))
    .limit(1);

  return credential;
}

export async function createSession(values: NewSession): Promise<Session> {
  const [session] = await getDb().insert(sessions).values(values).returning();

  if (!session) {
    throw new Error("Failed to create session.");
  }

  return session;
}

export async function findActiveSessionByTokenHash(
  tokenHash: string,
  now = new Date(),
): Promise<AuthenticatedSessionRecord | undefined> {
  const [record] = await getDb()
    .select({ session: sessions, tenant: tenants, user: users })
    .from(sessions)
    .innerJoin(tenants, eq(sessions.tenantId, tenants.id))
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        eq(tenants.status, "active"),
        eq(users.status, "active"),
      ),
    )
    .limit(1);

  return record;
}

export async function touchSession(sessionId: string): Promise<void> {
  await getDb()
    .update(sessions)
    .set({ lastSeenAt: new Date(), updatedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

export async function revokeSessionByTokenHash(tokenHash: string): Promise<Session | undefined> {
  const [session] = await getDb()
    .update(sessions)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)))
    .returning();

  return session;
}
