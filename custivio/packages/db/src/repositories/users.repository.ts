import { and, asc, eq } from "drizzle-orm";

import { getDb } from "../client";
import { users, type NewUser, type User } from "../schema";

export async function createUser(
  values: Pick<NewUser, "tenantId" | "email" | "displayName"> &
    Partial<Pick<NewUser, "organizationId" | "departmentId" | "jobTitle" | "status">>,
): Promise<User> {
  const [user] = await getDb()
    .insert(users)
    .values({
      tenantId: values.tenantId,
      organizationId: values.organizationId,
      departmentId: values.departmentId,
      email: values.email.toLowerCase(),
      displayName: values.displayName,
      jobTitle: values.jobTitle,
      status: values.status ?? "inactive",
    })
    .returning();

  if (!user) {
    throw new Error("Failed to create user.");
  }

  return user;
}

export async function findUserByEmail(tenantId: string, email: string): Promise<User | undefined> {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.email, email.toLowerCase())))
    .limit(1);

  return user;
}

export async function findUserById(tenantId: string, userId: string): Promise<User | undefined> {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.id, userId)))
    .limit(1);

  return user;
}

export async function updateUser(
  tenantId: string,
  userId: string,
  values: Partial<
    Pick<
      NewUser,
      "organizationId" | "departmentId" | "email" | "displayName" | "jobTitle" | "status"
    >
  >,
): Promise<User | undefined> {
  const [user] = await getDb()
    .update(users)
    .set({
      ...values,
      ...(values.email ? { email: values.email.toLowerCase() } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(users.tenantId, tenantId), eq(users.id, userId)))
    .returning();

  return user;
}

export async function listUsersByTenant(tenantId: string): Promise<User[]> {
  return getDb()
    .select()
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(asc(users.displayName), asc(users.email));
}
