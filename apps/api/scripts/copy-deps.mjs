/**
 * Copy native/runtime dependencies into api/ so the Vercel serverless
 * function can resolve them. Bun stores packages in
 * node_modules/.bun/<pkg>@<ver>/node_modules/ with symlinks that
 * Vercel's bundler can't follow.
 */
import { cpSync, readdirSync, mkdirSync, existsSync, realpathSync } from "node:fs";
import { join, dirname } from "node:path";

const apiDir = join(import.meta.dirname, "..");
const targetNodeModules = join(apiDir, "api", "node_modules");
mkdirSync(targetNodeModules, { recursive: true });

const deps = [
  "@prisma/client",
  "@prisma/adapter-neon",
  "@neondatabase/serverless",
  "bcryptjs",
  "jose",
];

for (const dep of deps) {
  try {
    const symlink = join(apiDir, "node_modules", dep);
    if (!existsSync(symlink)) {
      // Try monorepo root
      const rootSymlink = join(apiDir, "..", "..", "node_modules", dep);
      if (!existsSync(rootSymlink)) {
        console.log(`  SKIP ${dep} (not found)`);
        continue;
      }
      const real = realpathSync(rootSymlink);
      const dest = join(targetNodeModules, dep);
      cpSync(real, dest, { recursive: true, dereference: true, force: true });
      console.log(`  OK ${dep} (from root)`);
      continue;
    }
    const real = realpathSync(symlink);
    const dest = join(targetNodeModules, dep);
    cpSync(real, dest, { recursive: true, dereference: true, force: true });

    // Also copy sibling deps from the resolved node_modules
    const parent = dirname(real);
    for (const entry of readdirSync(parent, { withFileTypes: true })) {
      if (entry.name === ".bin" || entry.name === dep.split("/").pop()) continue;
      const src = join(parent, entry.name);
      const entryDest = entry.name.startsWith("@")
        ? join(targetNodeModules, entry.name)
        : join(targetNodeModules, entry.name);
      if (!existsSync(entryDest)) {
        cpSync(src, entryDest, { recursive: true, dereference: true, force: true });
      }
    }
    console.log(`  OK ${dep}`);
  } catch (e) {
    console.log(`  ERR ${dep}: ${e.message}`);
  }
}

console.log("Native deps copied to api/node_modules/");
