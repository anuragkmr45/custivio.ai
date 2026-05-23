export type StockErrorCode = "invalid_stock_input" | "insufficient_stock" | "idempotency_conflict";

export class StockError extends Error {
  readonly code: StockErrorCode;
  readonly status: number;

  constructor(code: StockErrorCode, message: string, status: number) {
    super(message);
    this.name = "StockError";
    this.code = code;
    this.status = status;
  }
}

export function isStockError(error: unknown): error is StockError {
  return error instanceof StockError;
}
