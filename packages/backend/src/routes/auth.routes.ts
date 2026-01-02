import { FastifyInstance } from "fastify";
import { AuthService } from "../services/auth.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post("/register", async (request, reply) => {
    try {
      const authService = new AuthService(fastify.jwt);
      const result = await authService.register(request.body as any);
      return result;
    } catch (error: any) {
      reply.status(400).send({
        error: {
          message: error.message,
          code: error.message,
        },
      });
    }
  });

  // Login
  fastify.post("/login", async (request, reply) => {
    try {
      const authService = new AuthService(fastify.jwt);
      const result = await authService.login(request.body as any);
      return result;
    } catch (error: any) {
      reply.status(401).send({
        error: {
          message: error.message,
          code: error.message,
        },
      });
    }
  });

  // Refresh token
  fastify.post("/refresh", async (request, reply) => {
    try {
      const body = request.body as { refreshToken: string };
      if (!body.refreshToken) {
        reply.status(400).send({
          error: {
            message: "Refresh token is required",
            code: "MISSING_REFRESH_TOKEN",
          },
        });
        return;
      }

      const authService = new AuthService(fastify.jwt);
      const result = await authService.refresh(body.refreshToken);
      return result;
    } catch (error: any) {
      reply.status(401).send({
        error: {
          message: error.message,
          code: error.message,
        },
      });
    }
  });

  // Logout
  fastify.post("/logout", async (request, reply) => {
    try {
      const body = request.body as { refreshToken: string };
      if (!body.refreshToken) {
        reply.status(400).send({
          error: {
            message: "Refresh token is required",
            code: "MISSING_REFRESH_TOKEN",
          },
        });
        return;
      }

      const authService = new AuthService(fastify.jwt);
      await authService.logout(body.refreshToken);
      return { message: "Logged out successfully" };
    } catch (error: any) {
      reply.status(400).send({
        error: {
          message: error.message,
          code: error.message,
        },
      });
    }
  });

  // Get current user
  fastify.get("/me", { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const req = request as any;
      const authService = new AuthService(fastify.jwt);
      const user = await authService.getUserById(req.userId);
      return user;
    } catch (error: any) {
      reply.status(404).send({
        error: {
          message: error.message,
          code: error.message,
        },
      });
    }
  });
}
