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

Apply every migration in order. These are additive only (Phase 1,
8, 9 all use `CREATE TABLE IF NOT EXISTS`) — safe to re-run.

```bash
# Preview first. Do NOT run against production until the preview
# deploy is green.
bun run --filter @iffe/api db:generate
bunx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Expected state after deploy:

- **17 original tables** (User, Session, Member, Account, Transaction,
  Loan, Expense, WelfareProgram, Pledge, AuditLog, BankAccount,
  DepositRequest, WithdrawRequest, PaymentGateway, Application,
  Setting, PasswordResetToken).
- **Phase 1 tables** — `gl_accounts`, `journal_entries`,
  `journal_lines`, `idempotency_keys`, `workflow_runs`, `workflow_steps`.
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

```bash
# Dry-run — no writes, exits non-zero if anything would fail.
bun run --filter @iffe/api ledger:backfill:dry

# Real run. Synthesizes JournalEntry + JournalLine rows from legacy
# `transactions` data. Idempotent: safe to re-run.
bun run --filter @iffe/api ledger:backfill

# Verify. Trial balance must equal zero AND every Account.balance
# must match its ledger projection.
bun run --filter @iffe/api -- bun run scripts/reconcile-ledger.ts
```

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

`vercel.json` already declares every cron. No manual action needed
beyond deploying — Vercel picks them up and the first tick happens
at the next scheduled minute.

Cron schedule:

| Cron                            | Schedule (UTC) | Purpose                        |
| ------------------------------- | -------------- | ------------------------------ |
| `/cron/accrue-savings-interest` | `0 1 * * *`    | 01:00 daily                    |
| `/cron/accrue-loan-interest`    | `0 2 * * *`    | 02:00 daily                    |
| `/cron/detect-overdue-loans`    | `0 3 * * *`    | 03:00 daily                    |
| `/cron/reconcile`               | `30 3 * * *`   | 03:30 daily (pages on failure) |
| `/cron/pledge-reconciliation`   | `0 4 * * *`    | 04:00 daily                    |
| `/cron/gc`                      | `0 * * * *`    | Hourly                         |
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
