export class OperationsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "OperationsError";
  }
}

export function isOperationsError(error: unknown): error is OperationsError {
  return error instanceof OperationsError;
}
