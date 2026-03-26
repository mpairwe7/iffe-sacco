#!/bin/bash
set -e

cd ../..
bun install

# Build shared package to JS using bun
cd packages/shared
bun build src/index.ts src/types.ts src/schemas.ts src/constants.ts --outdir dist --target node
cd ../..

# Generate Prisma
cd apps/api
npx prisma generate

# Copy compiled shared package
rm -rf node_modules/@iffe/shared
mkdir -p node_modules/@iffe/shared/dist
cp ../../packages/shared/dist/* node_modules/@iffe/shared/dist/
echo '{"name":"@iffe/shared","main":"dist/index.js"}' > node_modules/@iffe/shared/package.json

echo "Vercel install complete"
