import { createHash, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { pathToFileURL } from "node:url";

import { getEnv } from "@custivio/config";
import { and, eq } from "drizzle-orm";

import { closeDatabaseConnections, getDb } from "./client";
import {
  auditLogs,
  passwordCredentials,
  roles,
  tenants,
  userRoleAssignments,
  users,
} from "./schema";
import { seedSystemRecordsForTenant } from "./seed";

import type { AppEnv } from "@custivio/config";
import type { ScryptOptions } from "node:crypto";

const scryptCost = 16_384;
const scryptBlockSize = 8;
const scryptParallelization = 1;
const scryptKeyLength = 64;
const scryptMaxMemory = 64 * 1024 * 1024;

export interface BootstrapAdminInput {
  tenantSlug: string;
  tenantName: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface BootstrapAdminResult {
  tenantId: string;
  adminUserId: string;
  createdAdminUser: boolean;
}

function requireBootstrapEnv(value: string | undefined, key: string): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${key} must be set before running pnpm db:bootstrap-admin.`);
  }

  return trimmed;
}

function assertTenantSlug(slug: string): void {
  if (!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(slug)) {
    throw new Error("BOOTSTRAP_TENANT_SLUG must be 3-80 lowercase letters, numbers, or hyphens.");
  }
}

function assertPasswordPolicy(password: string): void {
  if (
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters and include uppercase, lowercase, and number characters.",
    );
  }
}

type BootstrapEnvValues = Pick<
  Partial<AppEnv>,
  | "BOOTSTRAP_TENANT_SLUG"
  | "BOOTSTRAP_TENANT_NAME"
  | "BOOTSTRAP_ADMIN_EMAIL"
  | "BOOTSTRAP_ADMIN_NAME"
  | "BOOTSTRAP_ADMIN_PASSWORD"
>;

export function readBootstrapInputFromEnvValues(env: BootstrapEnvValues): BootstrapAdminInput {
  const input = {
    tenantSlug: requireBootstrapEnv(env.BOOTSTRAP_TENANT_SLUG, "BOOTSTRAP_TENANT_SLUG"),
    tenantName: requireBootstrapEnv(env.BOOTSTRAP_TENANT_NAME, "BOOTSTRAP_TENANT_NAME"),
    adminEmail: requireBootstrapEnv(env.BOOTSTRAP_ADMIN_EMAIL, "BOOTSTRAP_ADMIN_EMAIL"),
    adminName: requireBootstrapEnv(env.BOOTSTRAP_ADMIN_NAME, "BOOTSTRAP_ADMIN_NAME"),
    adminPassword: requireBootstrapEnv(env.BOOTSTRAP_ADMIN_PASSWORD, "BOOTSTRAP_ADMIN_PASSWORD"),
  };

  assertTenantSlug(input.tenantSlug);
  assertPasswordPolicy(input.adminPassword);

  return input;
}

function readBootstrapInputFromEnv(): BootstrapAdminInput {
  return readBootstrapInputFromEnvValues(getEnv());
}

function deriveKey(password: string, salt: string, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, scryptKeyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

async function hashBootstrapPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = await deriveKey(password, salt, {
    N: scryptCost,
    r: scryptBlockSize,
    p: scryptParallelization,
    maxmem: scryptMaxMemory,
  });

  return [
    "scrypt",
    String(scryptCost),
    String(scryptBlockSize),
    String(scryptParallelization),
    salt,
    derived.toString("base64url"),
  ].join("$");
}

export async function bootstrapAdmin(
  input: BootstrapAdminInput = readBootstrapInputFromEnv(),
): Promise<BootstrapAdminResult> {
  assertTenantSlug(input.tenantSlug);
  assertPasswordPolicy(input.adminPassword);

  const db = getDb();
  const [tenant] = await db
    .insert(tenants)
    .values({
      slug: input.tenantSlug,
      name: input.tenantName,
      status: "active",
    })
    .onConflictDoUpdate({
      target: tenants.slug,
      set: {
        name: input.tenantName,
        status: "active",
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!tenant) {
    throw new Error("Failed to create or update bootstrap tenant.");
  }

  await seedSystemRecordsForTenant(tenant.id);

  const normalizedEmail = input.adminEmail.toLowerCase();
  const existingAdmin = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenant.id), eq(users.email, normalizedEmail)))
    .limit(1);

  const [adminUser] =
    existingAdmin[0] !== undefined
      ? await db
          .update(users)
          .set({
            displayName: input.adminName,
            status: "active",
            updatedAt: new Date(),
          })
          .where(and(eq(users.tenantId, tenant.id), eq(users.id, existingAdmin[0].id)))
          .returning()
      : await db
          .insert(users)
          .values({
            tenantId: tenant.id,
            email: normalizedEmail,
            displayName: input.adminName,
            jobTitle: "Tenant Administrator",
            status: "active",
          })
          .returning();

  if (!adminUser) {
    throw new Error("Failed to create or update bootstrap administrator.");
  }

  await db
    .insert(passwordCredentials)
    .values({
      tenantId: tenant.id,
      userId: adminUser.id,
      passwordHash: await hashBootstrapPassword(input.adminPassword),
      passwordUpdatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: passwordCredentials.userId,
      set: {
        passwordHash: await hashBootstrapPassword(input.adminPassword),
        passwordUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  const [adminRole] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.tenantId, tenant.id), eq(roles.key, "administrator")))
    .limit(1);

  if (!adminRole) {
    throw new Error("Administrator role was not seeded for bootstrap tenant.");
  }

  const existingAssignment = await db
    .select({ id: userRoleAssignments.id })
    .from(userRoleAssignments)
    .where(
      and(
        eq(userRoleAssignments.tenantId, tenant.id),
        eq(userRoleAssignments.userId, adminUser.id),
        eq(userRoleAssignments.roleId, adminRole.id),
        eq(userRoleAssignments.scopeType, "tenant"),
      ),
    )
    .limit(1);

  if (existingAssignment.length === 0) {
    await db.insert(userRoleAssignments).values({
      tenantId: tenant.id,
      userId: adminUser.id,
      roleId: adminRole.id,
      scopeType: "tenant",
    });
  }

  const existingAudit = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenant.id),
        eq(auditLogs.action, "system.bootstrap_admin"),
        eq(auditLogs.entityType, "tenant"),
      ),
    )
    .limit(1);

  if (existingAudit.length === 0) {
    await db.insert(auditLogs).values({
      tenantId: tenant.id,
      actorUserId: adminUser.id,
      action: "system.bootstrap_admin",
      entityType: "tenant",
      entityId: tenant.id,
      metadata: {
        adminEmailHash: createHash("sha256").update(normalizedEmail).digest("hex"),
        source: "bootstrap-admin-cli",
      },
    });
  }

  return {
    tenantId: tenant.id,
    adminUserId: adminUser.id,
    createdAdminUser: existingAdmin[0] === undefined,
  };
}

async function runBootstrapCli(): Promise<void> {
  try {
    const result = await bootstrapAdmin();
    process.stdout.write(
      JSON.stringify(
        {
          status: "ok",
          tenantId: result.tenantId,
          adminUserId: result.adminUserId,
          createdAdminUser: result.createdAdminUser,
        },
        null,
        2,
      ) + "\n",
    );
  } finally {
    await closeDatabaseConnections();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void runBootstrapCli();
}
