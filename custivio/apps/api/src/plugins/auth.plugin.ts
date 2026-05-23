import fp from "fastify-plugin";

import { getSessionToken } from "../http/cookies";

export const authPlugin = fp((app, _options, done) => {
  app.decorateRequest("sessionToken");
  app.addHook("onRequest", (request, _reply, hookDone) => {
    request.sessionToken = getSessionToken(request);
    hookDone();
  });

  done();
});
