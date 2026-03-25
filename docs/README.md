# IFFE SACCO - Documentation

A modern Savings and Credit Cooperative Organization (SACCO) management platform built with cutting-edge 2026 web technologies.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System architecture, clean architecture layers, monorepo structure |
| [Getting Started](./getting-started.md) | Prerequisites, installation, environment setup, running the project |
| [API Reference](./api-reference.md) | All REST API endpoints, request/response schemas, authentication |
| [Database](./database.md) | Prisma schema, NeonDB setup, migrations, seeding, ERD |
| [Frontend](./frontend.md) | Next.js app structure, pages, components, design system |
| [Shared Package](./shared-package.md) | Types, Zod schemas, constants shared between frontend and backend |
| [Deployment](./deployment.md) | Production deployment guide for Vercel, Railway, Fly.io |
| [Contributing](./contributing.md) | Development workflow, code standards, PR guidelines |

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Bun | 1.3+ |
| **Frontend** | Next.js (App Router) | 16.2 |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | Radix UI, Lucide, Recharts, Framer Motion | Latest |
| **State** | Zustand + TanStack Query | 5.x / 5.x |
| **Forms** | React Hook Form + Zod v4 | 7.x / 4.x |
| **Backend** | Hono | 4.x |
| **ORM** | Prisma | 7.5 |
| **Database** | PostgreSQL (NeonDB) | 17 |
| **Auth** | JWT (jose) + bcrypt | - |
| **Monorepo** | Bun Workspaces | - |
