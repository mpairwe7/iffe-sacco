#!/bin/bash
set -e
echo "=== IFFE SACCO API — Vercel Build ==="

cd ../..

# 1. Bundle app.ts with workspace deps resolved, externalize runtime deps
bun build apps/api/src/app.ts \
  --outfile apps/api/api/_app.js \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon" \
  --external "@neondatabase/serverless" \
  --external "bcryptjs" \
  --external "jose"

echo "Bundle: $(ls -lh apps/api/api/_app.js | awk '{print $5}')"

# 2. Copy native deps (dereference Bun symlinks for Vercel)
cd apps/api
node scripts/copy-deps.mjs

echo "=== Build complete ==="
