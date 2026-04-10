/**
 * GL account seed — idempotent bootstrap of the chart of accounts.
 *
 * Run once at app startup (or via a post-deploy hook) to ensure every
 * account defined in `@iffe/ledger`'s chart exists in the database. New
 * account additions are applied automatically; existing accounts are
 * left untouched to preserve any admin edits to `name`/`parentCode`.
 */
// @ts-nocheck
import { GL_ACCOUNT_LIST } from "@iffe/ledger";
import { prisma } from "../config/db";
import { logger } from "../utils/logger";

export async function seedGlAccounts(): Promise<{ inserted: number; existing: number }> {
  let inserted = 0;
  let existing = 0;

  for (const def of GL_ACCOUNT_LIST) {
    const found = await prisma.glAccount.findUnique({ where: { code: def.code } });
    if (found) {
      existing += 1;
      continue;
    }
    await prisma.glAccount.create({
      data: {
        code: def.code,
        name: def.name,
        type: def.type,
        normal: def.normal,
      },
    });
    inserted += 1;
  }

  logger.info(
    { event: "gl.seed", inserted, existing, total: GL_ACCOUNT_LIST.length },
    "GL chart of accounts reconciled",
  );

  return { inserted, existing };
}
