#!/bin/bash
set -e

cd ../..
bun install

# Build shared package to JS
cd packages/shared
npx tsc --outDir dist --declaration --module ESNext --moduleResolution bundler --target ES2022 --esModuleInterop --skipLibCheck src/index.ts src/types.ts src/schemas.ts src/constants.ts
cd ../..

# Generate Prisma
cd apps/api
npx prisma generate

# Copy compiled shared package
rm -rf node_modules/@iffe/shared
mkdir -p node_modules/@iffe/shared/dist
cp ../../packages/shared/dist/*.js node_modules/@iffe/shared/dist/
cp ../../packages/shared/dist/*.d.ts node_modules/@iffe/shared/dist/ 2>/dev/null || true
echo '{"name":"@iffe/shared","main":"dist/index.js","types":"dist/index.d.ts"}' > node_modules/@iffe/shared/package.json

echo "Vercel install complete"
