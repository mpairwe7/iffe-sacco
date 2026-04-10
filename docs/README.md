# IFFE SACCO — Documentation

A modern Savings and Credit Cooperative Organization (SACCO)
management platform built with 2026 web technologies, hardened
through ten production-readiness phases covering financial
correctness, security, compliance, observability, AI, and real-time
UX.

## Start here

| Document                                | Read when                                                           |
| --------------------------------------- | ------------------------------------------------------------------- |
| [Getting Started](./getting-started.md) | First clone — environment setup, bun install, running locally       |
| [Phase History](./phases.md)            | Understanding what each commit on `main` delivered                  |
| [Rollout Checklist](./rollout.md)       | Preparing a production deploy — env vars, migrations, backfill gate |
| [Architecture](./architecture.md)       | High-level system map, clean architecture layers                    |
| [Contributing](./contributing.md)       | Dev workflow, code standards, PR guidelines                         |

## Core reference

| Document                              | Description                                                  |
| ------------------------------------- | ------------------------------------------------------------ |
| [API Reference](./api-reference.md)   | REST API endpoints, request/response schemas, authentication |
| [Database](./database.md)             | Prisma models, Neon setup, migrations, seed data             |
| [Frontend](./frontend.md)             | Next.js app structure, pages, components, design system      |
| [Shared Package](./shared-package.md) | Types, Zod schemas, constants shared between apps            |
| [Deployment](./deployment.md)         | Unified Vercel deployment + split deployment alternatives    |

## Production posture

| Document                                       | Description                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| [Observability](./observability.md)            | SLIs, dashboards, alert routing, request-ID correlation               |
| [Compliance](./compliance.md)                  | UMRA/DPPA/AML posture, data retention, breach response                |
| [UX Performance Playbook](./ux-performance.md) | Per-route recipe for applying Phase 6 primitives                      |
| [AI Assistant](./ai-assistant.md)              | Streaming chat architecture, tools, notification dispatcher, realtime |
| [Phase 9 Design](./phase-9.md)                 | Offline queue, bilingual i18n, passkey design                         |

## Runbooks (`runbooks/`)

Incident response procedures. Each runbook has entry conditions,
diagnosis steps, resolution actions, and post-incident tasks.

| Runbook                                                    | When to use                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| [Prisma Migration Rollback](./runbooks/prisma-rollback.md) | Deploy fails mid-migration or a migration is broken in prod    |
| [Secrets Rotation](./runbooks/secrets-rotation.md)         | Quarterly cadence or after suspected leak                      |
| [PITR Restore](./runbooks/pitr-restore.md)                 | Data loss or corruption requiring point-in-time recovery       |
| [Stuck Workflow](./runbooks/stuck-workflow.md)             | A `WorkflowRun` row stays in `running` past expected duration  |
| [Ledger Imbalance](./runbooks/ledger-imbalance.md)         | `sum(debits) ≠ sum(credits)` alert fires                       |
| [Auth Incident](./runbooks/auth-incident.md)               | Suspicious login spike, BotID block surge, credential stuffing |

## System snapshot

| Metric                     | Count                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Frontend routes            | 44                                                                                  |
| API endpoints              | 130+                                                                                |
| Workspace packages         | 4 (shared, ledger, assistant + web/api apps)                                        |
| Prisma models              | 29                                                                                  |
| Phase 1 ledger tables      | 6 (GlAccount, JournalEntry, JournalLine, IdempotencyKey, WorkflowRun, WorkflowStep) |
| Phase 8 AI + notifications | 6 tables                                                                            |
| Phase 9 auth               | 2 tables (Passkey, WebAuthnChallenge)                                               |
| Cron jobs (Vercel)         | 7                                                                                   |
| Runbooks                   | 6                                                                                   |
| Documentation pages        | 15+                                                                                 |

## Tech stack

| Layer             | Technology                                | Version   |
| ----------------- | ----------------------------------------- | --------- |
| **Runtime**       | Bun                                       | 1.3+      |
| **Frontend**      | Next.js App Router + Turbopack            | 16.2      |
| **React**         | React                                     | 19        |
| **Styling**       | Tailwind CSS                              | 4.x       |
| **UI Components** | Radix UI, Lucide, Recharts, Framer Motion | Latest    |
| **State**         | Zustand + TanStack Query                  | 5.x       |
| **Forms**         | React Hook Form + Zod                     | 7.x / 4.x |
| **Notifications** | Sonner + Web Push (VAPID)                 | 2.x       |
| **Backend**       | Hono                                      | 4.x       |
| **ORM**           | Prisma (with Neon adapter)                | 7.5       |
| **Database**      | PostgreSQL (NeonDB Singapore)             | 17        |
| **Auth**          | JWT (jose) + bcrypt + WebAuthn passkeys   | —         |
| **Money**         | decimal.js-light + Prisma Decimal(18,4)   | —         |
| **Logging**       | Pino                                      | 9.x       |
| **Errors**        | Sentry (server + client + edge)           | 9.x       |
| **Tracing**       | OpenTelemetry (dynamic import)            | Latest    |
| **Email**         | Resend                                    | Latest    |
| **AI**            | Vercel AI Gateway + Claude Haiku 4.5      | Latest    |
| **Monorepo**      | Bun Workspaces                            | —         |

## Phase deliverables (one-liners)

| Phase | Delivered                                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | CI pipeline, Sentry + Pino, real `/health`, Husky, env scaffolding                                                                                 |
| 1     | `@iffe/ledger`, double-entry journal, idempotency, WDK-style workflows, backfill + reconcile scripts                                               |
| 2     | CORS fail-closed, CSRF double-submit, envelope encryption for credentials, account lockout, Resend email                                           |
| 3     | 7 Vercel Crons, ledger-backed reports (trial balance, balance sheet, income statement, general ledger, loan aging, member statement)               |
| 4     | OpenTelemetry bootstrap, runbooks (PITR, stuck workflow, auth incident), observability charter                                                     |
| 5     | `fast-check` property tests for Money + Journal invariants, mocked-Prisma interest service test, Playwright E2E config + smoke tests               |
| 6     | `<EmptyState>`, `<AnnouncerProvider>`, Cache Components helpers, PWA offline baseline                                                              |
| 7     | GDPR export + delete endpoints, fraud scoring scaffold, compliance charter                                                                         |
| 8     | `@iffe/assistant` package, streaming chat endpoint, notification dispatcher (in-app + push + email), anomaly inbox, bounded-SSE realtime dashboard |
| 9     | IndexedDB offline mutation queue, English + Luganda i18n with minimal ICU formatter, passkey (WebAuthn) enrol + login                              |
| 9.1   | Mount I18nProvider + AnnouncerProvider, dynamic `<html lang>`, OfflineBanner in layout, a11y fixes, bundle analyzer                                |
| 9.2   | Full CI pipeline verified green locally — typecheck 0 errors, tests pass, Prettier clean, web Next 16 build 25.3s, 44 routes                       |

## BFF (Backend-for-Frontend) coverage

Every frontend page is backed by corresponding API endpoints:

| Area                   | Pages      | API endpoints                                                                                               |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| Auth                   | 6          | 7 (login, register, reset-password, reset-confirm, me, change-password, profile)                            |
| Passkeys               | 0 UI-only  | 6 (register options/verify, login options/verify, list, remove)                                             |
| Applications           | 3          | 8 (submit, mine, list, stats, detail, approve, reject)                                                      |
| Dashboard              | 1          | 3 (stats, recent-txns, upcoming-payments)                                                                   |
| Chairman               | 1          | 1 (chairman overview)                                                                                       |
| Staff                  | 1          | Reuses dashboard + queue endpoints                                                                          |
| Admin Members          | 4          | 7 (CRUD + stats + member-dashboard detail)                                                                  |
| Admin Accounts         | 1          | 5 (list, stats, get, create, status)                                                                        |
| Admin Transactions     | 2          | 7 (CRUD + approve/reject/reverse)                                                                           |
| Admin Loans            | 1          | 7 (CRUD + approve/reject/repay)                                                                             |
| Admin Expenses         | 1          | 8 (CRUD + approve/reject)                                                                                   |
| Admin Deposit Reqs     | 1          | 4 (list, create, approve, reject)                                                                           |
| Admin Withdraw Reqs    | 1          | 4 (list, create, approve, reject)                                                                           |
| Admin Welfare          | 1          | 9 (programs + pledges)                                                                                      |
| Admin Users            | 1          | 5 (list, get, update, activate, deactivate)                                                                 |
| Admin Settings         | 1          | 4 (CRUD)                                                                                                    |
| Admin Interest         | 1          | 2 (preview, calculate-and-post)                                                                             |
| Admin Reports          | 1          | 8 (trial balance, balance sheet, income statement, general ledger, member statement, loan aging + legacy 2) |
| Admin Bank Accounts    | 1          | 6 (CRUD + stats)                                                                                            |
| Admin Payment Gateways | 1          | 5 (CRUD + toggle)                                                                                           |
| Anomaly Inbox          | 1          | 4 (list, get, reviewing, resolve)                                                                           |
| GDPR                   | 0 UI-only  | 2 (export, delete)                                                                                          |
| Notifications          | 0 UI-only  | 7 (subscribe, unsubscribe, prefs, bell, read, read-all, vapid-key)                                          |
| Assistant              | 1 (widget) | 4 (chat, conversations, get, delete, tools)                                                                 |
| Realtime               | 0 UI-only  | 2 (snapshot, stream)                                                                                        |
| Cron                   | 0 UI-only  | 7 (accrue-savings, accrue-loans, detect-overdue, reconcile, pledges, gc, month-end)                         |
| Health                 | 0 UI-only  | 3 (health, live, ready)                                                                                     |
| Portal (Member)        | 8          | Reuses member-filtered endpoints                                                                            |
| Profile                | 2          | 2 (update profile, change password)                                                                         |
| Audit Logs             | —          | 2 (list, get)                                                                                               |
| **Total**              | **44**     | **130+**                                                                                                    |
