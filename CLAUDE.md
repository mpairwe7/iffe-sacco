# IFFE SACCO — Repo Conventions

## Monorepo layout

Bun-managed monorepo. Workspaces:

- `apps/web` — Next.js App Router frontend (Vercel project `iffe-sacco`)
- `apps/api` — Hono API (separate Vercel project)
- `packages/shared` — Zod schemas / TS types shared between web and api
- `packages/ledger`, `packages/assistant`, etc. — internal libs

## Package manager

**Always use `bun`, never `npm`.** `bunx` for one-off binaries, `bun install`, `bun run <script>`, `bun test`.

## Vercel deploy

Run `vercel deploy --prod --yes` from the **monorepo root** (`/home/darkhorse/IFFE`), not from `apps/web`. The Vercel project has `rootDirectory = apps/web` configured server-side, and that path is resolved relative to the directory where the CLI is invoked. Running from `apps/web` produces:

```
Error: The provided path "~/IFFE/apps/web/apps/web" does not exist.
```

If a prior shell command changed directories (e.g. `cd apps/api && bunx tsc`), explicitly `cd /home/darkhorse/IFFE` before any `vercel` command.

## Cross-app type sharing

Shared Zod schemas and TS types live in `packages/shared`. Both `apps/web` and `apps/api` import from `@iffe/shared`. Tightening a schema there (e.g. a stricter pagination cap) immediately affects both ends — verify both with `bunx tsc --noEmit` from each app dir before deploying.
