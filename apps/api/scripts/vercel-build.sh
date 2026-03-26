#!/bin/bash
set -e
echo "=== IFFE SACCO API — Vercel Build ==="

cd ../..

# Bundle app.ts - externalize ALL native/problematic deps
bun build apps/api/src/app.ts \
  --outfile apps/api/api/_app.mjs \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon" \
  --external "@neondatabase/serverless"

echo "Bundle: $(ls -lh apps/api/api/_app.mjs | awk '{print $5}')"

# Copy runtime deps (dereference Bun symlinks)
cd apps/api
node scripts/copy-deps.mjs

echo "=== Build complete ==="
