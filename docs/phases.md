# Phase History

Chronological log of the production-readiness phases that brought the
platform from a working prototype to a verified-green build. Each
phase is a single commit (occasionally plus a small follow-up) on
`main`, so the SHA is the source of truth — this page is the
navigable summary.

Every phase is additive and behind a feature flag where applicable.
Nothing in Phases 0–9.2 breaks existing behaviour; new subsystems
stay dormant until the corresponding env var or `ledgerEnabled`-style
flag is flipped.

## At a glance

| Phase | SHA       | Title                                        | Files | Lines         |
| ----- | --------- | -------------------------------------------- | ----- | ------------- |
| 0     | `2669459` | Foundation & Safety Net                      | 23    | +794 −18      |
| 1     | `90fd427` | Ledger & Financial Correctness               | 27    | +2,500 −64    |
| 2     | `92de12c` | Security Hardening                           | 15    | +1,068 −63    |
| 3     | `8de086a` | Automation & Reconciliation                  | 5     | +698          |
| 4     | `374609e` | Observability & Ops                          | 6     | +471 −1       |
| 5     | `fb92510` | Testing                                      | 9     | +418          |
| 6     | `549f291` | UX & Performance primitives                  | 5     | +415          |
| 7     | `ba500ac` | Compliance & Advanced                        | 4     | +514          |
| 8     | `eec776d` | AI Assistant & Real-time Notifications       | 20    | +2,246        |
| 9     | `3886860` | Offline Queue, i18n (EN + Luganda), Passkeys | 19    | +1,396 −6     |
| 9.1   | `08ad026` | Wire latent primitives into app shell        | 8     | +95 −121      |
| 9.1.x | `adc3476` | Fix push subscription Uint8Array type        | 1     | +10 −2        |
| 9.2   | `862260e` | CI pipeline fixes + Prettier format pass     | 211   | +6,743 −3,571 |

Plus six untracked-WIP checkpoint commits landed after Phase 9.2:
per-role dashboard layouts, `/logout` route handler, `/staff` role,
member portal dashboard, `useHasMounted` hook, proxy + member route
tests.

## Phase 0 — Foundation & Safety Net

**Goal:** scaffolding that lets every subsequent phase ship safely.

- `.github/workflows/ci.yml` — install → typecheck → lint → test → build
  → E2E smoke. Cached bun install, dep-frozen on PR.
- `.github/workflows/security-scan.yml` — gitleaks, dependency-review,
  CodeQL (runs on GitHub runners, not Vercel Cron).
- Structured **Pino** logger with PII/secret redaction.
- Request-ID middleware that binds a child logger + correlation ID to
  every Hono request and echoes `x-request-id` on the response.
- Real `/health`, `/live` (fast), `/ready` (2s DB ping race).
- Global error handler now includes the request ID and ships 5xx
  errors to Sentry when configured.
- **Sentry** wiring: `sentry.server.config.ts`, `sentry.client.config.ts`,
  `sentry.edge.config.ts`, `instrumentation.ts` hook. All no-op when
  `SENTRY_DSN` is unset.
- Baseline security headers in `next.config.ts` (HSTS, XFO,
  Referrer-Policy, Permissions-Policy, COOP, CORP).
- Feature-flag scaffold at `apps/web/src/lib/flags.ts` with Edge Config
  read path and typed defaults.
- **Husky + lint-staged** pre-commit hook.
- `.env.example` for both apps covering Phase 0–9 env vars.
- `docs/runbooks/` index + Prisma rollback runbook.

## Phase 1 — Ledger & Financial Correctness

**Goal:** money math is correct, durable, and reconstructable.

- New **`@iffe/ledger`** workspace package:
  - `Money` — branded Decimal wrapper with banker's rounding,
    rejects raw JS floats, uses `decimal.js-light`.
  - `GL_ACCOUNTS` — 23-entry chart of accounts (assets, liabilities,
    equity, income, expense) with normal-balance side.
  - `JournalEntry.builder()` — enforces `sum(debits) == sum(credits)`
    at build time; unbalanced entries throw.
- Prisma schema additions (migration `20260410_phase1_ledger`):
  - `GlAccount`, `JournalEntry`, `JournalLine` — append-only ledger.
  - `IdempotencyKey` — HTTP-level request dedupe (24h TTL).
  - `WorkflowRun`, `WorkflowStep` — crash-safe saga log.
  - `Transaction` widened to `idempotencyKey` + `journalEntryId` +
    `externalReference` + `reversalOfId`; all Money columns widened
    to `Decimal(18, 4)`.
  - `Loan` gained `interestAccrued`, `lateFeesAccrued`,
    `lastAccrualAt`, `overdueSince`.
  - `Pledge` gained `paidAmount`, `paidAt`, `updatedAt`.
- `ledger.service.ts` — `postJournal()` is the only blessed write
  path; idempotent on `entry.idempotencyKey`; provides
  `trialBalance()`, `accountBalance()`, `memberAccountLedgerBalance()`.
- `idempotency.ts` middleware — `Idempotency-Key` header support for
  POST/PUT/PATCH.
- `interest.service.ts` rewritten with Money helpers; delegates
  posting to the savings-accrual workflow.
- Workflows (WDK-compatible shape — `runWorkflow()` currently a thin
  Prisma-transaction wrapper, swappable for real Vercel Workflow
  DevKit `start()` without business-logic changes):
  - `deposit.workflow.ts`
  - `withdraw.workflow.ts`
  - `loan-disbursement.workflow.ts`
  - `loan-repayment.workflow.ts`
  - `pledge-payment.workflow.ts`
  - `interest-accrual.workflow.ts` (savings + loans)
- `scripts/backfill-ledger.ts` — synthesizes journal entries from
  legacy `transactions` rows; exits non-zero if post-backfill
  variance is non-zero.
- `scripts/reconcile-ledger.ts` — ongoing trial-balance + projection
  drift check; runs daily from cron.
- Unit tests (`packages/ledger/src/__tests__/`): `money.test.ts` +
  `journal.test.ts`.
- `docs/runbooks/ledger-imbalance.md` — diagnostic SQL + resolution
  scenarios.

## Phase 2 — Security Hardening

**Goal:** close publicly-exploitable gaps.

- **CORS lockdown** — `apps/web/src/app/api/v1/[[...path]]/route.ts`
  no longer sends `Access-Control-Allow-Origin: "*"`. Reads
  `ALLOWED_ORIGINS` env and echoes only matching origins (fail-closed
  in production).
- **CSRF double-submit cookie** (`middleware/csrf.ts`) — HMAC-signed
  nonce cookie + header comparison, timing-safe equality. Path-prefix
  allowlist for login/register/reset/logout/passkey-login.
- **Envelope encryption** for `PaymentGateway.config` — AES-256-GCM
  with random 96-bit IVs (`utils/crypto.ts`); legacy rows migrated
  on first update; redacted reads unless `?withSecrets=1` (audited).
- **Per-account login lockout** — 10 attempts / 15 min window tracked
  per normalized email (`middleware/account-lockout.ts`).
- **Proxy JWT `sub`/`sid` validation** — `proxy.ts` now rejects
  tokens missing subject or session id, not just role/exp.
- **Resend** email scaffold + password-reset template. Reset URL no
  longer logged to console.
- **CSP + HSTS + COOP** in `next.config.ts` (no Google Fonts origins
  since `next/font` self-hosts).
- README default credentials removed.
- `docs/runbooks/secrets-rotation.md` — quarterly cadence procedures.

## Phase 3 — Automation & Reconciliation

**Goal:** the books close themselves.

- `/cron/*` endpoints (`routes/cron.routes.ts`):
  - `/accrue-savings-interest` — daily, per-account savings accrual.
  - `/accrue-loan-interest` — daily, per-loan loan accrual.
  - `/detect-overdue-loans` — flips active loans past due date.
  - `/reconcile` — trial balance + projection-drift check; pages
    on-call on non-zero variance.
  - `/pledge-reconciliation` — pledged vs paid summary.
  - `/gc` — hourly session + idempotency-key pruning.
  - `/month-end-close` — monthly trial-balance snapshot.
  - Auth via `x-vercel-cron` header (prod) or `CRON_SECRET` (dev).
- Ledger-backed reports (`services/report.service.ts`):
  - `trialBalanceReport(asOf?)`, `balanceSheetReport(asOf?)`,
  - `incomeStatementReport(from, to)`,
  - `generalLedgerReport(code, from?, to?)`,
  - `memberStatementReport(accountId, from?, to?)`,
  - `loanAgingReport()`.
- Report endpoints under `/reports/*`.
- `vercel.json` registers every cron with Vercel Cron (platform-native).

## Phase 4 — Observability & Ops

**Goal:** know what broke before the user does.

- `utils/tracing.ts` — OpenTelemetry bootstrap, dynamic import of
  `@opentelemetry/sdk-node` only when `OTEL_EXPORTER_OTLP_ENDPOINT`
  is set. `withSpan()` / `recordException()` helpers.
- `docs/observability.md` — SLIs (platform / financial / security /
  business), dashboards, request-ID correlation recipe, alert
  routing table.
- Runbooks: `pitr-restore.md`, `stuck-workflow.md`, `auth-incident.md`.

## Phase 5 — Testing

**Goal:** changes to money code are uncomfortable to ship without tests.

- Property-based tests (`fast-check`) in `@iffe/ledger`:
  - `money.property.test.ts` — addition commutes / is associative,
    zero is additive identity, rounding is idempotent, sum equals
    fold, comparisons are total.
  - `journal.property.test.ts` — balanced sequences always produce
    balanced entries; mismatched credit always throws.
- Unit test for `interest.service.ts` with mocked Prisma client
  validating exact Decimal math (`9863.01` and `4315.07` for a
  30-day preview).
- Playwright config + `health.spec.ts` smoke test + `auth.spec.ts`
  critical path.
- CI `e2e` job gated after typecheck/lint.

## Phase 6 — UX & Performance primitives

**Goal:** shared building blocks so the Phase 6 playbook can be
applied to existing routes incrementally.

- `components/ui/empty-state.tsx` — card/table/inline variants, aria-live.
- `components/ui/live-region.tsx` — `AnnouncerProvider` + `useAnnouncer()`.
- `lib/cache-helpers.ts` — typed cache lifetimes + canonical tag
  generators for Next.js 16 Cache Components.
- PWA offline baseline in `public/sw.js`.
- `docs/ux-performance.md` playbook.

> A duplicate `components/ui/field.tsx` was shipped here by mistake
> and deleted in Phase 9.1 in favour of the pre-existing
> `form-field.tsx`.

## Phase 7 — Compliance & Advanced

**Goal:** regulator-ready and fraud-resistant.

- GDPR endpoints (`routes/gdpr.routes.ts`):
  - `GET /gdpr/members/:id/export` — full JSON dump, audited.
  - `POST /gdpr/members/:id/delete` — PII anonymization with open-loan
    and non-zero-balance guards; written reason required; journal
    entries retained for regulatory compliance.
- Fraud scoring scaffold (`services/fraud-scoring.service.ts`):
  - Rule engine: amount anomaly vs 90-day average, velocity, unusual
    hour (EAT), withdrawal-type risk weighting.
  - Optional Vercel AI Gateway narrative via Claude Haiku 4.5.
  - Thresholds: `60 → review`, `85 → block`.
- `docs/compliance.md` — regulatory surface area (UMRA/DPPA/AML),
  data subject rights, retention policy per data class, PII
  encryption matrix, breach notification procedure.

## Phase 8 — AI Assistant & Real-time Notifications

**Goal:** conversational layer + live notifications.

- New **`@iffe/assistant`** workspace package:
  - `prompts.ts` — audience-aware system prompts (member / staff / admin).
  - `tools.ts` — Zod-schema tool registry with per-audience access
    (`getMyBalance`, `getMyTransactions`, `getMyLoans`,
    `checkLoanEligibility`, `explainInterest`, `raiseAction`,
    `raiseWithHuman`, admin tools).
- Prisma schema additions: `AssistantConversation`, `AssistantMessage`,
  `PushSubscription`, `NotificationPreference`, `Notification`,
  `AnomalyAlert`.
- `/assistant/chat` — SSE streaming with a 5-round tool-calling agent
  loop via Vercel AI Gateway (default model: Claude Haiku 4.5).
  Graceful stub when gateway env vars are unset.
- `notification.service.ts` — `notify()` fans out to in-app (always) +
  push (VAPID) + email (Resend), respecting per-user preferences.
- `/notifications/*`, `/anomaly-inbox/*`, `/realtime/dashboard/*`
  (bounded-SSE with 240s window + poll-friendly `/snapshot` fallback).
- `components/assistant/chat-window.tsx`, `hooks/use-push-subscription.ts`,
  `hooks/use-dashboard-stream.ts`.
- `docs/ai-assistant.md`.

## Phase 9 — Offline Queue, i18n, Passkeys

**Goal:** make the app work for real members — poor connectivity,
local language, modern auth.

- `lib/offline-queue.ts` — IndexedDB-backed mutation queue with
  `Idempotency-Key` headers so server-side replay dedupe
  (Phase 1) guarantees exactly-once semantics.
- `hooks/use-offline-queue.ts` + `components/offline-banner.tsx`.
- Bilingual i18n (English + Luganda): `i18n/config.ts`, lazy message
  loaders, `I18nProvider` with minimal ICU-style formatter (plurals),
  `components/locale-switcher.tsx`. Persistence: cookie → profile →
  Accept-Language → default.
- Passkey auth: new `Passkey` and `WebAuthnChallenge` models;
  `services/passkey.service.ts` wraps `@simplewebauthn/server`;
  `/passkeys/register/{options,verify}`, `/passkeys/login/{options,verify}`.
  `hooks/use-passkey.ts` wraps `@simplewebauthn/browser`.
- `docs/phase-9.md` — three-strand design doc with rollout plan.

## Phase 9.1 — Wire latent primitives

**Goal:** make Phase 6/8/9 primitives actually active in the app shell.

- Deleted the duplicate `field.tsx` (canonical `form-field.tsx` remains).
- `providers.tsx` now mounts `<I18nProvider>` and `<AnnouncerProvider>`
  around the existing Query/Theme/Tooltip stack.
- `app/layout.tsx` resolves locale from `cookies()`/`headers()` once
  per request, passes `locale` + `messages` to `<Providers>`, sets
  `<html lang={locale}>`, and renders `<OfflineBanner />`.
- Accessibility: `aria-current="page"` on active bottom-nav tab;
  `aria-describedby` + `aria-label` + `aria-pressed` + `aria-hidden`
  on the login form.
- `@next/bundle-analyzer` integrated behind `ANALYZE=true`.

## Phase 9.2 — CI pipeline fixes + Prettier format pass

**Goal:** end-to-end green locally.

Fixed every error uncovered by running the full CI pipeline:

- **Money types** — `Decimal.Value` → `Numeric` alias (decimal.js-light
  doesn't expose `Decimal.Value`); dropped `.isNaN()` check.
- **Tools filter** — widened `t.audiences` to `readonly string[]` so
  the `as const satisfies` narrowing doesn't collapse to `never`.
- **CSRF opt-out refactor** — path-prefix allowlist replaces
  `c.set("csrf:skip")` which fought Hono's typed context.
- **`crypto.ts` destructuring** — explicit tuple cast after length check.
- **`interest.routes.ts`** — `totalInterest` → `totalCredited` (Phase 1
  rename that was missed).
- **`instrumentation.ts`** — Sentry 9 signature vs Next 16 `onRequestError`.
- **`use-passkey.ts` shadowing** — inner `const options =` was
  shadowing the outer `UsePasskeyOptions` parameter, a real runtime bug.
- **Playwright separation** — scoped `bun test` to `src/` so
  Playwright `e2e/*.spec.ts` files aren't picked up by the bun
  test runtime.
- **Mock path fix** — `interest.service.test.ts` corrected to
  `../../config/db`.
- **Lockfile regenerated** for all deps added across phases.
- **Prettier format pass** across ~200 tracked files.

**Verification** (run locally on this branch, captured in commit
message):

| Step                                         | Result                                                 |
| -------------------------------------------- | ------------------------------------------------------ |
| `bun install`                                | 530 packages                                           |
| `bun run --filter @iffe/api db:generate`     | Prisma client v7.5.0                                   |
| `bun run typecheck`                          | web 0 errors · api 0 errors                            |
| `bun run --filter web lint` + `format:check` | clean                                                  |
| `bun run test`                               | web 13/13 · api 4/4                                    |
| `bun run build`                              | api 1.78 MB · web Next 16 Turbopack 25.3 s · 44 routes |

## Post-9.2 checkpoints

Six untracked-WIP features that had been sitting on the working tree
landed as focused commits on top of Phase 9.2:

| Commit    | Title                                             |
| --------- | ------------------------------------------------- |
| `1c0f1d0` | `/logout` route handler for hard cookie sweep     |
| `bcf5bce` | Per-role dashboard route layouts                  |
| `4992b17` | Staff role dashboard (`/staff`)                   |
| `87165f0` | Member portal dashboard + `MemberDashboardView`   |
| `27d1ac5` | `useHasMounted` hook                              |
| `689304b` | Proxy role-routing + member dashboard route tests |
