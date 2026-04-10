/**
 * Next.js instrumentation hook.
 *
 * Runs once when the server starts in each runtime. Responsible for
 * booting Sentry in the correct runtime context.
 *
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Next.js 16 `onRequestError` hook — delegated to Sentry's captureRequestError.
// Typed with `unknown` because Sentry's request-info type and the Next hook's
// `Request` type have drifted across minor Sentry releases; the runtime
// handler is resilient to both shapes and the net effect is a no-op when
// SENTRY_DSN is unset.
export async function onRequestError(err: unknown, request: unknown, context: unknown) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  const capture = Sentry.captureRequestError as (err: unknown, req: unknown, ctx: unknown) => void;
  capture(err, request, context);
}
