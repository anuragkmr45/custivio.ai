import { getEnv } from "@custivio/config";
import fp from "fastify-plugin";

export const configPlugin = fp((app, _options, done) => {
  app.decorate("appConfig", getEnv());
  done();
});
