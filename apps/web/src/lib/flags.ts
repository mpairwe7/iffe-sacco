/**
 * Feature flags — Phase 0 scaffold.
 *
 * Reads flags from Vercel Edge Config when provisioned (`EDGE_CONFIG` env var),
 * otherwise falls back to static defaults. Every flag has a typed default so
 * the rest of the app can call `await flag("ledgerEnabled")` with confidence
 * that the flag exists even before Edge Config is wired up.
 *
 * Usage:
 *   const on = await flag("ledgerEnabled");
 *   if (on) { ... }
 *
 * When you add a flag here:
 *   1. Choose a conservative default (usually `false`).
 *   2. Document the kill-switch semantics in the JSDoc.
 *   3. Mirror the key in Edge Config once you're ready to flip it in prod.
 */

export type FlagName =
  | "ledgerEnabled"
  | "passkeyAuth"
  | "fraudScoring"
  | "pwaOfflineCache"
  | "cacheComponentsDashboards";

const DEFAULTS: Record<FlagName, boolean> = {
  /**
   * When true, financial mutations route through the double-entry ledger
   * (Phase 1). When false, legacy direct-balance updates continue to run.
   *
   * **Flipped to `true` in Phase 9.6** — the backfill + reconcile sequence
   * completed with zero variance against production Neon (see
   * `docs/phases.md` → `ae3f484` for the verification). Any new deposit,
   * withdrawal, loan disbursement, loan repayment, or pledge payment
   * routed through the workflow runtime will now post balanced journal
   * entries alongside the legacy `Account.balance` projection.
   *
   * Override via Edge Config key `flag:ledgerEnabled` if you need to
   * kill-switch back to `false` without a deploy.
   */
  ledgerEnabled: true,
  /** WebAuthn passkey enrolment + login (Phase 2). */
  passkeyAuth: false,
  /** AI-gateway fraud scoring on high-value transactions (Phase 7). */
  fraudScoring: false,
  /** Service worker offline cache for read-only dashboard views (Phase 6). */
  pwaOfflineCache: false,
  /** Next.js 16 Cache Components on admin/chairman dashboards (Phase 6). */
  cacheComponentsDashboards: false,
};

let edgeConfigClient: Promise<{ get: (key: string) => Promise<unknown> } | null> | null = null;

function loadEdgeConfig() {
  if (edgeConfigClient) return edgeConfigClient;
  if (!process.env.EDGE_CONFIG) {
    edgeConfigClient = Promise.resolve(null);
    return edgeConfigClient;
  }
  edgeConfigClient = import("@vercel/edge-config")
    .then((mod) => ({ get: mod.get as (key: string) => Promise<unknown> }))
    .catch(() => null);
  return edgeConfigClient;
}

export async function flag(name: FlagName): Promise<boolean> {
  const client = await loadEdgeConfig();
  if (client) {
    try {
      const value = await client.get(`flag:${name}`);
      if (typeof value === "boolean") return value;
    } catch {
      // Fall through to default on any read error.
    }
  }
  return DEFAULTS[name];
}

/** Synchronous default accessor for tests and build-time branching. */
export function flagDefault(name: FlagName): boolean {
  return DEFAULTS[name];
}
