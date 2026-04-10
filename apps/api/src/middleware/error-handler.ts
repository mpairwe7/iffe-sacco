import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod/v4";
import { logger } from "../utils/logger";

/**
 * Global Hono error handler.
 *
 * - Returns shaped JSON for known error types (HTTPException, ZodError).
 * - Masks details in production, surfaces them in dev.
 * - Always echoes the correlation ID so clients can reference it in support.
 * - Logs with the request-bound logger if available (adds requestId/userId).
 * - Reports 5xx errors to Sentry when configured.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  const reqLogger = (c.get("logger") as typeof logger | undefined) ?? logger;
  const requestId = (c.get("requestId") as string | undefined) ?? undefined;

  if (err instanceof HTTPException) {
    // 4xx client errors: log at info/warn, never to Sentry.
    reqLogger.warn(
      { event: "http_exception", status: err.status, message: err.message },
      "handled HTTPException",
    );
    return c.json(
      { success: false, message: err.message, requestId },
      err.status,
    );
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".");
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }
    reqLogger.warn(
      { event: "validation_error", errors },
      "request failed validation",
    );
    return c.json(
      { success: false, message: "Validation failed", errors, requestId },
      422,
    );
  }

  // Unhandled 5xx: log with full stack, ship to Sentry if available.
  reqLogger.error(
    { event: "unhandled_error", err: { message: err.message, stack: err.stack } },
    "unhandled error in request",
  );

  // Best-effort Sentry capture; no-op if not configured.
  try {
    // Dynamic import so local/test boots don't require the dep to be installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = (globalThis as any).__sentry__;
    if (Sentry?.captureException) {
      Sentry.captureException(err, { tags: { requestId } });
    }
  } catch {
    // ignore
  }

  const isProduction = process.env.NODE_ENV === "production";
  return c.json(
    {
      success: false,
      message: isProduction ? "Internal server error" : err.message,
      requestId,
    },
    500,
  );
};
