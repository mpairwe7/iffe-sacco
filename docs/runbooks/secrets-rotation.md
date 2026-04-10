# Runbook: Secrets Rotation

**Owner:** Security / Platform lead
**Cadence:** Quarterly for routine rotation; immediate on suspected compromise

## Secrets to rotate

| Secret | Store | Rotation trigger | Impact |
|---|---|---|---|
| `JWT_SECRET` | Vercel env (api) | Quarterly, or suspected leak | All active sessions invalidated |
| `CREDENTIALS_KEK` | Vercel env (api) | Annually, or suspected leak | Payment gateway configs must be re-encrypted |
| `DATABASE_URL` | Neon + Vercel env | On Neon role rotation | Brief connection blip during deploy |
| `RESEND_API_KEY` | Resend dashboard + Vercel env | On leak | Password reset emails stop until updated |
| `SENTRY_AUTH_TOKEN` | Sentry + Vercel env | On leak | Source map uploads fail |

## Pre-rotation checklist

- [ ] Announce maintenance window in #ops (for JWT_SECRET rotation only — users will be logged out).
- [ ] Confirm latest Neon PITR snapshot is recent.
- [ ] Open a tracking issue: "Secrets rotation $(date +%Y-%m-%d)".

## Procedure: JWT_SECRET

1. Generate new secret:
   ```bash
   openssl rand -base64 48
   ```
2. Add the new value to Vercel with a dual-key alias:
   ```bash
   vercel env add JWT_SECRET production
   # paste new value
   ```
3. Deploy — all currently active sessions will be invalidated on first
   verification against the new secret. Users are redirected to `/login`.
4. Confirm via Sentry that no `Token expired or invalid` errors spike
   outside the expected login churn (~15 min window).
5. Close tracking issue.

## Procedure: CREDENTIALS_KEK

The KEK protects payment gateway configs. Rotation requires re-encrypting
every row with the new KEK before the old one is retired.

1. Generate new KEK:
   ```bash
   openssl rand -base64 32
   ```
2. **Dual-key mode**: temporarily accept both keys. Update the decrypt
   helper to try the new key first, fall back to the old:
   ```ts
   // Temporary shim in apps/api/src/utils/crypto.ts
   const KEKS = [
     process.env.CREDENTIALS_KEK_NEW,
     process.env.CREDENTIALS_KEK,
   ].filter(Boolean);
   ```
3. Set `CREDENTIALS_KEK_NEW` in Vercel and deploy.
4. Run the re-encrypt script (one-shot):
   ```bash
   bun run apps/api/scripts/rotate-kek.ts
   ```
5. Replace `CREDENTIALS_KEK` with the new value, remove `CREDENTIALS_KEK_NEW`,
   and revert the dual-key shim.
6. Redeploy.

## Procedure: DATABASE_URL

1. In Neon dashboard: create a new role password.
2. Add new `DATABASE_URL` to Vercel env (preview first, then production).
3. Deploy preview — verify `GET /api/v1/health/ready` passes.
4. Deploy production — monitor for connection spikes or timeouts.
5. Revoke the old Neon role once the deploy settles.

## Verification after any rotation

- [ ] `curl -s $API/api/v1/health/ready | jq`
- [ ] Sentry error rate within baseline
- [ ] Auth metrics: login success rate unchanged (after expected re-login wave)
- [ ] Reconcile script passes:
      `bun run apps/api/scripts/reconcile-ledger.ts`

## Post-rotation

- [ ] Record rotation in audit log / compliance tracker.
- [ ] Update the `last_rotated_at` tag on the Vercel env variable.
- [ ] If rotating due to suspected compromise: file an incident report.
