import { createRequestId } from "@custivio/telemetry";
import fp from "fastify-plugin";

export const requestIdPlugin = fp((app, _options, done) => {
  app.addHook("onRequest", (request, reply, hookDone) => {
    request.requestId = createRequestId(request.headers["x-request-id"]?.toString());
    reply.header("x-request-id", request.requestId);
    hookDone();
  });

  done();
});
