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

# Dereference ALL @prisma/* packages from Bun's .bun/ cache
# This catches sub-deps like @prisma/client-runtime-utils, @prisma/debug, etc.
BUN_DIR="../../node_modules/.bun"
if [ -d "$BUN_DIR" ]; then
  for ENTRY in "$BUN_DIR"/@prisma+*/; do
    [ -d "$ENTRY" ] || continue
    NM_DIR="$ENTRY/node_modules"
    [ -d "$NM_DIR" ] || continue
    for PKG_DIR in "$NM_DIR"/@prisma/*/; do
      [ -d "$PKG_DIR" ] || continue
      PKG_NAME="@prisma/$(basename "$PKG_DIR")"
      DEST="node_modules/$PKG_NAME"
      if [ ! -d "$DEST" ] || [ -L "$DEST" ]; then
        rm -rf "$DEST"
        mkdir -p "$(dirname "$DEST")"
        cp -r "$PKG_DIR" "$DEST"
        echo "Copied $PKG_NAME"
      fi
    done
    # Also copy non-scoped deps from prisma packages
    for PKG_DIR in "$NM_DIR"/*/; do
      PKG_NAME=$(basename "$PKG_DIR")
      [ "$PKG_NAME" = "@prisma" ] && continue
      [ "$PKG_NAME" = ".bin" ] && continue
      DEST="node_modules/$PKG_NAME"
      if [ ! -d "$DEST" ] || [ -L "$DEST" ]; then
        rm -rf "$DEST"
        cp -r "$PKG_DIR" "$DEST"
      fi
    done
  done
  echo "All @prisma/* sub-deps copied"
fi

# Copy .prisma/client generated files
PRISMA_GEN=$(find ../../node_modules/.bun -path "*@prisma+client*/node_modules/.prisma/client" -type d 2>/dev/null | head -1)
if [ -n "$PRISMA_GEN" ]; then
  mkdir -p node_modules/.prisma/client
  cp -r "$PRISMA_GEN"/* node_modules/.prisma/client/
  echo "Copied .prisma/client"
fi

echo "=== Pre-build complete ==="
