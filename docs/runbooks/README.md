# Runbooks

Operational procedures for on-call engineers. Each runbook is triggered by a
specific alert or failure mode and has clear entry conditions, diagnostic
steps, and resolution actions.

## Index

| Runbook | When to use |
|---|---|
| [Prisma migration rollback](./prisma-rollback.md) | Deploy fails mid-migration or broken migration in prod |
| [Secrets rotation](./secrets-rotation.md) | Quarterly cadence or after suspected leak |
| [PITR restore](./pitr-restore.md) | Data loss or corruption requiring point-in-time recovery |
| [Stuck workflow](./stuck-workflow.md) | WDK run stays in `running` past expected duration |
| [Ledger imbalance](./ledger-imbalance.md) | `sum(debits) ≠ sum(credits)` alert fires |
| [Auth incident](./auth-incident.md) | Suspicious login spike, BotID blocks surge |

## Conventions

- Runbooks live in this directory as plain markdown.
- Every runbook has: **Symptoms**, **Immediate action**, **Diagnosis**,
  **Resolution**, **Post-incident tasks**.
- Commands are copy-pasteable; substitute env vars are marked `<LIKE_THIS>`.
- Sensitive commands (destructive, cross-environment) require two-person sign-off.
