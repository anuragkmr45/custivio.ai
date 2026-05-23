import { requirePermission, type AuthenticatedSession } from "@custivio/auth";

import type { FastifyRequest } from "fastify";

export async function requireRequestPermission(
  request: FastifyRequest,
  permissionKey: string,
): Promise<AuthenticatedSession> {
  return requirePermission(request.sessionToken, permissionKey);
}
