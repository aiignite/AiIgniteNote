import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { appConfig as config } from "./utils/config.js";

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

// Register CORS
await fastify.register(cors, {
  origin: config.corsOrigin,
  credentials: true,
});

// Register JWT
await fastify.register(jwt, {
  secret: config.jwtSecret,
});

// Register multipart
await fastify.register(multipart);

// Health check
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(import("./routes/auth.routes.js"), {
  prefix: "/api/v1/auth",
});
await fastify.register(import("./routes/users.routes.js"), {
  prefix: "/api/v1/users",
});
await fastify.register(import("./routes/notes.routes.js"), {
  prefix: "/api/v1/notes",
});
await fastify.register(import("./routes/categories.routes.js"), {
  prefix: "/api/v1/categories",
});
await fastify.register(import("./routes/ai.routes.js"), {
  prefix: "/api/v1/ai",
});
await fastify.register(import("./routes/models.routes.js"), {
  prefix: "/api/v1/models",
});
await fastify.register(import("./routes/tags.routes.js"), {
  prefix: "/api/v1/tags",
});
await fastify.register(import("./routes/sync.routes.js"), {
  prefix: "/api/v1/sync",
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  reply.status(error.statusCode || 500).send({
    error: {
      message: error.message,
      code: error.code || "INTERNAL_SERVER_ERROR",
    },
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`🚀 Server ready at http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
