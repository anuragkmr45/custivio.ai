import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fp from "fastify-plugin";

import { registerOpenApiSchemas } from "../openapi/schemas";

export const swaggerPlugin = fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Custivio API",
        version: "0.1.0",
      },
    },
  });

  registerOpenApiSchemas(app);

  await app.register(swaggerUi, {
    routePrefix: "/api/docs",
  });
});
