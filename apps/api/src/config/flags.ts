/**
 * Server-side feature flags.
 *
 * Mirrors `apps/web/src/lib/flags.ts` but reads exclusively from
 * environment variables so the API has no runtime dependency on Edge
 * Config. The defaults intentionally match the web flags so local dev
 * and deployed behaviour are consistent without extra wiring.
 *
 * To flip a flag in production without a code change:
 *
 *     vercel env add LEDGER_ENABLED production    # paste "false"
 *     vercel --prod --yes                         # triggers redeploy
 *
 * The redeploy is the kill-switch mechanism — there is no hot-reload
 * of env vars in Vercel Functions.
 */

function readBoolFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === "") return defaultValue;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return defaultValue;
}

export const flags = {
  /**
   * When true, new financial writes route through the double-entry
   * ledger workflows (see apps/api/src/workflows). Each write posts a
   * balanced JournalEntry in addition to the legacy Account.balance
   * projection and Transaction row.
   *
   * Defaults to true post-Phase 9.6. Set `LEDGER_ENABLED=false` in
   * Vercel env to revert live writes to the legacy direct-balance
   * path without a code change.
   */
  get ledgerEnabled(): boolean {
    return readBoolFlag("LEDGER_ENABLED", true);
  },
};
