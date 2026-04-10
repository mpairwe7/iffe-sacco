function required(name: string): string {
  const val = process.env[name];
  if (!val && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val || "";
}

export const env = {
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? required("JWT_SECRET") : "dev-jwt-secret-not-for-production"),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  APP_BASE_URL: process.env.APP_BASE_URL || process.env.CORS_ORIGIN?.split(",")[0] || "http://localhost:3000",
  SESSION_TTL_HOURS: Number(process.env.SESSION_TTL_HOURS || 24),
  REMEMBER_ME_SESSION_TTL_DAYS: Number(process.env.REMEMBER_ME_SESSION_TTL_DAYS || 7),
  PASSWORD_RESET_TTL_MINUTES: Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30),
  AUTH_RATE_LIMIT_WINDOW_MS: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: Number(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || 5),
} as const;
