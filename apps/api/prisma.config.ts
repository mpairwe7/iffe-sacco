import path from "node:path";
import { defineConfig } from "prisma/config";

// Load .env manually for Prisma CLI
import { readFileSync } from "node:fs";
try {
  const envFile = readFileSync(path.join(__dirname, ".env"), "utf-8");
  for (const line of envFile.split("\n")) {
    const [key, ...vals] = line.split("=");
    if (key && vals.length > 0 && !key.startsWith("#")) {
      process.env[key.trim()] = vals.join("=").trim();
    }
  }
} catch {}

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },
});
