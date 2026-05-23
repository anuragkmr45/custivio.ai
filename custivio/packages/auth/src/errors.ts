export type AuthErrorCode =
  | "invalid_credentials"
  | "inactive_user"
  | "missing_session"
  | "expired_session"
  | "forbidden"
  | "invalid_password_policy"
  | "invalid_admin_input"
  | "user_not_found"
  | "role_not_found"
  | "assignment_not_found";

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;

  constructor(code: AuthErrorCode, message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
