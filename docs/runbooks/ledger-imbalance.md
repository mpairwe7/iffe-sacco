# Runbook: Ledger Imbalance

**Owner:** Platform / Finance on-call
**SLO:** Confirm root cause within 30 minutes; restore within 2 hours

## Symptoms

- Alert: `ledger.trial_balance.variance_nonzero` fires
- `bun run apps/api/scripts/reconcile-ledger.ts` exits with code 2
- Finance reports that a member balance does not match recent activity

## Immediate action

1. **Freeze writes to the ledger**: toggle the `ledgerEnabled` feature flag
   off in Edge Config. This pauses new workflow runs from writing journal
   entries, but lets existing reads continue. Announce in #incidents.
2. Capture the variance snapshot: `bun run apps/api/scripts/reconcile-ledger.ts > /tmp/reconcile-$(date +%s).log`
3. Save a DB snapshot tag in Neon for PITR.

## Diagnosis

```bash
# Overall trial balance
curl -s "$API_URL/api/v1/reports/trial-balance" | jq

# Last 100 journal entries
psql "$DATABASE_URL" -c "
  SELECT e.id, e.description, e.idempotencyKey, SUM(l.debit) AS d, SUM(l.credit) AS c
  FROM journal_entries e JOIN journal_lines l ON l.\"entryId\" = e.id
  GROUP BY e.id
  HAVING SUM(l.debit) <> SUM(l.credit)
  ORDER BY e.\"occurredAt\" DESC
  LIMIT 20;
"

# Per-account variance
psql "$DATABASE_URL" -c "
  SELECT a.id, a.\"accountNo\", a.balance,
    COALESCE(SUM(l.credit - l.debit), 0) AS ledger_balance,
    a.balance - COALESCE(SUM(l.credit - l.debit), 0) AS variance
  FROM accounts a LEFT JOIN journal_lines l ON l.\"memberAccountId\" = a.id
  GROUP BY a.id
  HAVING a.balance <> COALESCE(SUM(l.credit - l.debit), 0)
  LIMIT 20;
"
```

## Resolution

### Scenario A: Unbalanced entry slipped past the invariant

If you find a `journal_entries` row where the line sums don't match:

1. **This should be impossible** — the builder rejects unbalanced entries.
2. File a P0 ticket: "JournalEntry invariant bypassed"
3. Post a corrective journal entry (Dr or Cr to `Suspense 2900`) to
   rebalance, tagged with `metadata.correctionFor = <original_entry_id>`.
4. Investigate how the write path bypassed the builder.

### Scenario B: Projection drifted (Account.balance ≠ ledger sum)

The ledger is authoritative. Correct the projection:

```sql
BEGIN;
UPDATE accounts a
  SET balance = COALESCE((
    SELECT SUM(l.credit - l.debit)
    FROM journal_lines l
    WHERE l."memberAccountId" = a.id
  ), 0)
  WHERE a.id = '<affected_account_id>';
COMMIT;
```

Run reconcile again to confirm variance resolved.

### Scenario C: Legacy data not backfilled

If variance matches pre-ledger-era transactions, re-run the backfill:

```bash
bun run apps/api/scripts/backfill-ledger.ts
```

## Post-incident tasks

- [ ] Post-mortem within 24h.
- [ ] Add a property-based test covering the specific scenario.
- [ ] Review whether the affected workflow bypassed `postJournal()`.
- [ ] Re-enable `ledgerEnabled` only after two consecutive successful reconcile runs.
