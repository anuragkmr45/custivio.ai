import fp from "fastify-plugin";

import { sendErrorResponse } from "../http/responses";

export const errorPlugin = fp((app, _options, done) => {
  app.setErrorHandler((error, request, reply) => {
    sendErrorResponse(reply, error, request.requestId);
  });

  done();
});
