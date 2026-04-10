# IFFE SACCO

Modern Savings and Credit Cooperative Organization (SACCO) management
platform for IFFE Bhenhe SACCO — production-ready through ten
coordinated phases of work across ledger correctness, security,
automation, observability, compliance, AI, real-time, offline and
i18n.

## Quick Start

```bash
bun install
bun run dev          # Start web (3000) and api (4000)
```

## Structure

```
apps/web           Next.js 16 frontend (44 routes, App Router, Turbopack)
apps/api           Hono 4 backend (130+ endpoints, Bun + Prisma 7.5)
packages/shared    Types, Zod schemas, constants
packages/ledger    Double-entry money primitives + chart of accounts
packages/assistant Prompts, tool schemas, types for the AI assistant
docs/              Architecture, API reference, runbooks, phase history
```

## Tech stack

**Frontend** — Next.js 16 (App Router, Turbopack) · React 19 · Tailwind
CSS 4 · TanStack Query 5 · Zustand · React Hook Form · Zod 4 · Sonner ·
Recharts · Framer Motion · Lucide.

**Backend** — Bun · Hono 4 · Prisma 7.5 · NeonDB (PostgreSQL 17) ·
Pino · `jose` JWT · bcryptjs · OpenTelemetry.

**Platform** — Vercel (Fluid Compute, Cron, Edge Config, AI Gateway,
Marketplace for Sentry / Neon / Resend) · Husky + lint-staged ·
GitHub Actions CI (typecheck / lint / test / build / CodeQL).

**Finance** — `decimal.js-light` (via `Money` wrapper, banker's
rounding) · append-only double-entry ledger · idempotency keys on
every write · Vercel Workflow-compatible sagas.

## Roles

Four roles with strict route isolation enforced by `proxy.ts` and
per-layout server-session guards:

| Role         | Home                | Key capabilities                                                                        |
| ------------ | ------------------- | --------------------------------------------------------------------------------------- |
| **Admin**    | `/dashboard`        | Full system management, user/role changes, application approval, payment gateway config |
| **Chairman** | `/chairman`         | Oversight dashboard, expense approval, reports                                          |
| **Staff**    | `/staff`            | Member management, transaction processing, queue triage                                 |
| **Member**   | `/portal/dashboard` | Self-service savings, loans, deposits, withdrawals, welfare pledges, AI assistant       |

## Phase history

The repo went through ten production-readiness phases. Each phase is a
single commit on `main`; every one is additive and behind a feature
flag where applicable.

| Phase | SHA       | Title                          | Scope                                                                    |
| ----- | --------- | ------------------------------ | ------------------------------------------------------------------------ |
| 0     | `2669459` | Foundation & Safety Net        | CI, Sentry, Pino logger, real `/health`, Husky, feature flags            |
| 1     | `90fd427` | Ledger & Financial Correctness | `@iffe/ledger`, Decimal money, double-entry journal, workflows, backfill |
| 2     | `92de12c` | Security Hardening             | CORS lockdown, CSRF, envelope encryption, account lockout, Resend        |
| 3     | `8de086a` | Automation & Reconciliation    | Vercel Crons, ledger-backed reports, daily accrual                       |
| 4     | `374609e` | Observability & Ops            | OpenTelemetry, runbooks (PITR, stuck workflow, auth incident)            |
| 5     | `fb92510` | Testing                        | `fast-check` property tests, interest unit test, Playwright E2E          |
| 6     | `549f291` | UX & Performance primitives    | EmptyState, LiveRegion, Cache Components helpers                         |
| 7     | `ba500ac` | Compliance & Advanced          | GDPR export/delete, fraud scoring, compliance doc                        |
| 8     | `eec776d` | AI Assistant & Real-time       | `@iffe/assistant`, streaming chat, Web Push, bounded SSE                 |
| 9     | `3886860` | Offline Queue, i18n, Passkeys  | IndexedDB queue, English + Luganda, WebAuthn                             |
| 9.1   | `08ad026` | Wire latent primitives         | Locale-aware layout, mounted providers, a11y fixes                       |
| 9.2   | `862260e` | CI pipeline fixes              | Typecheck + lint + test + build green end-to-end                         |

Full chronological details with lines-changed counts:
[`docs/phases.md`](./docs/phases.md).

## Pipeline verification

`main` has been verified locally with the full CI pipeline:

| Step      | Command                                  | Result                                                 |
| --------- | ---------------------------------------- | ------------------------------------------------------ |
| Install   | `bun install`                            | 530 packages, Husky hooks wired                        |
| Prisma    | `bun run --filter @iffe/api db:generate` | Client v7.5.0                                          |
| Typecheck | `bun run typecheck`                      | web 0 errors · api 0 errors                            |
| Lint      | `bun run --filter web lint`              | clean                                                  |
| Format    | `bun run format:check`                   | clean                                                  |
| Test      | `bun run test`                           | web 13/13 · api 4/4                                    |
| Build     | `bun run build`                          | api 1.78 MB · web Next 16 Turbopack 25.3 s · 44 routes |

The GitHub Actions workflow at `.github/workflows/ci.yml` runs the
same steps on every PR.

## First-run credentials

The seed script provisions role accounts and writes generated passwords
to a gitignored file:

```bash
bun run db:seed
cat apps/api/prisma/.first-run-credentials.json   # delete after first login
```

Every generated password must be rotated at first login — the login
flow forces a change on accounts flagged `mustChangePassword: true`.
Never commit, paste, or share seeded credentials.

## Deploy

Full rollout procedure with environment variables, database
migrations, the ledger backfill gate, feature flag sequencing, and
rollback plan: [`docs/rollout.md`](./docs/rollout.md).

## Documentation

Index: [`docs/README.md`](./docs/README.md) · Phase history:
[`docs/phases.md`](./docs/phases.md) · Rollout:
[`docs/rollout.md`](./docs/rollout.md) · Observability:
[`docs/observability.md`](./docs/observability.md) · Compliance:
[`docs/compliance.md`](./docs/compliance.md) · AI Assistant:
[`docs/ai-assistant.md`](./docs/ai-assistant.md) · UX Playbook:
[`docs/ux-performance.md`](./docs/ux-performance.md) · Runbooks:
[`docs/runbooks/README.md`](./docs/runbooks/README.md).
