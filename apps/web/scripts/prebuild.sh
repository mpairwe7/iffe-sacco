#!/bin/bash
set -e
echo "=== Pre-build: Bundle API into Next.js ==="

cd ../..

# Generate Prisma client (needed by API routes)
cd apps/api && npx prisma generate && cd ../..

# Bundle Hono API app for Next.js API routes
bun build apps/api/src/app.ts \
  --outfile apps/web/src/lib/api-server/app.mjs \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon" \
  --external "@neondatabase/serverless"

echo "API bundle: $(ls -lh apps/web/src/lib/api-server/app.mjs | awk '{print $5}')"
