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

export function createAssetAttachmentObjectKey(
  tenantId: string,
  assetId: string,
  attachmentId: string,
  filename: string,
): string {
  const safeFilename = filename.replace(/[^A-Za-z0-9._-]/g, "_");

  return `${createTenantObjectPrefix(tenantId)}/assets/${assetId}/attachments/${attachmentId}/${safeFilename}`;
}

export function createExportObjectKey(
  tenantId: string,
  exportJobId: string,
  filename: string,
): string {
  const safeFilename = filename.replace(/[^A-Za-z0-9._-]/g, "_");

  return `${createTenantObjectPrefix(tenantId)}/exports/${exportJobId}/${safeFilename}`;
}
