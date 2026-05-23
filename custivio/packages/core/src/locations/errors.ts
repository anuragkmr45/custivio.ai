export class LocationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "LocationError";
    this.code = code;
    this.status = status;
  }
}

export function isLocationError(error: unknown): error is LocationError {
  return error instanceof LocationError;
}
