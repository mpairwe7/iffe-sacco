#!/bin/bash
set -e
echo "=== IFFE SACCO API — Vercel Build ==="

cd ../..

# Bundle everything including Prisma - only externalize Node builtins
bun build apps/api/src/app.ts \
  --outfile apps/api/api/_app.js \
  --target node

echo "Bundle: $(ls -lh apps/api/api/_app.js | awk '{print $5}')"
