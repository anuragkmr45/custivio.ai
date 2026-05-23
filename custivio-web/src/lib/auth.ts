import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentSession, login, logout, type LoginRequest } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/errors";
import type { ApiResult, AuthenticatedSession } from "@/lib/api/types";
import { canAccess, type PermissionRequirement } from "@/lib/permission-policy";

export const currentSessionQueryKey = ["auth", "session"] as const;

export function currentSessionQueryOptions() {
  return queryOptions({
    queryKey: currentSessionQueryKey,
    queryFn: async () => {
      const result = await getCurrentSession();
      if (result.ok) return result.data;
      if (result.status === 401) return null;
      throw new ApiClientError(result as Extract<ApiResult<never>, { ok: false }>);
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useCurrentSession() {
  return useQuery(currentSessionQueryOptions());
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginRequest) => {
      const result = await login(input);
      if (!result.ok) throw new ApiClientError(result as Extract<ApiResult<never>, { ok: false }>);
      return result.data.session;
    },
    onSuccess: (session) => {
      queryClient.setQueryData(currentSessionQueryKey, session);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await logout();
      if (!result.ok) throw new ApiClientError(result as Extract<ApiResult<never>, { ok: false }>);
      return result.data;
    },
    onSettled: () => {
      queryClient.setQueryData(currentSessionQueryKey, null);
      queryClient.removeQueries({ queryKey: currentSessionQueryKey });
    },
  });
}

export function hasPermission(
  session: AuthenticatedSession | null | undefined,
  required?: PermissionRequirement,
): boolean {
  return canAccess(session, required);
}

export function hasAnyPermission(
  session: AuthenticatedSession | null | undefined,
  required?: PermissionRequirement,
): boolean {
  return canAccess(session, required, "any");
}

export function getDisplayInitials(session: AuthenticatedSession | null | undefined): string {
  const name = session?.user.displayName || session?.user.email || "User";
  return name
    .split(/\s|@/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
