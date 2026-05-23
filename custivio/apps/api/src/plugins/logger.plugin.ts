import { logger } from "@custivio/telemetry";
import fp from "fastify-plugin";

export const loggerPlugin = fp((app, _options, done) => {
  app.addHook("onResponse", (request, reply, hookDone) => {
    logger.info("API request completed", {
      requestId: request.requestId,
      route: `${request.method} ${request.routeOptions.url ?? request.url}`,
      durationMs: Math.round(reply.elapsedTime),
      context: { statusCode: reply.statusCode },
    });
    hookDone();
  });

  done();
});
