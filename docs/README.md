# IFFE SACCO - Documentation

A modern Savings and Credit Cooperative Organization (SACCO) management platform built with cutting-edge 2026 web technologies.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System architecture, clean architecture layers, monorepo structure |
| [Getting Started](./getting-started.md) | Prerequisites, installation, environment setup, running the project |
| [API Reference](./api-reference.md) | All 95+ REST API endpoints, request/response schemas, authentication |
| [Database](./database.md) | 15 Prisma models, NeonDB setup, migrations, seed data (209+ records) |
| [Frontend](./frontend.md) | Next.js app structure, 39 pages, components, design system |
| [Shared Package](./shared-package.md) | 26+ types, 25+ Zod schemas, 20+ constants shared between frontend and backend |
| [Deployment](./deployment.md) | Unified Vercel deployment (recommended) + split deployment guide |
| [Contributing](./contributing.md) | Development workflow, code standards, PR guidelines |

## System Summary

| Metric | Count |
|--------|-------|
| Frontend Routes | 39 |
| API Endpoints | 95+ |
| Route Groups | 18 |
| Services | 10 |
| Repositories | 10 |
| Database Models | 15 |
| Seed Records | 209+ |
| Shared Types | 26+ |
| Shared Schemas | 25+ |
| Documentation Pages | 9 |

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Bun | 1.3+ |
| **Frontend** | Next.js (App Router) | 16.2 |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | Radix UI, Lucide, Recharts, Framer Motion | Latest |
| **State** | Zustand + TanStack Query | 5.x / 5.x |
| **Forms** | React Hook Form + Zod v4 | 7.x / 4.x |
| **Notifications** | Sonner | 2.x |
| **Backend** | Hono | 4.x |
| **ORM** | Prisma | 7.5 |
| **Database** | PostgreSQL (NeonDB Singapore) | 17 |
| **Auth** | JWT (jose) + bcrypt | 6.x / 3.x |
| **Monorepo** | Bun Workspaces | — |

## BFF (Backend-for-Frontend) Coverage

Every frontend page is backed by corresponding API endpoints:

| Frontend Area | Pages | API Endpoints |
|--------------|-------|---------------|
| Auth | 6 | 7 (login, register, reset, refresh, me, change-password, profile) |
| Applications | 3 | 8 (submit, authenticated submit, mine, list, stats, detail, approve, reject) |
| Chairman Dashboard | 1 | 1 (chairman overview data) |
| Dashboard | 1 | 3 (stats, recent-txns, upcoming-payments) |
| Admin Members | 2 | 6 (CRUD + stats) |
| Admin Accounts | 1 | 5 (list, stats, get, create, status) |
| Admin Transactions | 2 | 7 (CRUD + approve/reject/reverse) |
| Admin Loans | 1 | 7 (CRUD + approve/reject/repay) |
| Admin Expenses | 1 | 8 (CRUD + approve/reject) |
| Admin Deposit Reqs | 1 | 4 (list, create, approve, reject) |
| Admin Withdraw Reqs | 1 | 4 (list, create, approve, reject) |
| Admin Welfare | 1 | 9 (programs + pledges) |
| Admin Users | 1 | 5 (list, get, update, activate, deactivate) |
| Admin Settings | 1 | 4 (CRUD) |
| Admin Interest | 1 | 2 (preview, calculate) |
| Admin Reports | 1 | 2 (list, generate) |
| Admin Bank Accounts | 1 | 6 (CRUD + stats) |
| Admin Payment Gateways | 1 | 5 (CRUD + toggle) |
| Portal (Member) | 7 | Reuses member-filtered endpoints |
| Profile | 2 | 2 (update profile, change password) |
| Audit Logs | — | 2 (list, get) |
| **Total** | **39** | **95+** |
