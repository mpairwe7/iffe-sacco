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

| Role | Dashboard | Key Capabilities |
|------|-----------|-----------------|
| **Admin** | `/dashboard` | Full system management, application approval |
| **Chairman** | `/chairman` | View-only oversight dashboard, expense approve/reject |
| **Staff** | `/dashboard` | Member management, transaction processing |
| **Member** | `/portal` | Self-service savings, loans, deposits, withdrawals |

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iffeds.org | password123 |
| Chairman | chairman@iffeds.org | chairman123 |
| Staff | staff@iffeds.org | password123 |
| Member | john@example.com | password123 |

## Documentation

See [docs/](./docs/README.md) for full documentation including architecture, API reference, database schema, and deployment guides.

## Stack

**Frontend:** Next.js 16 / Tailwind CSS 4 / TanStack Query / Zustand / React Hook Form / Zod
**Backend:** Bun / Hono / Prisma 7.5 / NeonDB (PostgreSQL 17, Singapore)
**Deployment:** Unified Vercel deployment (API bundled as Next.js API route at `/api/v1/*`)
**Shared:** TypeScript / Zod v4 / Bun Workspaces
