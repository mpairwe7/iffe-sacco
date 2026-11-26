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

The `apps/web/scripts/prebuild.sh` script runs before `next build` to generate the Prisma client and bundle the Hono API into `apps/web/api-bundle/app.mjs`, enabling the API to be served through the Next.js catch-all route at `/api/v1/[...path]`.

The unified deployment needs Node.js `22.12.0` or newer. SimpleWebAuthn 14 requires Node 22 LTS or newer, and Sentry 11 supports Node 22 starting at `22.12.0`.

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

Set these values in the Vercel project's **Settings → Environment Variables** for
Production and Preview. Vercel builds use project environment variables; do not
create or rely on a local `apps/web/.env.production` file for deployment. Follow
the [rollout checklist](rollout.md#1-environment-variables) to generate secrets,
configure the complete environment, and apply database migrations before the
first production deploy.

| Variable              | Unified deployment value                                           |
| --------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | `/api/v1`                                                          |
| `DATABASE_URL`        | Pooled NeonDB PostgreSQL connection string                         |
| `JWT_SECRET`          | Generated production secret                                        |
| `JWT_REFRESH_SECRET`  | Generated production secret                                        |
| `APP_BASE_URL`        | Public production URL, for example `https://iffe-sacco.vercel.app` |
| `NODE_ENV`            | `production`                                                       |

> `NEXT_PUBLIC_API_URL=/api/v1` keeps API requests same-origin, so no CORS
> configuration is needed for the unified deployment.

### 2. API prebuild

The `scripts/prebuild.sh` script prepares the unified build:

- Runs Prisma client generation from `apps/api`
- Bundles `apps/api/src/app.ts` into `apps/web/api-bundle/app.mjs` using Bun
- Keeps API runtime self-contained for Vercel function tracing

### 3. Deploy

```bash
# From repository root (recommended for this monorepo project setup)
npx vercel --prod
```

Or connect the GitHub repo to Vercel:

- **Root Directory**: `apps/web`
- **Build Command**: `bun run build` (runs `scripts/prebuild.sh` before `next build`)
- **Install Command**: `cd ../.. && bun install`
- **Output Directory**: `.next`

### 4. CLI Linking Note (Monorepo)

If the Vercel project **Root Directory** is `apps/web`, run deploy commands from repository root.

Running `vercel --prod` from inside `apps/web` can cause path resolution errors such as:

`The provided path “…/apps/web/apps/web” does not exist`

### Current Production Project

- **Vercel Project**: `iffe-sacco` in the **iONA Tech** team
- **Root Directory**: `apps/web`
- **Production Alias**: `https://iffe-sacco-mu.vercel.app`

## Split Deployment (Alternative)

### Frontend (Vercel)

In Vercel **Settings → Environment Variables**, set `NEXT_PUBLIC_API_URL` for
Production and Preview to the split API URL. Do not rely on a local
`apps/web/.env.production` file for Vercel builds. The split API's database and
JWT secrets belong in the backend service's secret store. See the
[rollout checklist](rollout.md#1-environment-variables) for environment setup.

Deploy:

```bash
# From repository root for projects configured with Root Directory=apps/web
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

| Property   | Value                            |
| ---------- | -------------------------------- |
| Project    | `snowy-water-12689441`           |
| Region     | `aws-ap-southeast-1` (Singapore) |
| Database   | `neondb`                         |
| PostgreSQL | 17                               |

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

| Role     | Email               | Password    |
| -------- | ------------------- | ----------- |
| Admin    | admin@iffeds.org    | password123 |
| Chairman | chairman@iffeds.org | chairman123 |
| Staff    | staff@iffeds.org    | password123 |
| Member   | john@example.com    | password123 |

> **Security**: Change all passwords immediately in production.

## Environment Variables Reference

### Unified Deployment (`apps/web` with bundled API)

| Variable              | Required | Description                                                 |
| --------------------- | -------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Yes      | API base URL (`/api/v1` for unified, full URL for split)    |
| `DATABASE_URL`        | Yes      | NeonDB PostgreSQL connection string                         |
| `JWT_SECRET`          | Yes      | Secret for access token signing (min 32 chars)              |
| `JWT_REFRESH_SECRET`  | Yes      | Secret for refresh token signing (min 32 chars)             |
| `APP_BASE_URL`        | Yes      | Public application origin used for WebAuthn and email links |
| `NODE_ENV`            | No       | Environment (default: development)                          |

### Split Deployment - Backend (`apps/api`)

| Variable             | Required | Description                                          |
| -------------------- | -------- | ---------------------------------------------------- |
| `DATABASE_URL`       | Yes      | NeonDB PostgreSQL connection string                  |
| `JWT_SECRET`         | Yes      | Secret for access token signing (min 32 chars)       |
| `JWT_REFRESH_SECRET` | Yes      | Secret for refresh token signing (min 32 chars)      |
| `PORT`               | No       | API port (default: 4000)                             |
| `NODE_ENV`           | No       | Environment (default: development)                   |
| `CORS_ORIGIN`        | No       | Allowed CORS origin (default: http://localhost:3000) |

### Split Deployment - Frontend (`apps/web`)

| Variable              | Required | Description                                          |
| --------------------- | -------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Yes      | Backend API base URL (full URL for split deployment) |

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

## Member document uploads (self-hosted VPS)

The receipts / signed-form feature writes uploaded files to the filesystem and
streams them back through the API. Two operational requirements on the VPS:

1. **Storage directory** — files are written under `STORAGE_DIR` (production
   default `/home/iffe/iffe-storage`), deliberately **outside** the rsync deploy
   tree (`/home/iffe/IFFE`) so `rsync --delete` never wipes uploads on deploy.
   The API creates it on first write. Override in `apps/api/.env.production` if
   the service runs as a different user. **Back this directory up** — it is not
   part of the database backup.

2. **Reverse-proxy body size** — the API caps a single upload at 10 MB, but
   nginx defaults `client_max_body_size` to 1 MB and will otherwise reject larger
   uploads with `413 Request Entity Too Large`. Raise it for the block that
   proxies `/api/v1` to the API (or globally in the `http {}` block):

   ```nginx
   client_max_body_size 12m;
   ```

   Then validate and reload: `sudo nginx -t && sudo systemctl reload nginx`.
