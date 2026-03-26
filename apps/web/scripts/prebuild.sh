#!/bin/bash
set -e
echo "=== Pre-build: Bundle API + Generate Prisma ==="

cd ../..

# Generate Prisma client (for API routes)
cd apps/api && npx prisma generate && cd ../..

# Bundle Hono API for Next.js API routes
# Externalize only packages that are in web's node_modules
bun build apps/api/src/app.ts \
  --outfile apps/web/src/lib/api-server/app.mjs \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon" \
  --external "@neondatabase/serverless"

echo "API bundle: $(ls -lh apps/web/src/lib/api-server/app.mjs | awk '{print $5}')"

# Ensure Prisma generated client is accessible from web's node_modules
# (Bun uses symlinks which Vercel can't follow at runtime)
cd apps/web
if [ -L "node_modules/@prisma/client" ]; then
  REAL=$(readlink -f node_modules/@prisma/client)
  rm -rf node_modules/@prisma/client
  cp -r "$REAL" node_modules/@prisma/client
  echo "Dereferenced @prisma/client symlink"
fi

# Copy .prisma/client generated files
PRISMA_GEN=$(find ../../node_modules/.bun -path "*@prisma+client*/node_modules/.prisma/client" -type d 2>/dev/null | head -1)
if [ -n "$PRISMA_GEN" ]; then
  mkdir -p node_modules/.prisma/client
  cp -r "$PRISMA_GEN"/* node_modules/.prisma/client/
  echo "Copied .prisma/client"
fi

echo "=== Pre-build complete ==="
