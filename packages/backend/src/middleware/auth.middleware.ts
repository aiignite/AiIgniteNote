import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/prisma.js";

export interface AuthenticatedRequest extends FastifyRequest {
  userId: string;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify();
    const req = request as AuthenticatedRequest;
    // 从 token payload 中获取 userId
    const payload = request.user as any;
    req.userId = payload.userId || payload.sub;
  } catch (err) {
    reply.status(401).send({
      error: {
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      },
    });
  }
}

export async function optionalAuthenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify();
    const req = request as AuthenticatedRequest;
    // 从 token payload 中获取 userId
    const payload = request.user as any;
    req.userId = payload.userId || payload.sub;
  } catch {
    // Continue without authentication
  }
}
