#!/bin/bash
set -e

# Install from monorepo root
cd ../..
bun install

# Generate Prisma client
cd apps/api
npx prisma generate

# Copy @iffe/shared as real files (break workspace symlink for Vercel bundler)
rm -rf node_modules/@iffe/shared
mkdir -p node_modules/@iffe/shared/src
cp ../../packages/shared/src/*.ts node_modules/@iffe/shared/src/
cp ../../packages/shared/package.json node_modules/@iffe/shared/

echo "Vercel install complete"
