# Runbook: Prisma Migration Rollback

**Owner:** Platform / Backend on-call
**SLO:** Restore service within 15 minutes of alert

## Symptoms

- Vercel deploy fails at the `bun run db:migrate` step
- API `/ready` returns 503 with `database` check failing
- `prisma.migrate` error in logs: `P3009` (failed migration) or `P3018` (migration applied with errors)

## Immediate action

1. **Freeze traffic promotion** — open the Vercel dashboard, find the deployment, click _Rollback_ to the previous known-good production deployment. Rolling Releases users can pause the rollout.
2. Announce in #incidents with: deployment SHA, failing migration name, timestamps.

## Diagnosis

```bash
# Inspect the failed migration
bunx prisma migrate status
# Review the failing SQL
cat apps/api/prisma/migrations/<failing_migration>/migration.sql
# Check for partially applied state
psql "$DATABASE_URL" -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

## Resolution

### Option A: Mark the migration as rolled back (non-destructive schema change)

If the migration only added new nullable columns or new tables with no code consuming them yet:

```bash
bunx prisma migrate resolve --rolled-back <migration_name>
# Write a corrective migration that drops the added objects
bunx prisma migrate dev --name revert_<migration_name>
```

### Option B: Restore from PITR (data-changing migration that partially ran)

If data was mutated and you cannot reconstruct a correct forward-fix:

1. Follow [PITR restore](./pitr-restore.md) to a point before the migration started.
2. Verify `SELECT COUNT(*) FROM _prisma_migrations` matches the pre-deploy state.
3. Re-deploy the last known-good application SHA.

### Option C: Forward-fix (new migration that corrects state)

For small, additive failures only. Create a new migration that brings the schema to the intended end-state without rolling back:

```bash
bunx prisma migrate dev --name fix_<original_name>
```

## Post-incident tasks

- [ ] Open a post-mortem doc within 24 hours.
- [ ] Add a shadow-DB test for the failing migration in CI.
- [ ] If the root cause was an assumption about existing data, add a data-audit script to `apps/api/scripts/`.
- [ ] Update this runbook with any new diagnostic steps.
