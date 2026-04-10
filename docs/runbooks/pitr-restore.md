# Runbook: Neon PITR Restore

**Owner:** Platform / DB on-call
**SLO:** Restore to operational state within 60 minutes of decision

## When to use

- Accidental destructive SQL run against production (DROP / TRUNCATE / bad UPDATE)
- Data corruption confirmed and reproducible
- Ransomware / tampering incident
- Failed migration that corrupted rows (see also: [prisma-rollback](./prisma-rollback.md))

## Pre-restore checklist

- [ ] **Incident declared** in #incidents, severity recorded.
- [ ] **Cutoff timestamp identified** — pick the latest known-good point.
- [ ] **Two-person approval** — restores are destructive, require peer sign-off.
- [ ] Current production snapshot captured: `pg_dump` to local before restoring.
- [ ] Communication plan: users will be locked out for the restore window.

## Restore procedure

Neon supports branch-based PITR: you create a new branch at the target
timestamp, promote it, and point the production connection string at
the promoted branch.

1. **Identify the restore point.** In Neon console → Project → History,
   find the latest wall-clock time before the incident.

2. **Create the PITR branch.**
   ```bash
   neonctl branches create \
     --name restore-$(date +%Y%m%d-%H%M) \
     --parent main \
     --parent-timestamp "2026-04-10T09:45:00Z"
   ```

3. **Validate the restored data** on the new branch. Connect with the
   branch-specific connection string:
   ```bash
   psql "$RESTORE_BRANCH_URL" -c "SELECT COUNT(*) FROM journal_entries;"
   psql "$RESTORE_BRANCH_URL" -c "SELECT * FROM journal_entries ORDER BY occurredAt DESC LIMIT 10;"
   ```
   Run `apps/api/scripts/reconcile-ledger.ts` against the restore branch
   to confirm the ledger is balanced at that point.

4. **Promote the branch.** In Neon console or via `neonctl`:
   ```bash
   neonctl branches set-primary <restore-branch-id>
   ```

5. **Update Vercel `DATABASE_URL`** to point at the promoted branch:
   ```bash
   vercel env rm DATABASE_URL production
   vercel env add DATABASE_URL production
   # paste new connection string
   vercel --prod
   ```

6. **Verify production.**
   ```bash
   curl -s $PROD/api/v1/health/ready | jq
   curl -s $PROD/api/v1/reports/trial-balance | jq
   ```

7. **Re-enable any feature flags** that were turned off during the incident.

## Post-restore tasks

- [ ] Identify every write that happened between the cutoff and the
      restore point — those writes are lost. Reach out to affected users.
- [ ] Open a post-mortem within 24 hours.
- [ ] Revoke old DB credentials.
- [ ] Delete the old "damaged" main branch only after 14 days of
      confidence in the restore.
- [ ] Update this runbook with any lessons learned.

## Gotchas

- **Migrations applied post-cutoff are lost.** You may need to re-apply
  `prisma migrate deploy` and hand-fix anything in between.
- **In-flight workflow runs will be re-executed** when WDK resumes against
  the restored DB. Idempotency keys should protect you; verify by grepping
  `workflow_runs` for duplicates.
- **Sessions issued post-cutoff** are invalid after restore (DB rows gone).
  All users must re-login.
