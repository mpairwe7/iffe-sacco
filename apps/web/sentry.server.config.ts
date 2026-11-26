/**
 * Sentry config (server). Loaded by Next.js via `instrumentation.ts`.
 * DSN is read from SENTRY_DSN — if unset (local dev without Sentry),
 * initialization is a no-op.
 */
import * as Sentry from "@sentry/nextjs";
import { sentryDataCollection } from "./sentry-data-collection";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    profileSessionSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || 0),
    profileLifecycle: "trace",
    dataCollection: sentryDataCollection,
    ignoreErrors: [
      // Client-initiated aborts
      "AbortError",
      "The operation was aborted",
    ],
  });
}
