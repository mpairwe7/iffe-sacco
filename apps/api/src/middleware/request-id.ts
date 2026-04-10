/**
 * Request ID + logger binding middleware.
 *
 * Ensures every request has a correlation ID (from inbound `x-request-id`
 * header or freshly generated) and attaches a child logger to the Hono
 * context. Downstream handlers/services can read the logger with
 * `c.get("logger")` and the ID with `c.get("requestId")`.
 *
 * The ID is echoed on the response so clients and edge logs can correlate.
 */
import { createMiddleware } from "hono/factory";
import { randomUUID } from "node:crypto";
import { logger, type Logger } from "../utils/logger";

export type RequestContextEnv = {
  Variables: {
    requestId: string;
    logger: Logger;
  };
};

export const requestContext = createMiddleware<RequestContextEnv>(async (c, next) => {
  const inbound = c.req.header("x-request-id");
  const requestId = inbound && /^[a-zA-Z0-9_-]{8,128}$/.test(inbound) ? inbound : randomUUID();
  const start = performance.now();

  const child = logger.child({
    requestId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
  });

  c.set("requestId", requestId);
  c.set("logger", child);
  c.header("x-request-id", requestId);

  child.info({ event: "request.start" }, "request started");

  try {
    await next();
  } finally {
    const durationMs = Math.round(performance.now() - start);
    child.info(
      {
        event: "request.end",
        status: c.res.status,
        durationMs,
      },
      "request completed",
    );
  }
});
