#!/bin/bash
set -e
echo "=== IFFE SACCO API — Vercel Build ==="

cd ../..

# Bundle app.ts for Vercel Node.js
# Only externalize @prisma/* (needs native runtime files)
# Bundle everything else including @neondatabase/serverless to avoid ESM/CJS issues
bun build apps/api/src/app.ts \
  --outfile apps/api/api/_app.js \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon"

echo "Bundle: $(ls -lh apps/api/api/_app.js | awk '{print $5}')"

# Copy native deps
cd apps/api
node scripts/copy-deps.mjs

echo "=== Build complete ==="
