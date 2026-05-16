export type PermissionResult =
  | { allowed: true }
  | { allowed: false; reason: "unauthenticated" | "forbidden" | "tenant_scope_missing" };

export function denyUntilAuthIsImplemented(): PermissionResult {
  return { allowed: false, reason: "unauthenticated" };
}
