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

// 验证加密密钥
if (appConfig.encryptionKey) {
  console.log("🔑 ENCRYPTION_KEY found, length:", appConfig.encryptionKey.length, "characters");

  if (appConfig.encryptionKey.length === 64) {
    // 验证是否为有效的十六进制
    const hexRegex = /^[0-9a-fA-F]{64}$/;
    if (hexRegex.test(appConfig.encryptionKey)) {
      console.log("✅ ENCRYPTION_KEY format is correct (64 hex characters)");
    } else {
      console.warn("⚠️  WARNING: ENCRYPTION_KEY contains invalid characters (should be hex only)");
    }
  } else {
    console.warn("⚠️  WARNING: ENCRYPTION_KEY has wrong length:", appConfig.encryptionKey.length, "(expected 64)");
  }
} else {
  console.warn(
    "⚠️  WARNING: ENCRYPTION_KEY not set. API keys will not be encrypted!",
  );
}
