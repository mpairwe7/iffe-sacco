# Rollout Checklist

Everything a deploying engineer has to do, in order, to take
`main` → production for the first time. Read this top-to-bottom
before touching anything; most of the environment-variable setup is
idempotent but a few steps are destructive-when-skipped (secrets
rotation, migration application).

## Pre-flight

- [ ] `main` is green on CI (`.github/workflows/ci.yml`)
- [ ] Backups enabled on Neon (automated, minimum weekly, 7-day retention)
- [ ] Vercel project linked to the repo (`.vercel/project.json`)
- [ ] On-call rota staffed for the launch window
- [ ] Announcement posted in `#incidents`

## 1. Environment variables

Set every variable below in **Vercel Production** _and_ **Preview**
before the first deploy. Use `vercel env add` or the dashboard; never
hard-code into source. Most have placeholders in `apps/api/.env.example`
and `apps/web/.env.example`.

### Core

| Variable          | Source                                              | Notes                                  |
| ----------------- | --------------------------------------------------- | -------------------------------------- |
| `DATABASE_URL`    | Neon dashboard                                      | Pooled connection string               |
| `JWT_SECRET`      | `openssl rand -base64 48`                           | Signs session JWTs                     |
| `APP_BASE_URL`    | e.g. `https://sacco.example.org`                    | Derives WebAuthn RP ID                 |
| `CORS_ORIGIN`     | Comma-list of frontend origins                      | First entry is default                 |
| `ALLOWED_ORIGINS` | Same as `CORS_ORIGIN`, used by the Next proxy route | Phase 2 — **fail-closed without this** |
| `NODE_ENV`        | `production`                                        |                                        |

### Auth & lockout (Phase 2)

| Variable                       | Default | Notes     |
| ------------------------------ | ------- | --------- |
| `SESSION_TTL_HOURS`            | 24      |           |
| `REMEMBER_ME_SESSION_TTL_DAYS` | 7       |           |
| `PASSWORD_RESET_TTL_MINUTES`   | 30      |           |
| `AUTH_RATE_LIMIT_WINDOW_MS`    | 900000  | 15 min    |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | 5       | Per-IP    |
| `ACCOUNT_LOCKOUT_WINDOW_MS`    | 900000  | 15 min    |
| `ACCOUNT_LOCKOUT_MAX_ATTEMPTS` | 10      | Per-email |

### Encryption (Phase 2)

| Variable          | Source                    | Notes                                    |
| ----------------- | ------------------------- | ---------------------------------------- |
| `CREDENTIALS_KEK` | `openssl rand -base64 32` | Envelope key for `PaymentGateway.config` |

### Email (Phase 2 — optional but recommended)

| Variable            | Source                                           | Notes                                |
| ------------------- | ------------------------------------------------ | ------------------------------------ |
| `RESEND_API_KEY`    | Resend dashboard                                 | Password reset + notification emails |
| `RESEND_FROM_EMAIL` | e.g. `"IFFE SACCO <no-reply@sacco.example.org>"` |                                      |

### Cron (Phase 3)

| Variable      | Source                    | Notes                                  |
| ------------- | ------------------------- | -------------------------------------- |
| `CRON_SECRET` | `openssl rand -base64 32` | Auth for `/cron/*` outside Vercel Cron |

### Observability (Phase 0 / 4)

| Variable                      | Source                                    | Notes                             |
| ----------------------------- | ----------------------------------------- | --------------------------------- |
| `SENTRY_DSN`                  | Sentry dashboard (via Vercel Marketplace) | Error reporting                   |
| `NEXT_PUBLIC_SENTRY_DSN`      | Same value                                | Browser-side Sentry               |
| `SENTRY_ENVIRONMENT`          | `production`                              |                                   |
| `SENTRY_TRACES_SAMPLE_RATE`   | `0.1`                                     |                                   |
| `LOG_LEVEL`                   | `info` in prod, `debug` in preview        | Pino threshold                    |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional                                  | Grafana Tempo / Honeycomb / Axiom |

### Assistant (Phase 8 — optional)

| Variable             | Source                                | Notes                     |
| -------------------- | ------------------------------------- | ------------------------- |
| `AI_GATEWAY_URL`     | Vercel AI Gateway                     | Enables `/assistant/chat` |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway                     |                           |
| `ASSISTANT_MODEL`    | `anthropic/claude-haiku-4-5-20251001` | Default for latency       |
| `SUPPORT_PHONE`      | `"+256 700 000 000"`                  | Shown by `raiseWithHuman` |
| `SUPPORT_EMAIL`      | `"support@sacco.example.org"`         |                           |

### Web Push (Phase 8 — optional)

Generate VAPID keys once:

```bash
npx web-push generate-vapid-keys
```

| Variable            | Notes                              |
| ------------------- | ---------------------------------- |
| `VAPID_PUBLIC_KEY`  | Base64url                          |
| `VAPID_PRIVATE_KEY` | Base64url                          |
| `VAPID_SUBJECT`     | `"mailto:admin@sacco.example.org"` |

### Web app (Phase 9 / 9.1)

| Variable                  | Notes                                                |
| ------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`     | `/api/v1` for unified deployment                     |
| `EDGE_CONFIG`             | Vercel Edge Config connection — powers feature flags |
| `NEXT_PUBLIC_APP_VERSION` | `git rev-parse --short HEAD`                         |

## 2. Database migrations

> **⚠️ CRITICAL ORDERING**: Run `prisma migrate deploy` **BEFORE** the first
> `vercel --prod`, not after. The build step only regenerates the Prisma
> client; it does not apply migrations. If you deploy first and the live
> Prisma client expects columns that don't exist in the DB, every query
> with an `include` (e.g. `/api/v1/members/me/dashboard`) will 500.
>
> We learned this the hard way on the first production deploy — see
> `docs/phases.md` "Pending migrations caught out by the first
> production deploy" for the incident walk-through.

Apply every migration in order. These are additive only (Phase 1,
8, 9 all use `CREATE TABLE IF NOT EXISTS`) — safe to re-run.

```bash
# Pull prod env vars to your shell (stays in /tmp, gitignored)
vercel env pull /tmp/prod.env --environment production --yes

# Source the env so DATABASE_URL is available
set -a && source /tmp/prod.env && set +a

# Preview first. Do NOT run against production until the preview
# deploy is green.
cd apps/api
bun run db:generate
bunx prisma migrate status        # should say "N migrations have not yet been applied"
bunx prisma migrate deploy        # applies pending migrations in order

# Clean up
rm /tmp/prod.env
```

Expected state after deploy:

- **17 original tables** (User, Session, Member, Account, Transaction,
  Loan, Expense, WelfareProgram, Pledge, AuditLog, BankAccount,
  DepositRequest, WithdrawRequest, PaymentGateway, Application,
  Setting, PasswordResetToken).
- **Phase 1 tables** — `gl_accounts`, `journal_entries`,
  `journal_lines`, `idempotency_keys`, `workflow_runs`, `workflow_steps`.
  Plus widened `Decimal(18, 4)` columns on `loans`, `transactions`,
  `pledges`; new Loan fields `interestAccrued`, `lateFeesAccrued`,
  `lastAccrualAt`, `overdueSince`.
- **Phase 8 tables** — `assistant_conversations`, `assistant_messages`,
  `push_subscriptions`, `notification_preferences`, `notifications`,
  `anomaly_alerts`.
- **Phase 9 tables** — `passkeys`, `webauthn_challenges`.
- `users.locale` column added (Phase 9 i18n persistence).

## 3. Seed + credentials rotation

```bash
bun run --filter @iffe/api db:seed
```

This provisions role accounts and writes generated passwords to
`apps/api/prisma/.first-run-credentials.json` (gitignored). **Delete
this file after first login** and require every account flagged
`mustChangePassword` to rotate.

Never commit or paste seeded credentials anywhere.

## 4. Ledger backfill + reconciliation gate

**This is the most important step.** Do not flip the `ledgerEnabled`
feature flag until this sequence completes with zero variance.

The backfill script uses the **WebSocket** Neon adapter
(`PrismaNeon`), not the HTTP adapter the live API uses — because
`postJournal()` wraps writes in `$transaction` which HTTP mode
can't hold open. The script instantiates its own local
`PrismaClient` for this reason; no change to the shared client.

```bash
# Env setup (same env pull as Section 2)
vercel env pull /tmp/prod.env --environment production --yes
set -a && source /tmp/prod.env && set +a
cd apps/api

# Dry-run — validates inputs; no writes.
bun run ledger:backfill:dry

# Real run. Synthesizes JournalEntry + JournalLine rows from legacy
# `transactions` data, then a second pass posts opening-balance
# entries for any account whose seeded `Account.balance` isn't
# reflected in the historical transactions. Idempotent: each entry
# has a deterministic idempotencyKey (`legacy-backfill:<txnId>` or
# `opening-balance:<accountId>`), so re-running is a no-op.
bun run ledger:backfill

# Verify. Trial balance must equal zero AND every Account.balance
# must match its ledger projection.
bun run scripts/reconcile-ledger.ts

# Clean up
rm /tmp/prod.env
```

**Expected output from reconcile-ledger.ts**:

```json
{
  "event": "reconcile.complete",
  "variances": 0,
  "totalAccounts": 20,
  "trialBalance": {
    "debits": "71270000",
    "credits": "71270000",
    "variance": "0",
    "balanced": true
  }
}
```

(Actual numbers will vary with your seed data. The invariants are
`variances: 0`, `balanced: true`, `debits == credits`.)

### The opening-balance pass

Legacy seed data typically creates `Account.balance` values
directly (e.g. "Alice has 2,500,000 UGX savings") without matching
`transactions` rows for the historical deposits. The transaction
backfill alone will leave the ledger below the seeded balances.
The opening-balance pass closes that gap by posting one entry per
account:

```
Dr OPENING_BALANCE_EQUITY (code 3200, added in ae3f484)
Cr MEMBER_SAVINGS/CURRENT/FIXED (the member's liability account)
```

This is the standard accounting migration pattern. After the
backfill, `OPENING_BALANCE_EQUITY` holds the total of all legacy
opening balances (as a debit, which is unusual for an equity
account but expected during migration). The finance team should
later post a reclassification entry once they've audited the
actual cash position:

```
Dr CASH_ON_HAND          (whatever the real cash total is)
Cr OPENING_BALANCE_EQUITY (matching amount)
```

Any residual in `OPENING_BALANCE_EQUITY` after that reclassification
moves to `RETAINED_EARNINGS` or another specific equity account.

### Flipping the flag

Only after the reconcile step prints `variances: 0` and
`trialBalance.balanced: true`, flip the flag:

```bash
# Vercel Edge Config
vercel edge-config add-item flag:ledgerEnabled true
```

If any variance appears, follow [`runbooks/ledger-imbalance.md`](./runbooks/ledger-imbalance.md)
before proceeding.

## 5. GL chart of accounts seed

The first boot automatically reconciles the chart of accounts via
`seedGlAccounts()` in `services/gl-seed.service.ts`. If you want to
confirm before the first write:

```bash
curl -sS -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API/api/v1/reports/trial-balance" | jq
```

Expect every GL account from `packages/ledger/src/gl-accounts.ts`
listed with zero balances.

## 6. Vercel Cron registration

`apps/web/vercel.json` already declares every cron. No manual
action needed beyond deploying — Vercel picks them up and the first
tick happens at the next scheduled minute.

> **Note on file location**: `vercel.json` lives **inside** the
> configured root directory (`apps/web/`), not at the repo root.
> The Vercel CLI ignores a repo-root `vercel.json` when the project
> has a different root directory set and warns
> `"The vercel.json file should be inside of the provided root
directory"`. This was a first-deploy gotcha (fixed in `99b6cff`).

> **Note on Hobby-plan limits**: Vercel Hobby accounts reject any
> cron that runs more than once per day. The original `/cron/gc`
> schedule was hourly (`0 * * * *`) and was rejected with
> `"Hobby accounts are limited to daily cron jobs"`. Moved to
> `0 5 * * *` (daily 05:00 UTC) — sufficient since sessions have
> 24h/7d TTLs and idempotency keys have a 24h TTL. Upgrade to Pro
> if you need sub-daily crons (e.g. minute-level fraud-alert
> processing).

Cron schedule (post-`99b6cff`):

| Cron                            | Schedule (UTC) | Purpose                        |
| ------------------------------- | -------------- | ------------------------------ |
| `/cron/accrue-savings-interest` | `0 1 * * *`    | 01:00 daily                    |
| `/cron/accrue-loan-interest`    | `0 2 * * *`    | 02:00 daily                    |
| `/cron/detect-overdue-loans`    | `0 3 * * *`    | 03:00 daily                    |
| `/cron/reconcile`               | `30 3 * * *`   | 03:30 daily (pages on failure) |
| `/cron/pledge-reconciliation`   | `0 4 * * *`    | 04:00 daily                    |
| `/cron/gc`                      | `0 5 * * *`    | 05:00 daily (was hourly)       |
| `/cron/month-end-close`         | `0 4 1 * *`    | 1st of month, 04:00            |

## 7. Feature flags (Edge Config)

Keep every high-risk flag **off** until its exit criteria are met.

| Flag                        | Default | Enable when                                       |
| --------------------------- | ------- | ------------------------------------------------- |
| `ledgerEnabled`             | `false` | Backfill + reconcile pass with zero variance      |
| `passkeyAuth`               | `false` | Admin role tested the enrolment flow end-to-end   |
| `fraudScoring`              | `false` | Fraud service tuned against seeded test data      |
| `pwaOfflineCache`           | `false` | SW + offline banner tested in a throttled network |
| `cacheComponentsDashboards` | `false` | `updateTag()` wired into mutation server actions  |

## 8. Post-deploy verification

- [ ] `curl -sS "$PROD/api/v1/health/ready" | jq` — returns `status: "ok"`
- [ ] Trial balance endpoint returns zero variance
- [ ] Login flow works with seeded admin (and immediately prompts password change)
- [ ] `/logout` hard-sweeps the session cookie
- [ ] Sentry receives a synthetic error within 2 minutes
- [ ] First cron invocation (wait for the next scheduled minute) lands
      in the Vercel Functions logs
- [ ] `/reports/trial-balance?asOf=<today>` returns `balanced: true`

## 9. Secrets rotation after launch

Schedule the first rotation per [`runbooks/secrets-rotation.md`](./runbooks/secrets-rotation.md):

- `JWT_SECRET` — quarterly
- `CREDENTIALS_KEK` — annually
- `DATABASE_URL` — when Neon role passwords are rotated
- `SENTRY_AUTH_TOKEN`, `RESEND_API_KEY`, `AI_GATEWAY_API_KEY` —
  on suspicion or when the provider rotates theirs

## 10. Rollback plan

If the production deploy goes sideways:

1. **Vercel dashboard → Rollback** to the previous known-good deployment.
2. If a migration was applied, follow
   [`runbooks/prisma-rollback.md`](./runbooks/prisma-rollback.md).
3. If data loss is involved, follow
   [`runbooks/pitr-restore.md`](./runbooks/pitr-restore.md).
4. File an incident ticket within 1 hour; schedule a post-mortem
   within 24 hours.

See also [`docs/observability.md`](./observability.md) for
alert routing and SLI targets.

## 11. Known gotchas (read before your first deploy)

### `proxy.ts` matcher export name

Next.js 16 renamed `middleware.ts` → `proxy.ts`, but the matcher
config export is **still** `config`, NOT `proxyConfig`. Exporting
as `proxyConfig` silently disables the matcher — the proxy will
run on every request including `/_next/static/*` and `/api/v1/*`,
which breaks static asset serving AND causes the login page to 500
because server-component `fetch('/api/v1/auth/me')` calls get
intercepted and return HTML redirects instead of JSON.

Canonical form:

```ts
// apps/web/src/proxy.ts
export async function proxy(request: NextRequest) { ... }

export const config = {        // ✅ must be `config`, not `proxyConfig`
  matcher: [
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    // ...
  ],
};
```

### HTTP adapter can't do transactions

The live API uses `PrismaNeonHttp` (`apps/api/src/config/db.ts`)
because it's the correct adapter for serverless one-shot queries on
Vercel Functions. Trade-off: **it cannot hold transactions open** in
either callback or batch form. Any `prisma.$transaction(...)` call
from a request handler will throw
`"Transactions are not supported in HTTP mode"` at runtime.

Current state:

- **Reads**: use `Promise.all([q1, q2, q3])` instead of
  `prisma.$transaction([q1, q2, q3])`. See
  `apps/api/src/services/member.service.ts:147` for the canonical
  pattern.
- **Benign writes**: sequential `await`s with a documented
  atomicity trade-off. See `auth.service.ts:changePassword`,
  `issuePasswordResetTokenForUser`, `confirmPasswordReset`.
- **Scripts that genuinely need atomicity** (e.g. `backfill-ledger.ts`,
  `postJournal()`): instantiate their own `PrismaClient` with the
  WebSocket adapter:

  ```ts
  import { PrismaClient } from "@prisma/client";
  import { PrismaNeon } from "@prisma/adapter-neon";

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  // ... full $transaction support, with a slight cold-start cost
  ```

  Note: `PrismaNeon` takes a `PoolConfig` **object**
  (`{ connectionString }`), NOT a `Pool` **instance**. Passing a
  pre-built Pool crashes with `"No database host was set"`.

### Known tech debt — writes that still use `$transaction`

13 callback-form `$transaction` calls remain in write paths that
haven't been triggered in production yet:

| File                                            | Count                             |
| ----------------------------------------------- | --------------------------------- |
| `repositories/transaction.repository.ts`        | 2                                 |
| `repositories/pledge.repository.ts`             | 2                                 |
| `services/transaction.service.ts`               | 3                                 |
| `services/loan.service.ts`                      | 2                                 |
| `services/member.service.ts:44` (member.create) | 1                                 |
| `services/application.service.ts`               | 1                                 |
| `services/ledger.service.ts`                    | 1 (behind `ledgerEnabled` flag)   |
| `routes/withdraw-request.routes.ts`             | 1                                 |
| `routes/deposit-request.routes.ts`              | 1                                 |
| `routes/gdpr.routes.ts`                         | 1                                 |
| `workflows/runtime.ts`                          | 1 (only fires when workflows run) |

These will throw the first time their endpoints are exercised in
production. **Phase 9.3 (planned)** introduces a dedicated
`wsPrisma` client in `apps/api/src/config/db.ts` for transactional
writes. Until that lands, avoid admin write operations in
production, or accept that each one is a potential 500 until the
path is refactored.

### Vercel `vercel.json` must be in the project root directory

If the Vercel project's "Root Directory" setting is `apps/web/`,
your `vercel.json` has to live at **`apps/web/vercel.json`**, not
at the repo root. The CLI warns
`"The vercel.json file should be inside of the provided root
directory"` on deploy; cron schedules defined in a mis-located
file are silently ignored.

### Vercel Hobby plan cron ceiling

Hobby accounts reject any cron that runs more than once per day
with `"Hobby accounts are limited to daily cron jobs"`. Every
schedule in `apps/web/vercel.json` now uses daily-or-less-frequent
patterns (`/cron/gc` was moved from hourly to daily 05:00). Upgrade
to Pro if you need sub-daily crons.
