import { appConfig as config } from "./config.js";

export interface TokenPayload {
  userId: string;
  email: string;
}

export async function generateTokens(fastifyJwt: any, payload: TokenPayload) {
  const accessToken = fastifyJwt.sign(payload);

  const refreshToken = fastifyJwt.sign(
    {
      ...payload,
      refresh: true,
    },
    {
      expiresIn: config.jwtRefreshExpiry,
    },
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string) {
  // This will be handled by fastify-jwt
  return token;
}
