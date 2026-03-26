#!/bin/bash
set -e
echo "=== Pre-build: Bundle API + Fix Deps ==="

cd ../..

# Generate Prisma client
cd apps/api && npx prisma generate && cd ../..

# Bundle Hono API for Next.js API routes
bun build apps/api/src/app.ts \
  --outfile apps/web/src/lib/api-server/app.mjs \
  --target node \
  --external "@prisma/client" \
  --external "@prisma/adapter-neon" \
  --external "@neondatabase/serverless"

echo "API bundle: $(ls -lh apps/web/src/lib/api-server/app.mjs | awk '{print $5}')"

# Dereference ALL Bun symlinks for externalized packages
# Vercel's Node.js runtime can't follow Bun's .bun/ symlinks
cd apps/web
for PKG in "@prisma/client" "@prisma/adapter-neon" "@neondatabase/serverless"; do
  if [ -L "node_modules/$PKG" ]; then
    REAL=$(readlink -f "node_modules/$PKG")
    rm -rf "node_modules/$PKG"
    cp -r "$REAL" "node_modules/$PKG"
    echo "Dereferenced $PKG"
  fi
done

# Also dereference @prisma/* sub-deps
for DIR in node_modules/@prisma/*/; do
  PKG=$(basename "$DIR")
  FULL="node_modules/@prisma/$PKG"
  if [ -L "$FULL" ]; then
    REAL=$(readlink -f "$FULL")
    rm -rf "$FULL"
    cp -r "$REAL" "$FULL"
    echo "Dereferenced @prisma/$PKG"
  fi
done

# Copy .prisma/client generated files
PRISMA_GEN=$(find ../../node_modules/.bun -path "*@prisma+client*/node_modules/.prisma/client" -type d 2>/dev/null | head -1)
if [ -n "$PRISMA_GEN" ]; then
  mkdir -p node_modules/.prisma/client
  cp -r "$PRISMA_GEN"/* node_modules/.prisma/client/
  echo "Copied .prisma/client"
fi

echo "=== Pre-build complete ==="
