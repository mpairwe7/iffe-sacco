# Deployment Guide

## Architecture Overview

### Unified Vercel Deployment (Recommended)

The API is bundled as a Next.js API route, enabling single-deployment on Vercel:

```
┌──────────────────────────────────┐     ┌──────────────┐
│          Vercel                    │────▶│   NeonDB     │
│   Next.js 16 (Frontend + API)     │     │ (Singapore)  │
│   Frontend: /                     │     │  PostgreSQL  │
│   API:      /api/v1/*             │     │  Port 5432   │
│   Port 443                        │     └──────────────┘
└──────────────────────────────────┘
```

A `prebuild.sh` script runs before the build to copy the API source and shared package into the Next.js project, enabling the Hono API to be served as a catch-all API route at `/api/v1/[...path]`.

### Split Deployment (Alternative)

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Vercel / CF    │────▶│  Railway / Fly   │────▶│   NeonDB     │
│   (Frontend)     │     │    (API)         │     │ (Singapore)  │
│   Next.js 16     │     │  Bun + Hono      │     │  PostgreSQL  │
│   Port 443       │     │  Port 4000       │     │  Port 5432   │
└─────────────────┘     └──────────────────┘     └──────────────┘
```

## Unified Vercel Deployment (Recommended)

### 1. Configure

Create `apps/web/.env.production`:
```env
NEXT_PUBLIC_API_URL=/api/v1
DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require
JWT_SECRET=<production-secret>
JWT_REFRESH_SECRET=<production-secret>
NODE_ENV=production
```

> Note: `NEXT_PUBLIC_API_URL=/api/v1` (relative path) for unified deployment. No CORS needed since API is same-origin.

### 2. prebuild.sh

The `prebuild.sh` script prepares the unified build:
- Copies `packages/shared/src/` into the Next.js project
- Copies `packages/api/src/` into the Next.js project
- Sets up the catch-all API route at `src/app/api/v1/[...path]/route.ts`

### 3. Deploy

```bash
# From project root
cd apps/web
npx vercel --prod
```

Or connect the GitHub repo to Vercel:
- **Root Directory**: `apps/web`
- **Build Command**: `bash prebuild.sh && bun run build`
- **Install Command**: `bun install`
- **Output Directory**: `.next`

## Split Deployment (Alternative)

### Frontend (Vercel)

Create `apps/web/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.iffeds.org/api/v1
```

Deploy:
```bash
cd apps/web
npx vercel --prod
```

### Backend API (Railway)

Set environment variables in Railway dashboard:

```env
DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require
JWT_SECRET=<production-secret>
JWT_REFRESH_SECRET=<production-secret>
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://iffeds.org
```

Deploy:
```bash
railway init
railway up
```

Or connect GitHub:
- **Root Directory**: `apps/api`
- **Build Command**: `bun build src/index.ts --outdir dist --target bun`
- **Start Command**: `bun run dist/index.js`

### Backend API (Fly.io)

Create `apps/api/Dockerfile`:

```dockerfile
FROM oven/bun:1.3-alpine

WORKDIR /app
COPY apps/api/package.json apps/api/bun.lock ./
RUN bun install --production

COPY packages/shared ./packages/shared
COPY apps/api ./

RUN bun build src/index.ts --outdir dist --target bun

EXPOSE 4000
CMD ["bun", "run", "dist/index.js"]
```

Deploy:
```bash
cd apps/api
fly launch --name iffe-sacco-api --region sin  # Singapore
fly secrets set DATABASE_URL="..." JWT_SECRET="..." JWT_REFRESH_SECRET="..."
fly deploy
```

## Database (NeonDB)

### Current Setup

| Property | Value |
|----------|-------|
| Project | `snowy-water-12689441` |
| Region | `aws-ap-southeast-1` (Singapore) |
| Database | `neondb` |
| PostgreSQL | 17 |

### Production Checklist

- [ ] Enable connection pooling (PgBouncer) for high-traffic
- [ ] Set up read replicas for report queries
- [ ] Configure IP allowlisting
- [ ] Enable point-in-time recovery
- [ ] Set up automated backups
- [ ] Monitor with NeonDB dashboard

### Run Migrations in Production

```bash
cd apps/api
DATABASE_URL="production-url" bunx prisma migrate deploy
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iffeds.org | password123 |
| Chairman | chairman@iffeds.org | chairman123 |
| Staff | staff@iffeds.org | password123 |
| Member | john@example.com | password123 |

> **Security**: Change all passwords immediately in production.

## Environment Variables Reference

### Unified Deployment (`apps/web` with bundled API)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | API base URL (`/api/v1` for unified, full URL for split) |
| `DATABASE_URL` | Yes | NeonDB PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for access token signing (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh token signing (min 32 chars) |
| `NODE_ENV` | No | Environment (default: development) |

### Split Deployment - Backend (`apps/api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | NeonDB PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for access token signing (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh token signing (min 32 chars) |
| `PORT` | No | API port (default: 4000) |
| `NODE_ENV` | No | Environment (default: development) |
| `CORS_ORIGIN` | No | Allowed CORS origin (default: http://localhost:3000) |

### Split Deployment - Frontend (`apps/web`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Backend API base URL (full URL for split deployment) |

## Security Checklist

- [ ] Generate strong JWT secrets: `openssl rand -base64 64`
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS to exact production domain
- [ ] Enable HTTPS on all endpoints
- [ ] Set up rate limiting on auth endpoints
- [ ] Enable NeonDB connection pooling
- [ ] Configure CSP headers
- [ ] Set up error monitoring (Sentry)
- [ ] Enable access logging
- [ ] Regular dependency audits: `bun audit`
