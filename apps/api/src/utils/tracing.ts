/**
 * OpenTelemetry bootstrap — Phase 4.
 *
 * Activates when OTEL_EXPORTER_OTLP_ENDPOINT is set (Axiom, Grafana
 * Tempo, Honeycomb, Vercel OTEL drain, etc.). Otherwise it's a no-op
 * so local/dev boots have zero overhead.
 *
 * Exports:
 *   - `startTracing()` — call once from app bootstrap (initializes SDK).
 *   - `withSpan(name, fn)` — wrap a critical section in a span.
 *   - `recordException(err)` — attach an error to the current span.
 *
 * Wire it in by importing `startTracing()` at the top of src/index.ts
 * (standalone) or apps/api/api/_app.mjs entry for Vercel Fluid Compute.
 */
// @ts-nocheck

let sdk: any = null;
let initialized = false;

export async function startTracing(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;

  try {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = await import("@opentelemetry/auto-instrumentations-node");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import("@opentelemetry/semantic-conventions");

    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: "iffe-api",
        [ATTR_SERVICE_VERSION]: process.env.APP_VERSION || "dev",
        "deployment.environment": process.env.NODE_ENV || "development",
      }),
      traceExporter: new OTLPTraceExporter({ url: endpoint }),
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
          "@opentelemetry/instrumentation-http": { enabled: true },
        }),
      ],
    });

    sdk.start();
  } catch (err) {
    // OTel deps not installed — fail open so the app can still boot.
    // eslint-disable-next-line no-console
    console.warn(
      "[tracing] OpenTelemetry deps unavailable — tracing disabled:",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Wrap an async operation in a span. If OTel isn't initialized, runs the
 * function directly with no overhead.
 */
export async function withSpan<T>(name: string, fn: (span?: any) => Promise<T>): Promise<T> {
  if (!initialized || !sdk) return fn(undefined);
  try {
    const api = await import("@opentelemetry/api");
    const tracer = api.trace.getTracer("iffe-api");
    return await tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: api.SpanStatusCode.OK });
        return result;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({ code: api.SpanStatusCode.ERROR, message: (err as Error).message });
        throw err;
      } finally {
        span.end();
      }
    });
  } catch {
    return fn(undefined);
  }
}

export async function recordException(err: Error): Promise<void> {
  if (!initialized) return;
  try {
    const api = await import("@opentelemetry/api");
    const span = api.trace.getActiveSpan();
    if (span) {
      span.recordException(err);
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: err.message });
    }
  } catch {
    // no-op
  }
}
