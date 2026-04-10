# IFFE SACCO

Modern Savings and Credit Cooperative Organization (SACCO) management platform for IFFE Bhenhe SACCO.

## Quick Start

```bash
bun install
bun run dev          # Start both web (3000) and api (4000)
```

## Structure

```
apps/web        Next.js 16 frontend (39 routes)
apps/api        Hono 4 backend (95+ endpoints)
packages/shared Types, schemas, constants
docs/           Comprehensive documentation
```

## Roles

4 user roles with role-based access and navigation:

| Role         | Dashboard    | Key Capabilities                                      |
| ------------ | ------------ | ----------------------------------------------------- |
| **Admin**    | `/dashboard` | Full system management, application approval          |
| **Chairman** | `/chairman`  | View-only oversight dashboard, expense approve/reject |
| **Staff**    | `/dashboard` | Member management, transaction processing             |
| **Member**   | `/portal`    | Self-service savings, loans, deposits, withdrawals    |

### First-Run Credentials

The seed script provisions role accounts and writes the generated passwords
to a file that is **not** committed to source control:

```bash
bun run db:seed
cat apps/api/prisma/.first-run-credentials.json   # gitignored; delete after first login
```

Every generated password must be rotated at first login — the login flow
forces a change on accounts flagged `mustChangePassword: true`. Do not
share these credentials outside of the initial handover channel.

Never commit seeded credentials to source, CLAUDE.md, issues, or PR bodies.

## Documentation

See [docs/](./docs/README.md) for full documentation including architecture, API reference, database schema, and deployment guides.

## Stack

**Frontend:** Next.js 16 / Tailwind CSS 4 / TanStack Query / Zustand / React Hook Form / Zod
**Backend:** Bun / Hono / Prisma 7.5 / NeonDB (PostgreSQL 17, Singapore)
**Deployment:** Unified Vercel deployment (API bundled as Next.js API route at `/api/v1/*`)
**Shared:** TypeScript / Zod v4 / Bun Workspaces
