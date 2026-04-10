/**
 * Structured logger (Pino) with request-bound child loggers.
 *
 * In production emits JSON lines suitable for log drains (Axiom, Datadog, etc).
 * In development uses pino-pretty for readability.
 *
 * Use `logger` for top-level boot/one-off logs.
 * Use `c.get("logger")` inside request handlers (bound via requestId middleware)
 * to get a child logger that includes requestId, userId, route.
 */
import pino, { type Logger } from "pino";

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : isTest ? "silent" : "debug"),
  base: {
    service: "iffe-api",
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["x-csrf-token"]',
      "password",
      "newPassword",
      "currentPassword",
      "token",
      "secret",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.accessKey",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
  transport:
    !isProd && !isTest
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname,service,env",
          },
        }
      : undefined,
});

export type { Logger };
