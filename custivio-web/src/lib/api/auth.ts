import { apiRequest } from "./client";
import type { ApiResult, AuthenticatedSession, SessionEnvelope } from "./types";

export type LoginRequest = {
  tenantSlug: string;
  email: string;
  password: string;
};

export function login(input: LoginRequest): Promise<ApiResult<SessionEnvelope>> {
  return apiRequest<SessionEnvelope>({
    method: "POST",
    path: "/api/auth/login",
    body: input,
  });
}

export function logout(): Promise<ApiResult<{ ok: boolean }>> {
  return apiRequest<{ ok: boolean }>({
    method: "POST",
    path: "/api/auth/logout",
  });
}

export function getCurrentSession(): Promise<ApiResult<AuthenticatedSession>> {
  return apiRequest<AuthenticatedSession>({
    method: "GET",
    path: "/api/auth/me",
  });
}
