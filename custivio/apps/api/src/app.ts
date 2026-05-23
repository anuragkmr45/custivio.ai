import "./types/fastify";

import Fastify, { type FastifyInstance } from "fastify";

import { jsonResponse, routeSchema } from "./openapi/schemas";
import { authPlugin } from "./plugins/auth.plugin";
import { configPlugin } from "./plugins/config.plugin";
import { errorPlugin } from "./plugins/error.plugin";
import { loggerPlugin } from "./plugins/logger.plugin";
import { metricsPlugin } from "./plugins/metrics.plugin";
import { multipartPlugin } from "./plugins/multipart.plugin";
import { rateLimitPlugin } from "./plugins/rate-limit.plugin";
import { requestIdPlugin } from "./plugins/request-id.plugin";
import { securityPlugin } from "./plugins/security.plugin";
import { swaggerPlugin } from "./plugins/swagger.plugin";
import { adminRoutes } from "./routes/admin.routes";
import { assetsRoutes } from "./routes/assets.routes";
import { auditsRoutes } from "./routes/audits.routes";
import { authRoutes } from "./routes/auth.routes";
import { catalogRoutes } from "./routes/catalog.routes";
import { custodyRoutes } from "./routes/custody.routes";
import { healthRoutes } from "./routes/health.routes";
import { importsRoutes } from "./routes/imports.routes";
import { locationsRoutes } from "./routes/locations.routes";
import { maintenanceRoutes } from "./routes/maintenance.routes";
import { metricsRoutes } from "./routes/metrics.routes";
import { opsRoutes } from "./routes/ops.routes";
import { reportsRoutes } from "./routes/reports.routes";
import { stockRoutes } from "./routes/stock.routes";
import { transfersRoutes } from "./routes/transfers.routes";

export async function buildApiApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, trustProxy: true });

  await app.register(configPlugin);
  await app.register(requestIdPlugin);
  await app.register(securityPlugin);
  await app.register(authPlugin);
  await app.register(loggerPlugin);
  await app.register(errorPlugin);
  await app.register(metricsPlugin);
  await app.register(multipartPlugin);
  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);

  await app.register(healthRoutes);
  await app.register(metricsRoutes);
  await app.register(opsRoutes);
  await app.register(authRoutes);
  await app.register(adminRoutes);
  await app.register(catalogRoutes);
  await app.register(assetsRoutes);
  await app.register(stockRoutes);
  await app.register(custodyRoutes);
  await app.register(transfersRoutes);
  await app.register(maintenanceRoutes);
  await app.register(auditsRoutes);
  await app.register(importsRoutes);
  await app.register(reportsRoutes);
  await app.register(locationsRoutes);

  app.get(
    "/api/openapi.json",
    {
      schema: routeSchema({
        tags: ["docs"],
        summary: "Return the OpenAPI document for the Fastify API.",
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    () => app.swagger(),
  );

  return app;
}
