# Getting Started

## Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| **Bun** | 1.3+ | `curl -fsSL https://bun.sh/install \| bash` |
| **Node.js** | 20+ | Required for some Prisma tooling |
| **neonctl** | Latest | `bun install -g neonctl` |
| **Git** | 2.x | System package manager |

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url> IFFE
cd IFFE
bun install
```

This installs dependencies for all workspaces (root, apps/web, apps/api, packages/shared).

### 2. Environment Setup

#### Backend API (`apps/api/.env`)

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require
JWT_SECRET=<generate-with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<generate-with: openssl rand -base64 32>
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (`apps/web/.env.local`) — Optional

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 3. Database Setup

#### Option A: Use Existing NeonDB Project

If you have the NeonDB project already created:

```bash
cd apps/api

# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# Seed sample data
bun run db:seed
```

#### Option B: Create New NeonDB Project

```bash
# Authenticate with Neon
neonctl auth

# Create project in Singapore region
neonctl projects create \
  --name iffe-sacco \
  --region-id aws-ap-southeast-1 \
  --output json

# Copy the connection_uri from output to apps/api/.env

# Then run migrations and seed
cd apps/api
bunx prisma generate
bunx prisma migrate dev --name init
bun run db:seed
```

### 4. Run Development Servers

```bash
# From root - run both frontend and backend
bun run dev

# Or run individually:
bun run dev:web    # Next.js on http://localhost:3000
bun run dev:api    # Hono API on http://localhost:4000
```

### 5. Verify

```bash
# Frontend
open http://localhost:3000

# API health check
curl http://localhost:4000/api/v1/health

# API login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@iffeds.org","password":"admin123"}'
```

## Project Scripts

### Root Level

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun run dev` | Run all workspaces in dev mode |
| `dev:web` | `bun run dev:web` | Run frontend only |
| `dev:api` | `bun run dev:api` | Run backend only |
| `build` | `bun run build` | Build all workspaces |
| `db:generate` | `bun run db:generate` | Generate Prisma client |
| `db:migrate` | `bun run db:migrate` | Run pending migrations |
| `db:push` | `bun run db:push` | Push schema (no migration file) |
| `db:seed` | `bun run db:seed` | Seed database |
| `db:studio` | `bun run db:studio` | Open Prisma Studio |
| `clean` | `bun run clean` | Remove all node_modules |

### Frontend (`apps/web`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Dev server on :3000 |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |

### Backend (`apps/api`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun run --hot src/index.ts` | Dev server with hot reload on :4000 |
| `build` | `bun build src/index.ts --outdir dist --target bun` | Production build |
| `start` | `bun run dist/index.js` | Start production server |

## Default Credentials

| Portal | Email | Password |
|--------|-------|----------|
| Admin | admin@iffeds.org | admin123 |

> **Security Note**: Change default credentials immediately in production.

## Troubleshooting

### `Cannot find module` errors
Ensure you ran `bun install` from the root directory. Path aliases require `tsconfig.json` to be properly configured.

### Prisma `datasource.url` errors
Prisma 7.x uses `prisma.config.ts` for connection URLs, not `schema.prisma`. Ensure `.env` file exists in `apps/api/`.

### NeonDB connection timeouts
NeonDB serverless databases suspend after 5 minutes of inactivity. The first request after suspension takes 1-3 seconds (cold start). This is normal.

### Port already in use
```bash
fuser -k 3000/tcp    # Kill process on port 3000
fuser -k 4000/tcp    # Kill process on port 4000
```
