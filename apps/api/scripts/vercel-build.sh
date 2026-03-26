#!/bin/bash
set -e

# Build @iffe/shared to JS and replace symlink AFTER Vercel's install phase
cd ../../packages/shared
bun build src/index.ts src/types.ts src/schemas.ts src/constants.ts --outdir dist --target node
cd ../../apps/api

# Replace workspace symlink with real compiled files
rm -rf node_modules/@iffe/shared
mkdir -p node_modules/@iffe/shared/dist
cp ../../packages/shared/dist/* node_modules/@iffe/shared/dist/
echo '{"name":"@iffe/shared","main":"dist/index.js"}' > node_modules/@iffe/shared/package.json

echo "Build complete - @iffe/shared compiled and copied"
