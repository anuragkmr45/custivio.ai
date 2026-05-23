import { recordApiRequest } from "@custivio/telemetry";
import fp from "fastify-plugin";

function routeLabel(route: string | undefined): string {
  return route ?? "unmatched";
}

export const metricsPlugin = fp((app, _options, done) => {
  app.addHook("onResponse", (request, reply, hookDone) => {
    recordApiRequest({
      durationMs: Math.round(reply.elapsedTime),
      method: request.method,
      route: routeLabel(request.routeOptions.url),
      statusCode: reply.statusCode,
    });
    hookDone();
  });

  done();
});
