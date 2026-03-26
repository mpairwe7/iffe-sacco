# IFFE SACCO

Modern Savings and Credit Cooperative Organization (SACCO) management platform.

## Quick Start

```bash
bun install
bun run dev          # Start both web (3000) and api (4000)
```

## Structure

```
apps/web        Next.js 16 frontend (35 routes)
apps/api        Hono 4 backend (87 endpoints)
packages/shared Types, schemas, constants
docs/           Comprehensive documentation
```

## Documentation

See [docs/](./docs/README.md) for full documentation including architecture, API reference, database schema, and deployment guides.

## Stack

**Frontend:** Next.js 16 / Tailwind CSS 4 / TanStack Query / Zustand / React Hook Form / Zod
**Backend:** Bun / Hono / Prisma 7.5 / NeonDB (PostgreSQL 17, Singapore)
**Shared:** TypeScript / Zod v4 / Bun Workspaces
