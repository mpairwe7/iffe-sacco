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
// Externalized deps that need to be copied (not bundled)
const deps = ["@neondatabase/serverless"];

// Copy ALL @prisma/* packages from Bun cache
const bunDir = join(rootDir, "node_modules", ".bun");
if (existsSync(bunDir)) {
  for (const entry of readdirSync(bunDir)) {
    if (!entry.startsWith("@prisma+")) continue;
    const nmDir = join(bunDir, entry, "node_modules");
    if (!existsSync(nmDir)) continue;
    for (const pkg of readdirSync(nmDir)) {
      const src = join(nmDir, pkg);
      if (pkg.startsWith("@")) {
        // Scoped package - go one level deeper
        for (const sub of readdirSync(src)) {
          const subSrc = join(src, sub);
          const subDest = join(targetNodeModules, pkg, sub);
          if (!existsSync(subDest)) {
            mkdirSync(dirname(subDest), { recursive: true });
            cpSync(subSrc, subDest, { recursive: true, dereference: true, force: true });
          }
        }
      } else if (pkg !== ".bin") {
        const dest = join(targetNodeModules, pkg);
        if (!existsSync(dest)) {
          cpSync(src, dest, { recursive: true, dereference: true, force: true });
        }
      }
    }
  }
  console.log("  OK @prisma/* (all packages from .bun/ cache)");
}

function findAndCopy(dep) {
  // Check symlinks first
  for (const base of [join(apiDir, "node_modules"), join(rootDir, "node_modules")]) {
    const src = join(base, dep);
    if (!existsSync(src)) continue;
    const real = realpathSync(src);
    const dest = join(targetNodeModules, dep);
    cpSync(real, dest, { recursive: true, dereference: true, force: true });
    // Copy sibling deps
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

  // Search Bun .bun/ cache (for scoped packages like @prisma/client-runtime-utils)
  const bunDir = join(rootDir, "node_modules", ".bun");
  if (existsSync(bunDir)) {
    const depKey = dep.replace("/", "+");
    for (const entry of readdirSync(bunDir)) {
      if (!entry.startsWith(depKey + "@")) continue;
      const src = join(bunDir, entry, "node_modules", dep);
      if (existsSync(src)) {
        const dest = join(targetNodeModules, dep);
        cpSync(src, dest, { recursive: true, dereference: true, force: true });
        return true;
      }
    }
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
