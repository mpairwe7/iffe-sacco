# Database

## Provider

| Detail | Value |
|--------|-------|
| **Provider** | NeonDB (Serverless PostgreSQL) |
| **Region** | `aws-ap-southeast-1` (Singapore) |
| **PostgreSQL Version** | 17 |
| **ORM** | Prisma 7.5 |
| **Adapter** | `@prisma/adapter-pg` (node-pg Pool) |

## Connection

Prisma 7.x uses `prisma.config.ts` for connection URLs (no longer in `schema.prisma`):

```typescript
// packages/api/prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
```

Runtime connection uses the `PrismaPg` adapter:

```typescript
// packages/api/src/config/db.ts
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

## Entity Relationship Diagram

```
┌──────────┐     1:1      ┌──────────┐     1:N      ┌──────────────┐
│   User   │──────────────│  Member  │──────────────│   Account    │
│          │              │          │              │              │
│ id       │              │ id       │              │ id           │
│ email    │              │ memberId │              │ accountNo    │
│ password │              │ firstName│              │ type         │
│ role     │              │ lastName │              │ balance      │
│ isActive │              │ status   │              │ interestRate │
│ lastLogin│              │ userId   │──FK          │ memberId     │──FK
└──────────┘              └──────────┘              └──────┬───────┘
     │                         │                          │
     │ 1:N                     │ 1:N                      │ 1:N
     │                         │                          │
┌────▼─────┐              ┌────▼─────┐              ┌─────▼────────┐
│ AuditLog │              │   Loan   │              │ Transaction  │
│          │              │          │              │              │
│ action   │              │ type     │              │ type         │
│ entity   │              │ amount   │              │ amount       │
│ details  │              │ balance  │              │ method       │
│ ipAddress│              │ term     │              │ status       │
└──────────┘              │ status   │              │ processedBy  │
                          └──────────┘              └──────────────┘

┌──────────────┐     1:N      ┌──────────┐
│WelfareProgram│──────────────│  Pledge  │
│              │              │          │
│ name         │              │ memberId │
│ targetAmount │              │ amount   │
│ raisedAmount │              │ status   │
└──────────────┘              └──────────┘

┌──────────────┐              ┌──────────┐
│  BankAccount │              │ Setting  │
│              │              │          │
│ bankName     │              │ key      │
│ accountNo    │              │ value    │
│ balance      │              └──────────┘
└──────────────┘

┌──────────────┐
│   Expense    │
│              │
│ description  │
│ category     │
│ amount       │
│ status       │
└──────────────┘
```

## Models

### User
Central authentication entity. Links to Member (1:1) and AuditLog (1:N).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto |
| name | String | Required |
| email | String | Unique, indexed |
| phone | String? | Optional |
| password | String | bcrypt hash |
| role | String | "admin" / "member" / "staff" |
| avatar | String? | URL |
| isActive | Boolean | Default true |
| lastLogin | DateTime? | Updated on login |

### Member
SACCO member profile. Created by admin/staff, optionally linked to User for self-service.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| memberId | String | Unique (IFFE-001 format) |
| firstName | String | Required |
| lastName | String | Required |
| email | String | Indexed |
| phone | String | Required |
| status | String | "active" / "pending" / "inactive" / "suspended" |
| userId | UUID? | FK to User (unique, 1:1) |

### Account
Financial account for a member. Supports savings, current, and fixed deposit types.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| accountNo | String | Unique (SAV-0001 format) |
| memberId | UUID | FK to Member |
| type | String | "savings" / "current" / "fixed_deposit" |
| balance | Decimal(15,2) | Default 0 |
| interestRate | Decimal(5,2) | Annual rate |
| status | String | "active" / "dormant" / "frozen" / "closed" |

### Transaction
All financial movements. Auto-updates account balance on approval.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| accountId | UUID | FK to Account |
| type | String | deposit/withdrawal/transfer/loan_repayment/etc. |
| amount | Decimal(15,2) | Must be positive |
| method | String | cash/mobile_money/bank_transfer/cheque/internal |
| status | String | pending/completed/rejected/reversed |
| processedBy | UUID? | Admin who approved/rejected |

### Loan
Loan lifecycle: pending → approved → active → paid/overdue/defaulted.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| memberId | UUID | FK to Member |
| amount | Decimal(15,2) | Principal |
| balance | Decimal(15,2) | Outstanding |
| interestRate | Decimal(5,2) | Annual rate |
| term | Int | Months |
| monthlyPayment | Decimal(15,2) | Auto-calculated |
| nextPaymentDate | DateTime? | Indexed |

## Indexes

Optimized for common query patterns:

```
users:         email, role
members:       status, email, memberId
accounts:      memberId, status, accountNo
transactions:  accountId, type, status, createdAt
loans:         memberId, status, nextPaymentDate
expenses:      category, status, date
audit_logs:    userId, entity, createdAt
pledges:       programId, memberId
```

## Migrations

```bash
# Create a new migration
bunx prisma migrate dev --name <description>

# Apply pending migrations (production)
bunx prisma migrate deploy

# Reset database (development only)
bunx prisma migrate reset

# View migration history
ls packages/api/prisma/migrations/
```

## Seeding

```bash
cd packages/api
bun run db:seed
```

The seed creates:
- 3 users (admin, staff, member) — password: `password123`
- 12 members with varied statuses
- 12 accounts (savings, current, fixed deposit)
- 15 transactions (deposits, withdrawals, repayments)
- 8 loans (active, pending, paid, overdue)
- 8 expenses across categories
- 4 welfare programs with pledges
- 3 bank accounts
- 10 system settings
