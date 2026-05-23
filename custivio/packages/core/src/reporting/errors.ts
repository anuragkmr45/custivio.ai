export class ReportingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "ReportingError";
  }
}

export function isReportingError(error: unknown): error is ReportingError {
  return error instanceof ReportingError;
}
