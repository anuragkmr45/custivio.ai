export function createTenantObjectPrefix(tenantId: string): string {
  return `tenants/${tenantId}`;
}

export function createAuditEvidenceObjectKey(
  tenantId: string,
  objectId: string,
  filename: string,
): string {
  const safeFilename = filename.replace(/[^A-Za-z0-9._-]/g, "_");

  return `${createTenantObjectPrefix(tenantId)}/audit-evidence/${objectId}/${safeFilename}`;
}
