import { and, eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  departments,
  organizations,
  type Department,
  type NewDepartment,
  type NewOrganization,
  type Organization,
} from "../schema";

export async function createOrganization(
  values: Pick<NewOrganization, "tenantId" | "code" | "name"> &
    Partial<Pick<NewOrganization, "parentOrganizationId" | "type">>,
): Promise<Organization> {
  const [organization] = await getDb()
    .insert(organizations)
    .values({
      tenantId: values.tenantId,
      parentOrganizationId: values.parentOrganizationId,
      code: values.code,
      name: values.name,
      type: values.type ?? "business_unit",
      status: "active",
    })
    .returning();

  if (!organization) {
    throw new Error("Failed to create organization.");
  }

  return organization;
}

export async function listOrganizationsByTenant(tenantId: string): Promise<Organization[]> {
  return getDb().select().from(organizations).where(eq(organizations.tenantId, tenantId));
}

export async function createDepartment(
  values: Pick<NewDepartment, "tenantId" | "organizationId" | "code" | "name"> &
    Partial<Pick<NewDepartment, "parentDepartmentId">>,
): Promise<Department> {
  const [department] = await getDb()
    .insert(departments)
    .values({
      tenantId: values.tenantId,
      organizationId: values.organizationId,
      parentDepartmentId: values.parentDepartmentId,
      code: values.code,
      name: values.name,
      status: "active",
    })
    .returning();

  if (!department) {
    throw new Error("Failed to create department.");
  }

  return department;
}

export async function listDepartmentsForOrganization(
  tenantId: string,
  organizationId: string,
): Promise<Department[]> {
  return getDb()
    .select()
    .from(departments)
    .where(and(eq(departments.tenantId, tenantId), eq(departments.organizationId, organizationId)));
}
