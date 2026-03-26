import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod/v4";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack?.split("\n")[1]);

  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status);
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".");
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }
    return c.json({ success: false, message: "Validation failed", errors }, 422);
  }

  const isProduction = process.env.NODE_ENV === "production";
  return c.json({
    success: false,
    message: isProduction ? "Internal server error" : err.message,
  }, 500);
};
