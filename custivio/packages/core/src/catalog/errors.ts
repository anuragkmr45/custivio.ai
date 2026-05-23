export type CatalogErrorCode =
  | "invalid_catalog_input"
  | "unknown_catalog_resource"
  | "catalog_record_not_found"
  | "catalog_record_in_use";

export class CatalogError extends Error {
  readonly code: CatalogErrorCode;
  readonly status: number;

  constructor(code: CatalogErrorCode, message: string, status: number) {
    super(message);
    this.name = "CatalogError";
    this.code = code;
    this.status = status;
  }
}

export function isCatalogError(error: unknown): error is CatalogError {
  return error instanceof CatalogError;
}
