# Architecture

## Monorepo Structure

```
IFFE/
├── package.json                    # Root - Bun workspaces
├── tsconfig.base.json              # Shared TypeScript config
├── .gitignore
│
├── apps/
│   └── web/                        # Next.js 16 Frontend
│       ├── src/
│       │   ├── app/                # App Router pages (35 routes)
│       │   │   ├── (auth)/         # Login, Register, Reset, Terms, Privacy
│       │   │   ├── (dashboard)/    # Dashboard, Admin, Portal, Profile
│       │   │   ├── layout.tsx      # Root layout with Providers
│       │   │   ├── page.tsx        # Landing page
│       │   │   ├── not-found.tsx   # Custom 404
│       │   │   └── error.tsx       # Global error boundary
│       │   ├── components/         # Reusable UI components
│       │   │   ├── ui/             # Primitives (skeleton, dialog, breadcrumb, etc.)
│       │   │   ├── providers.tsx   # QueryClient + Theme + Toast + Tooltip
│       │   │   ├── sidebar.tsx     # Dashboard sidebar navigation
│       │   │   ├── data-table.tsx  # Advanced data table (sort, filter, export)
│       │   │   ├── motion.tsx      # Framer Motion wrappers
│       │   │   └── ...
│       │   ├── hooks/              # TanStack Query hooks
│       │   ├── stores/             # Zustand stores (ui, auth)
│       │   └── lib/                # Utilities, mock data, API client, schemas
│       ├── public/                 # Static assets (logo, favicon)
│       └── package.json
│
├── packages/
│   ├── api/                        # Hono API Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # 14 database models (User, Member, Account, Transaction, Loan, Expense, WelfareProgram, Pledge, AuditLog, BankAccount, DepositRequest, WithdrawRequest, PaymentGateway, Setting)
│   │   │   ├── migrations/         # 2 version-controlled migrations
│   │   │   ├── seed.ts             # TypeScript seeder (alternative)
│   │   │   └── seed.sql            # SQL seeder (recommended, 209+ records)
│   │   ├── prisma.config.ts        # Prisma 7.x config
│   │   └── src/
│   │       ├── index.ts            # Hono server entry (17 route groups, 87 endpoints)
│   │       ├── config/             # Environment validation, PrismaPg database connection
│   │       ├── middleware/          # JWT auth (role-based), error handler (Zod + HTTP)
│   │       ├── routes/             # 17 route files (auth, members, accounts, transactions, loans, expenses, welfare, dashboard, deposit-requests, withdraw-requests, payment-gateways, bank-accounts, users, settings, interest, reports, audit-logs)
│   │       ├── services/           # 9 service files (business logic, validation, orchestration)
│   │       ├── repositories/       # 9 repository files (Prisma queries, pagination, aggregation)
│   │       └── utils/              # JWT (jose), password hashing (bcrypt)
│   │
│   └── shared/                     # Shared between frontend & backend
│       └── src/
│           ├── types.ts            # TypeScript interfaces
│           ├── schemas.ts          # Zod v4 validation schemas
│           └── constants.ts        # App-wide constants
│
└── docs/                           # This documentation
```

## Clean Architecture (Backend)

The API follows clean architecture with strict dependency rules:

```
                    ┌──────────────┐
                    │   Routes     │  ← HTTP layer (Hono handlers)
                    │  (routes/)   │     Validates input, returns JSON
                    └──────┬───────┘
                           │ calls
                    ┌──────▼───────┐
                    │  Services    │  ← Business logic layer
                    │ (services/)  │     Orchestrates operations, enforces rules
                    └──────┬───────┘
                           │ calls
                    ┌──────▼───────┐
                    │ Repositories │  ← Data access layer
                    │  (repos/)    │     Prisma queries, pagination, aggregation
                    └──────┬───────┘
                           │ queries
                    ┌──────▼───────┐
                    │   Prisma     │  ← ORM layer
                    │  + NeonDB    │     PostgreSQL via PrismaPg adapter
                    └──────────────┘
```

### Dependency Direction
- Routes depend on Services and Shared Schemas
- Services depend on Repositories and Shared Types
- Repositories depend on Prisma Client
- Shared package has zero dependencies on api or web

### Middleware Pipeline

```
Request → Logger → Secure Headers → CORS → Auth (JWT) → Route Handler → Response
                                              │
                                     Error Handler (catches all)
```

## Frontend Architecture

```
┌─────────────────────────────────────────────────┐
│                   Next.js App Router             │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐ │
│  │  (auth)   │  │(dashboard) │  │  Landing   │ │
│  │  Layout   │  │  Layout    │  │   Page     │ │
│  │           │  │ + Sidebar  │  │            │ │
│  │ Login     │  │ + Header   │  │ Hero       │ │
│  │ Register  │  │ + Breadcrumb│ │ Features   │ │
│  │ Reset     │  │ + CMD+K    │  │ Portals    │ │
│  │ Terms     │  │            │  │ Footer     │ │
│  │ Privacy   │  │ Admin/*    │  │            │ │
│  │           │  │ Portal/*   │  │            │ │
│  │           │  │ Profile/*  │  │            │ │
│  └───────────┘  └────────────┘  └────────────┘ │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │              Providers Layer                  ││
│  │  QueryClient + ThemeProvider + Toaster        ││
│  │  + TooltipProvider                            ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  ┌────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │Zustand │ │ TanStack │ │ React Hook Form    │ │
│  │ Stores │ │  Query   │ │    + Zod           │ │
│  │(ui,auth│ │ (hooks/) │ │  (schemas.ts)      │ │
│  └────────┘ └──────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## State Management Strategy

| State Type | Tool | Purpose |
|-----------|------|---------|
| **Server State** | TanStack Query | API data, caching, loading/error states |
| **Client UI State** | Zustand | Sidebar, theme, command palette |
| **Auth State** | Zustand (persisted) | User session, role, login status |
| **Form State** | React Hook Form | Form values, validation, submission |
| **URL State** | Next.js Router | Pagination, filters, search params |
| **Theme State** | next-themes | Dark/light mode preference |

## Design System

### Glassmorphism Layer System

| Class | Background | Blur | Use Case |
|-------|-----------|------|----------|
| `glass` | white 65% | 20px | General overlays |
| `glass-strong` | white 80% | 30px | Navbar, header |
| `glass-subtle` | white 45% | 16px | Badges, tags |
| `glass-dark` | dark 85% | 24px | Sidebar |
| `glass-card` | white 60% + shadow | 20px | Cards, tables |

### Color Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-primary` | #006622 | #006622 | Brand, CTAs, active states |
| `--color-secondary` | #F1C40F | #F1C40F | Accents, warnings |
| `--color-surface` | #ffffff | #0f1117 | Page backgrounds |
| `--color-surface-alt` | #f8fafc | #181a24 | Card backgrounds |
| `--color-text` | #1e293b | #e8eaed | Body text |
| `--color-text-muted` | #64748b | #9ca3af | Secondary text |
| `--color-success` | #10b981 | #10b981 | Completed, active |
| `--color-warning` | #f59e0b | #f59e0b | Pending, caution |
| `--color-danger` | #ef4444 | #ef4444 | Errors, destructive |
| `--color-info` | #3b82f6 | #3b82f6 | Information, links |
