#!/bin/bash
set -e
echo "=== Pre-build: Bundle API (fully self-contained) ==="

cd ../..

# Generate Prisma client
cd apps/api && npx prisma generate && cd ../..

# Bundle EVERYTHING into one file - no externals
# This avoids ALL Bun symlink / Vercel file tracing issues
bun build apps/api/src/app.ts \
  --outfile apps/web/src/lib/api-server/app.mjs \
  --target node

echo "API bundle: $(ls -lh apps/web/src/lib/api-server/app.mjs | awk '{print $5}')"
echo "=== Pre-build complete ==="
