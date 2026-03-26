#!/bin/bash
set -e
echo "=== IFFE SACCO API — Vercel Build ==="

cd ../..

# Bundle app.ts for Vercel Node.js - output as .mjs to prevent ESM->CJS conversion
bun build apps/api/src/app.ts \
  --outfile apps/api/api/_app.mjs \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon"

echo "Bundle: $(ls -lh apps/api/api/_app.mjs | awk '{print $5}')"

# Copy Prisma native deps
cd apps/api
node scripts/copy-deps.mjs

echo "=== Build complete ==="
