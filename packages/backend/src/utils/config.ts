import dotenv from "dotenv";
import { resolve } from "path";

// Load .env from backend directory
dotenv.config({ path: resolve(process.cwd(), ".env") });

export const appConfig = {
  port: parseInt(process.env.PORT || "3001", 10),
  host: process.env.HOST || "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3100",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  encryptionKey: process.env.ENCRYPTION_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",
};

// Validate required config
if (!appConfig.databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

if (!appConfig.jwtSecret || appConfig.jwtSecret === "change-this-secret") {
  console.warn(
    "⚠️  WARNING: Using default JWT secret. Please set JWT_SECRET in production!",
  );
}

if (!appConfig.encryptionKey) {
  console.warn(
    "⚠️  WARNING: ENCRYPTION_KEY not set. API keys will not be encrypted!",
  );
}
