#!/bin/bash
set -e
echo "=== IFFE SACCO API — Vercel Build ==="

# Bundle app + all deps except node builtins into a single JS file
cd ../..
bun build apps/api/src/app.ts \
  --outfile apps/api/dist/app.js \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon" \
  --external "@neondatabase/serverless" \
  --external "bcryptjs" \
  --external "jose"

echo "Bundle: $(ls -lh apps/api/dist/app.js | awk '{print $5}')"
