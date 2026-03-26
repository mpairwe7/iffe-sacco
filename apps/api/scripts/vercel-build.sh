#!/bin/bash
set -e

echo "=== IFFE SACCO API — Vercel Build ==="

# Bundle the entire app into a single JS file using bun
# This resolves all workspace imports (@iffe/shared), Prisma, etc at build time
cd ../..
bun build apps/api/src/app.ts \
  --outfile apps/api/dist/app.js \
  --target node \
  --external hono \
  --external "hono/*" \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon" \
  --external "@neondatabase/serverless" \
  --external "bcryptjs" \
  --external "jose" \
  --external "zod" \
  --external "zod/*"

echo "Bundle created: apps/api/dist/app.js"
ls -lh apps/api/dist/app.js
