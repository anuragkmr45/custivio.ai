import type { AppEnv } from "@custivio/config";

declare module "fastify" {
  interface FastifyInstance {
    appConfig: AppEnv;
  }

  interface FastifyRequest {
    requestId: string;
    sessionToken: string | undefined;
  }
}
