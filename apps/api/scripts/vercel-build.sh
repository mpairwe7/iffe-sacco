#!/bin/bash
set -e
echo "=== IFFE SACCO API — Vercel Build ==="

cd ../..

# Bundle app.ts for Node/Vercel
# - Bundle IN: hono, jose, bcryptjs, zod, @iffe/shared, @hono/*
# - Externalize: @prisma/* and @neondatabase/* (native/runtime deps copied separately)
bun build apps/api/src/app.ts \
  --outfile apps/api/api/_app.js \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon" \
  --external "@neondatabase/serverless"

echo "Bundle: $(ls -lh apps/api/api/_app.js | awk '{print $5}')"

# Copy native deps with dereferenced Bun symlinks
cd apps/api
node scripts/copy-deps.mjs

echo "=== Build complete ==="
