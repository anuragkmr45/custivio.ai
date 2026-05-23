import { getMetricsContentType, renderMetrics } from "@custivio/telemetry";

import { fileResponse, routeSchema } from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

export function metricsRoutes(app: FastifyInstance): void {
  app.get(
    "/api/metrics",
    {
      schema: routeSchema({
        tags: ["metrics"],
        summary: "Render Prometheus metrics in text exposition format.",
        response: fileResponse("Prometheus text exposition."),
      }),
    },
    async (_request, reply) => {
      const metrics = await renderMetrics();

      return reply.status(200).type(getMetricsContentType()).send(metrics);
    },
  );
}
