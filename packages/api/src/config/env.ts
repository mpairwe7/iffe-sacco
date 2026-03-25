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
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? required("JWT_SECRET") : "dev-jwt-secret-not-for-production"),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === "production" ? required("JWT_REFRESH_SECRET") : "dev-refresh-secret-not-for-production"),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
} as const;
