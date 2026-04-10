# Observability

How to see what the IFFE SACCO platform is doing, in production and in
preview. If you cannot answer "is this healthy right now?" in < 30
seconds from the links in this doc, file a ticket to improve it.

## Stack

| Layer | Tool | Source of truth for |
|---|---|---|
| Errors | **Sentry** (via Vercel Marketplace) | Unhandled exceptions, stack traces, release tagging, user-impact grouping |
| Logs | **Pino → Vercel Log Drain → Axiom** | Structured request logs with request ID, user ID, latency |
| Traces | **OpenTelemetry → OTLP endpoint** (Vercel OTEL drain, Honeycomb, or Grafana Tempo) | Cross-service spans, Prisma query timing, workflow step boundaries |
| Metrics | **OTEL → Grafana Cloud** | SLIs, business metrics, dashboards |
| Uptime | **Vercel dashboard + external probe (e.g. Better Stack)** | Public-facing availability |
| Alerts | **PagerDuty / Opsgenie** triggered from Sentry + Grafana | On-call routing |

## SLIs (Service-Level Indicators)

Measure these. Alert on these. Put them on a wall-mounted dashboard.

### Platform
- **API request success rate** (`2xx + 3xx` / total, excluding `4xx` caused by user input) — target ≥ 99.9%.
- **API P95 latency** per route bucket — target ≤ 300 ms for read, ≤ 800 ms for financial writes.
- **`/ready` healthcheck success** — target 100% over any 5-minute window.
- **Cold start rate** — track and alert only if ≥ 10% sustained (Fluid Compute should keep this low).

### Financial
- **Ledger variance** (`trial balance abs(variance)`) — target **exactly zero**. Any non-zero number is a P0.
- **Workflow completion rate** (`completed` / `started`) — target ≥ 99.5%. Below that, investigate pending runs.
- **Daily accrual latency** — time from 01:00 UTC trigger to all savings accounts accrued — target ≤ 10 min.
- **Reconcile job outcome** — target 100% pass rate. One failure = page on-call.

### Security
- **Auth failure rate** — track baseline; alert on 5× baseline sustained for 5 min (brute force indicator).
- **BotID blocks** — trend only; spikes are informational unless paired with auth-failure spike.
- **CSRF reject count** — should be near zero in production; sustained hits indicate client drift or attack.

### Business
- **Daily active members** (users with ≥ 1 authenticated read)
- **Transactions posted per day** (count + Money-sum)
- **New loan applications / approvals per day**

## Dashboards

Three dashboards, one per audience:

### 1. Financial — primary audience: treasurer, chairman
- Running trial balance (should always display ✅ balanced)
- Total member liabilities (sum of 2100/2110/2120)
- Loans outstanding (1200) + interest accrued (1210)
- Today's deposits, withdrawals, disbursements (count + amount)
- Workflow runs: running / completed / failed pie

### 2. Platform — primary audience: on-call engineer
- P50 / P95 / P99 API latency per method
- Error rate (5xx only, grouped by route)
- Prisma query count + slowest query
- Cold start count
- `/ready` pass rate
- Fluid Compute concurrency

### 3. Security — primary audience: security lead
- Auth failures / success ratio
- Rate limit triggers
- Account lockouts active now
- BotID blocks + verdicts
- CSRF rejections
- Admin actions on sensitive entities (payment gateways, user roles)

## Correlation

Every log, span, and error ships with a **request ID** (`x-request-id`
header, generated if absent). Use it as the universal stitch key:

1. User reports a bug → ask for the request ID (visible in any 4xx/5xx
   response body as `requestId`).
2. Search Sentry with `requestId:<value>` → find the exception.
3. Search Axiom with `requestId:<value>` → find the request/response log
   pair and every `child.info` between them.
4. Open the trace in your OTEL viewer with the same ID → see the span tree.

## Alert routing

| Alert | Severity | Route |
|---|---|---|
| Ledger variance non-zero | P0 | PagerDuty oncall-platform + #incidents |
| `/ready` failing 2 min | P0 | PagerDuty + status page |
| Workflow run failed (any) | P1 | #oncall-alerts |
| Auth failure spike 5× | P1 | #oncall-alerts + security lead |
| Sentry new issue (5xx) | P2 | #oncall-alerts |
| Cron job failed | P2 | #oncall-alerts |
| Coverage threshold breach | P3 | PR reviewer |

## Enable OpenTelemetry

Set `OTEL_EXPORTER_OTLP_ENDPOINT` in Vercel env. The API bootstrap
calls `startTracing()` which dynamically imports the OTel SDK only if
that env var is present, so local boots stay lean.

```bash
vercel env add OTEL_EXPORTER_OTLP_ENDPOINT production
# paste e.g. https://otlp.grafana.net:443 or your Vercel drain URL
```
