/**
 * Copy runtime dependencies into api/node_modules/ so Vercel serverless
 * functions can resolve them. Bun stores packages with symlinks that
 * Vercel's bundler can't follow at runtime.
 */
import { cpSync, readdirSync, mkdirSync, existsSync, realpathSync } from "node:fs";
import { join, dirname } from "node:path";

const apiDir = join(import.meta.dirname, "..");
const rootDir = join(apiDir, "..", "..");
const targetNodeModules = join(apiDir, "api", "node_modules");
mkdirSync(targetNodeModules, { recursive: true });

// Packages the bundle externalizes
const deps = [
  "@prisma/client",
  "@prisma/client-runtime-utils",
  "@prisma/adapter-neon",
  "@prisma/driver-adapter-utils",
  "@neondatabase/serverless",
  "bcryptjs",
  "jose",
];

function findAndCopy(dep) {
  // Check local node_modules first, then monorepo root
  for (const base of [join(apiDir, "node_modules"), join(rootDir, "node_modules")]) {
    const src = join(base, dep);
    if (!existsSync(src)) continue;

    const real = realpathSync(src);
    const dest = join(targetNodeModules, dep);
    cpSync(real, dest, { recursive: true, dereference: true, force: true });

    // Copy sibling deps from the resolved parent
    const parent = dirname(real);
    for (const entry of readdirSync(parent, { withFileTypes: true })) {
      if (entry.name === ".bin") continue;
      const sibling = join(parent, entry.name);
      const sibDest = join(targetNodeModules, entry.name);
      if (!existsSync(sibDest)) {
        cpSync(sibling, sibDest, { recursive: true, dereference: true, force: true });
      }
    }
    return true;
  }
  return false;
}

for (const dep of deps) {
  const ok = findAndCopy(dep);
  console.log(`  ${ok ? "OK" : "SKIP"} ${dep}`);
}

// CRITICAL: Copy the generated Prisma client (.prisma/client/)
// @prisma/client requires this at runtime via require('.prisma/client/default')
// Bun stores it inside .bun/@prisma+client@xxx/node_modules/.prisma/client/
import { globSync } from "node:fs";
let prismaFound = false;

// Search standard locations
for (const base of [join(apiDir, "node_modules"), join(rootDir, "node_modules")]) {
  const prismaGen = join(base, ".prisma", "client");
  if (existsSync(prismaGen)) {
    const dest = join(targetNodeModules, ".prisma", "client");
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(realpathSync(prismaGen), dest, { recursive: true, dereference: true, force: true });
    console.log("  OK .prisma/client (standard)");
    prismaFound = true;
    break;
  }
}

// Search Bun's .bun/ cache directory
if (!prismaFound) {
  const bunDir = join(rootDir, "node_modules", ".bun");
  if (existsSync(bunDir)) {
    for (const entry of readdirSync(bunDir)) {
      if (!entry.startsWith("@prisma+client@")) continue;
      const prismaGen = join(bunDir, entry, "node_modules", ".prisma", "client");
      if (existsSync(prismaGen)) {
        const dest = join(targetNodeModules, ".prisma", "client");
        mkdirSync(dirname(dest), { recursive: true });
        cpSync(prismaGen, dest, { recursive: true, dereference: true, force: true });
        console.log(`  OK .prisma/client (from .bun/${entry})`);
        prismaFound = true;
        break;
      }
    }
  }
}

if (!prismaFound) console.log("  WARN .prisma/client NOT FOUND");

console.log("Deps copied to api/node_modules/");
