export type AssetErrorCode =
  | "invalid_asset_input"
  | "asset_not_found"
  | "asset_attachment_not_found"
  | "asset_attachment_object_not_found"
  | "asset_attachment_checksum_mismatch";

export class AssetError extends Error {
  readonly code: AssetErrorCode;
  readonly status: number;

  constructor(code: AssetErrorCode, message: string, status: number) {
    super(message);
    this.name = "AssetError";
    this.code = code;
    this.status = status;
  }
}

export function isAssetError(error: unknown): error is AssetError {
  return error instanceof AssetError;
}
