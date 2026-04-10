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

And a chain of production hotfixes after the first Vercel deploy:

| Hotfix      | SHA       | Title                                                       |
| ----------- | --------- | ----------------------------------------------------------- |
| deploy      | `99b6cff` | Move vercel.json under apps/web; gc cron → daily (Hobby)    |
| 500 cascade | `146f99d` | Fix Next 16 proxy matcher export (`proxyConfig` → `config`) |
| ledger      | `ae3f484` | Backfill script: WebSocket adapter + opening-balance pass   |
| runtime     | `0055ef0` | Replace batch `$transaction` with HTTP-safe alternatives    |
| UX nit      | `a837b41` | `/favicon.ico` rewrite to `/favicon.png`                    |

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

## Production hotfixes

After the first `vercel --prod` deploy, a chain of five focused
commits landed to resolve issues that only surfaced against real
Vercel + Neon infrastructure. Every fix is documented inline in its
commit message; this section is the summary timeline.

### `99b6cff` — Vercel config location + Hobby plan cron limit

Two blockers on the first `vercel --prod` attempt:

1. **`vercel.json` at wrong path.** The Vercel CLI warned
   `"The vercel.json file should be inside of the provided root
directory"`. The project's root directory is `apps/web/`, not the
   repo root. Moved `vercel.json` → `apps/web/vercel.json`.
2. **Hobby plan cron ceiling.** The `/cron/gc` schedule was
   `0 * * * *` (hourly), rejected by Vercel with
   `"Hobby accounts are limited to daily cron jobs. This cron
expression would run more than once per day."`. Moved to
   `0 5 * * *` (daily 05:00 UTC). Sessions have 24h/7d TTLs and
   idempotency keys have a 24h TTL, so daily cleanup is sufficient.

All six other crons were already daily or less frequent, within
Hobby plan limits.

### `146f99d` — Next.js 16 `proxy.ts` matcher export name

**Symptom**: every static chunk under `/_next/static/` returned 307 →
`/login`. Browser console flooded with
`"Refused to apply style because its MIME type ('text/html') is not
a supported stylesheet MIME type"`. The login page itself returned 500.

**Root cause**: `apps/web/src/proxy.ts` exported its matcher config as
`export const proxyConfig = { matcher: [...] }`. Next.js 16's
`proxy.ts` requires the config to be exported as **`config`**, not
`proxyConfig` — the file-rename from `middleware.ts` kept `config`
as the canonical export name. With the wrong name, the matcher was
silently ignored and the proxy ran on every request including
`/_next/static/*` and `/api/v1/*`.

**Cascade that produced the 500 on `/login`**: The login page is a
server component that calls `getCurrentUser()` → `fetch('/api/v1/auth/me')`
during render. The proxy intercepted that API call, returned a 307
HTML redirect to `/login`, and the server component's
`response.json()` choked on HTML, throwing into the Next.js error
boundary.

**Fix**: rename `proxyConfig` → `config` in `apps/web/src/proxy.ts`
and update the `proxy.test.js` import. One line of code, three
cascading bugs resolved.

### Pending migrations caught out by the first production deploy

Between `146f99d` and `ae3f484`, the first authenticated member
session surfaced a 500 on `/api/v1/members/me/dashboard`. Root cause:
the Phase 1, 8, and 9 Prisma migrations were never applied to
production Neon. The deployed Prisma client expected columns
(`Loan.interestAccrued`, `Loan.lastAccrualAt`, etc.) that didn't
exist in the DB, so the first query with an `include: { loans }`
threw at Prisma.

Fix: `bunx prisma migrate deploy` against production.

```
Applying migration `20260410_phase1_ledger`
Applying migration `20260410_phase8_ai_realtime`
Applying migration `20260410_phase9_passkeys_i18n`
All migrations have been successfully applied.
```

**Lesson for future deploys**: run `prisma migrate deploy` against
the target database **before** the first `vercel --prod`, not after.
See `docs/rollout.md` §2.

### `ae3f484` — Ledger backfill: WebSocket adapter + opening-balance pass

Three bugs in the Phase 1 backfill script, all surfaced when running
it against production Neon for the first time:

1. **HTTP-mode transactions.** The script originally imported
   `prisma` from `apps/api/src/config/db.ts` which uses
   `PrismaNeonHttp`. HTTP mode can't hold transactions open, so
   `postJournal()`'s `prisma.$transaction` call threw
   `"Transactions are not supported in HTTP mode"`. Fix: the
   script now instantiates its own `PrismaClient` with the
   `PrismaNeon` WebSocket adapter.

2. **`PrismaNeon` constructor signature.** `PrismaNeon` in
   `@prisma/adapter-neon@7.5.0` takes a `PoolConfig` **object**
   (e.g. `new PrismaNeon({ connectionString })`), not a `Pool`
   **instance**. Passing a pre-built Pool crashed with
   `"No database host or connection string was set"`.

3. **Legacy seed data had no matching historical transactions.**
   After the transaction backfill loop, variance was 53.6M UGX:
   every member account's `Account.balance` was seeded directly
   without corresponding transaction rows. Added an
   **opening-balance reconciliation pass**: for each account where
   the ledger position doesn't match the seeded balance, post one
   `Dr OPENING_BALANCE_EQUITY / Cr MEMBER_SAVINGS` entry keyed by
   `opening-balance:<accountId>` (idempotent on re-run). This is
   the standard accounting-migration pattern.

   A new GL account `OPENING_BALANCE_EQUITY` (code `3200`, type
   `EQUITY`, normal `CREDIT`) was added to
   `packages/ledger/src/gl-accounts.ts` — now 23 accounts in the
   chart instead of 22.

Also added explicit `$transaction` timeouts
(`{ maxWait: 20_000, timeout: 30_000 }`) to survive Neon's
cold-start latency, and wrapped each account's opening-balance post
in a try/catch so one failure doesn't abort the whole batch.

**Verification** (run immediately after this commit against
production Neon):

| Metric                  | Value                    |
| ----------------------- | ------------------------ |
| Legacy transactions     | 29 backfilled, 2 skipped |
| Opening balances posted | 18                       |
| Accounts reconciled     | 20                       |
| Trial balance debits    | 71,270,000 UGX           |
| Trial balance credits   | 71,270,000 UGX           |
| Trial balance variance  | 0                        |
| Per-account variances   | 0                        |

`reconcile-ledger.ts` returned `variances: 0` on first run.
`ledgerEnabled` is now safe to flip in Edge Config.

### `0055ef0` — Replace batch `$transaction` with HTTP-safe alternatives

**Symptom**: after the migrations ran and the deploy updated,
`/api/v1/members/me/dashboard` still returned 500 for authenticated
members. The hydration error #418 came along for the ride because
the portal dashboard page's error boundary swapped the DOM between
SSR and client-side render.

**Root cause**: the same "HTTP mode can't hold transactions" error,
but this time in the LIVE API via the batch form of `$transaction`:

```ts
const [...] = await prisma.$transaction([
  prisma.transaction.findMany(...),
  prisma.transaction.findFirst(...),
  // ... 4 more reads
]);
```

`PrismaNeonHttp` rejects both callback and batch forms.

**Fix**: four call sites refactored to HTTP-safe shapes:

1. `member.service.ts:147` — 6 parallel reads, replaced with
   `Promise.all`. No atomicity needed since they're all SELECTs.
2. `auth.service.ts:193` (changePassword) — update password +
   revoke sessions, now sequential awaits. Atomicity loss is
   benign: if the session revoke fails after the password update,
   other sessions live until their TTL but their cached password
   is invalidated on next API call.
3. `auth.service.ts:242` (issuePasswordResetTokenForUser) —
   delete old tokens + create new one, sequential awaits.
4. `auth.service.ts:307` (confirmPasswordReset) — 4-statement
   write path (update password → mark token used → delete other
   tokens → revoke sessions), sequential awaits. Ordering chosen
   so any partial-failure leaves the user in a recoverable state
   with no security exposure.

Each refactored call has an inline comment explaining the atomicity
trade-off.

**Known tech debt (not fixed in this commit)**: 13 more
callback-form `$transaction` uses in write paths (transaction
creation, loan approval, application approval, GDPR delete, etc.)
will also throw when their endpoints are triggered. They're
deferred to a dedicated "Phase 9.3: WebSocket client for
transactional writes" — either a second shared Prisma client that
uses `PrismaNeon` for writes, or per-call on-demand instantiation
similar to the backfill script.

### `a837b41` — `/favicon.ico` 404

Tiny fix for a cosmetic DevTools warning. Browsers unconditionally
request `/favicon.ico` on the first page load regardless of what
`<link rel="icon">` the HTML declares. The repo ships only
`favicon.png` (`app/layout.tsx` `metadata.icons.icon`), so every
fresh session logged a 404.

Added a `next.config.ts` rewrite mapping `/favicon.ico` →
`/favicon.png`. Modern browsers accept PNG bytes as a favicon
regardless of the URL's extension.

## Production deployment state

|                              | Value                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Current `main` head          | `a837b41`                                                                                                                                        |
| Production deployment        | `dpl_Ft6o5Av8h3Mwe3d2N2NvsrjEy6NP` — commit `a837b41`                                                                                            |
| Production URL               | https://iffe-sacco.vercel.app                                                                                                                    |
| Prisma migrations applied    | All 7 (through Phase 9)                                                                                                                          |
| Ledger state                 | 47 journal entries posted, trial balance balanced to 0                                                                                           |
| `ledgerEnabled` feature flag | **still false** — safe to flip but not yet flipped                                                                                               |
| Missing env vars             | `ALLOWED_ORIGINS`, `APP_BASE_URL`, `CREDENTIALS_KEK`, `CRON_SECRET`, `SENTRY_DSN` (Phase 2/4 hardening — non-blocking for current functionality) |
