# Deployment Guide

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Vercel / CF    │────▶│  Railway / Fly   │────▶│   NeonDB     │
│   (Frontend)     │     │    (API)         │     │ (Singapore)  │
│   Next.js 16     │     │  Bun + Hono      │     │  PostgreSQL  │
│   Port 443       │     │  Port 4000       │     │  Port 5432   │
└─────────────────┘     └──────────────────┘     └──────────────┘
```

## Frontend (Vercel)

### 1. Configure

Create `apps/web/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.iffeds.org/api/v1
```

### 2. Deploy

```bash
# From project root
cd apps/web
npx vercel --prod
```

Or connect the GitHub repo to Vercel:
- **Root Directory**: `apps/web`
- **Build Command**: `bun run build`
- **Install Command**: `bun install`
- **Output Directory**: `.next`

## Backend API (Railway)

### 1. Configure

Set environment variables in Railway dashboard:

```env
DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require
JWT_SECRET=<production-secret>
JWT_REFRESH_SECRET=<production-secret>
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://iffeds.org
```

### 2. Deploy

```bash
# Railway CLI
railway init
railway up
```

Or connect GitHub:
- **Root Directory**: `packages/api`
- **Build Command**: `bun build src/index.ts --outdir dist --target bun`
- **Start Command**: `bun run dist/index.js`

## Backend API (Fly.io)

### 1. Create `packages/api/Dockerfile`

```dockerfile
FROM oven/bun:1.3-alpine

WORKDIR /app
COPY packages/api/package.json packages/api/bun.lock ./
RUN bun install --production

COPY packages/shared ./packages/shared
COPY packages/api ./

RUN bun build src/index.ts --outdir dist --target bun

EXPOSE 4000
CMD ["bun", "run", "dist/index.js"]
```

### 2. Deploy

```bash
cd packages/api
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
cd packages/api
DATABASE_URL="production-url" bunx prisma migrate deploy
```

## Environment Variables Reference

### Backend (`packages/api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | NeonDB PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for access token signing (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh token signing (min 32 chars) |
| `PORT` | No | API port (default: 4000) |
| `NODE_ENV` | No | Environment (default: development) |
| `CORS_ORIGIN` | No | Allowed CORS origin (default: http://localhost:3000) |

### Frontend (`apps/web`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Backend API base URL |

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
