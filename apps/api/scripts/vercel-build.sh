#!/bin/bash
set -e
echo "=== IFFE SACCO API — Vercel Build ==="

cd ../..
bun build apps/api/src/app.ts \
  --outfile apps/api/api/_app.js \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon" \
  --external "@neondatabase/serverless" \
  --external "bcryptjs" \
  --external "jose"

echo "Bundle: $(ls -lh apps/api/api/_app.js | awk '{print $5}')"
