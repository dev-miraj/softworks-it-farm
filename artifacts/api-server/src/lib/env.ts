import { logger } from "./logger.js";

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  DATABASE_URL: string;
}

const DEFAULTS: Partial<EnvConfig> = {
  NODE_ENV: "development",
  PORT: 8080,
  ADMIN_USERNAME: "admin",
};

const WEAK_SECRETS = [
  "softworks-dev-secret-change-in-production",
  "change-this-to-a-strong-random-secret-64-chars-minimum",
  "secret",
  "password",
  "",
];

function getDbUrl(): string {
  return (
    process.env["DATABASE_URL_UNPOOLED"] ||
    process.env["NEON_DATABASE_URL"] ||
    process.env["DATABASE_URL"] ||
    process.env["POSTGRES_URL"] ||
    ""
  );
}

export function validateEnv(): EnvConfig {
  const warnings: string[] = [];
  const errors: string[] = [];
  const isProd = process.env["NODE_ENV"] === "production";

  const jwtSecret = process.env["JWT_SECRET"] || process.env["SESSION_SECRET"] || "";
  if (!jwtSecret) errors.push("JWT_SECRET is not set");
  else if (WEAK_SECRETS.includes(jwtSecret)) {
    if (isProd) errors.push("JWT_SECRET is too weak for production");
    else warnings.push("JWT_SECRET is using a weak default — set a strong value in production");
  } else if (jwtSecret.length < 32) {
    warnings.push("JWT_SECRET should be at least 32 characters long");
  }

  const dbUrl = getDbUrl();
  if (!dbUrl) {
    if (isProd) errors.push("No database URL configured (set NEON_DATABASE_URL or DATABASE_URL)");
    else warnings.push("No database URL configured — DB operations will fail");
  }

  const adminPass = process.env["ADMIN_PASSWORD"] || "";
  if (!adminPass) warnings.push("ADMIN_PASSWORD is not set — using default 'Softworks@2024'");
  else if (adminPass === "Softworks@2024" && isProd) {
    warnings.push("ADMIN_PASSWORD is still the default — please change it in production");
  }

  if (warnings.length > 0) {
    for (const w of warnings) logger.warn({ env: true }, `[env] ⚠  ${w}`);
  }

  if (errors.length > 0) {
    for (const e of errors) logger.error({ env: true }, `[env] ✗  ${e}`);
    if (isProd) {
      throw new Error(`Server startup aborted: ${errors.length} critical env error(s). Check logs.`);
    }
  }

  return {
    NODE_ENV: process.env["NODE_ENV"] ?? "development",
    PORT: Number(process.env["PORT"] ?? 8080),
    JWT_SECRET: jwtSecret || "softworks-dev-secret-change-in-production",
    JWT_REFRESH_SECRET: process.env["JWT_REFRESH_SECRET"] || jwtSecret + "_refresh",
    ADMIN_USERNAME: process.env["ADMIN_USERNAME"] || "admin",
    ADMIN_PASSWORD: adminPass || "Softworks@2024",
    DATABASE_URL: dbUrl,
  };
}

let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!_config) _config = validateEnv();
  return _config;
}
