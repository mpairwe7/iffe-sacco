# Database

## Provider

| Detail | Value |
|--------|-------|
| **Provider** | NeonDB (Serverless PostgreSQL) |
| **Region** | `aws-ap-southeast-1` (Singapore) |
| **Project** | `snowy-water-12689441` |
| **Host** | `ep-frosty-water-a14qap8n.ap-southeast-1.aws.neon.tech` |
| **PostgreSQL Version** | 17 |
| **ORM** | Prisma 7.5 |
| **Adapter** | `@prisma/adapter-pg` (node-pg Pool) |

## Connection

Prisma 7.x uses `prisma.config.ts` for connection URLs (no longer in `schema.prisma`):

```typescript
// apps/api/prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },
});
```

Runtime connection uses the `PrismaPg` adapter:

```typescript
// apps/api/src/config/db.ts
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
└────┬─────┘              └────┬─────┘              └──────┬───────┘
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
                               │
                               │ 1:N (via memberId)
                               │
┌──────────────┐     1:N  ┌────▼─────┐
│WelfareProgram│──────────│  Pledge  │
│              │          │          │
│ name         │          │ memberId │──FK to Member
│ targetAmount │          │ amount   │
│ raisedAmount │          │ status   │
└──────────────┘          └──────────┘

┌──────────────┐  ┌──────────────┐  ┌─────────────────┐
│ DepositReq   │  │ WithdrawReq  │  │ PaymentGateway  │
│              │  │              │  │                 │
│ memberId     │  │ memberId     │  │ name            │
│ accountId    │  │ accountId    │  │ type            │
│ amount       │  │ amount       │  │ currency        │
│ status       │  │ status       │  │ isActive        │
└──────────────┘  └──────────────┘  └─────────────────┘

┌──────────────┐  ┌──────────┐  ┌──────────┐
│  BankAccount │  │ Expense  │  │ Setting  │
│              │  │          │  │          │
│ bankName     │  │ category │  │ key      │
│ accountNo    │  │ amount   │  │ value    │
│ balance      │  │ status   │  └──────────┘
└──────────────┘  └──────────┘
```

## Models (14)

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
SACCO member profile. Optionally linked to User for self-service portal access.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| memberId | String | Unique (IFFE-001 format), indexed |
| firstName, lastName | String | Required |
| email, phone | String | Required, email indexed |
| gender, nationalId, occupation | String? | Optional profile fields |
| address, city, district, country | String? | Address (country default "UG") |
| status | String | "active" / "pending" / "inactive" / "suspended", indexed |
| userId | UUID? | FK to User (unique, 1:1) |

### Account
Financial account for a member. Supports multiple types per member.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| accountNo | String | Unique (SAV-0001/FIX-0002/CUR-0003), indexed |
| memberId | UUID | FK to Member (cascade delete) |
| type | String | "savings" / "current" / "fixed_deposit" |
| balance | Decimal(15,2) | Default 0 |
| interestRate | Decimal(5,2) | Annual rate (savings: 12%, fixed: 15%, current: 5%) |
| status | String | "active" / "dormant" / "frozen" / "closed", indexed |

### Transaction
All financial movements. Balance updated on approval.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| accountId | UUID | FK to Account (cascade delete), indexed |
| type | String | deposit / withdrawal / transfer / loan_repayment / loan_disbursement / interest_credit / fee, indexed |
| amount | Decimal(15,2) | Must be positive |
| method | String | cash / mobile_money / bank_transfer / cheque / internal |
| reference | String? | External reference number |
| status | String | pending / completed / rejected / reversed, indexed |
| processedBy | UUID? | User ID who approved/rejected |
| createdAt | DateTime | Indexed for time-series queries |

### Loan
Full lifecycle: pending → approved → active → paid/overdue/defaulted.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| memberId | UUID | FK to Member (cascade delete), indexed |
| type | String | business / personal / emergency / education / housing |
| amount | Decimal(15,2) | Principal |
| balance | Decimal(15,2) | Outstanding (decreases with repayments) |
| interestRate | Decimal(5,2) | Annual rate |
| term | Int | Duration in months |
| monthlyPayment | Decimal(15,2) | Auto-calculated via amortization formula |
| nextPaymentDate | DateTime? | Indexed for upcoming payment queries |
| status | String | pending / approved / active / paid / overdue / defaulted / rejected |
| approvedBy | UUID? | Admin who approved |
| disbursedAt | DateTime? | When funds were released |

### Expense
Organizational expenses with approval workflow.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| description | String | Required |
| category | String | Salaries / Rent / Utilities / Marketing / Operations / IT / Training / Insurance |
| amount | Decimal(15,2) | Required |
| date | DateTime | Expense date, indexed |
| status | String | pending / approved / rejected, indexed |
| approvedBy | UUID? | Admin who approved |

### DepositRequest
Member-initiated deposit requests requiring admin approval.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| memberId | String | Indexed |
| accountId | String | Target account |
| amount | Decimal(15,2) | Requested amount |
| method | String | Payment method |
| status | String | pending / approved / rejected, indexed |
| processedBy | UUID? | Staff/admin who processed |

### WithdrawRequest
Member-initiated withdrawal requests requiring admin approval.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| memberId | String | Indexed |
| accountId | String | Source account |
| amount | Decimal(15,2) | Requested amount |
| reason | String? | Withdrawal reason |
| status | String | pending / approved / rejected, indexed |

### WelfareProgram + Pledge
Social welfare with member pledges. Pledge has FK to both WelfareProgram and Member.

### PaymentGateway
Payment gateway configuration (MTN, Airtel, Visa, etc.) with active/inactive toggle.

### BankAccount
SACCO's organizational bank accounts with balances.

### AuditLog
System activity log. FK to User. Tracks action, entity, entityId, IP address.

### Setting
Key-value system configuration (company_name, currency, timezone, etc.).

## Indexes

Optimized for common query patterns:

```
users:              email, role
members:            status, email, memberId
accounts:           memberId, status, accountNo
transactions:       accountId, type, status, createdAt
loans:              memberId, status, nextPaymentDate
expenses:           category, status, date
deposit_requests:   memberId, status
withdraw_requests:  memberId, status
pledges:            programId, memberId
audit_logs:         userId, entity, createdAt
```

## Migrations

```bash
cd apps/api

# Create a new migration
bunx prisma migrate dev --name <description>

# Apply pending migrations (production)
bunx prisma migrate deploy

# Reset database (development only — DESTRUCTIVE)
bunx prisma migrate reset

# Push schema without migration file
bunx prisma db push

# Open Prisma Studio
bunx prisma studio
```

### Migration History

| Migration | Description |
|-----------|-------------|
| `20260325224040_init` | Initial schema: User, Member, Account, Transaction, Loan, Expense, WelfareProgram, Pledge, AuditLog, BankAccount, Setting |
| `20260325230945_add_requests_gateways_pledge_relations` | Added DepositRequest, WithdrawRequest, PaymentGateway models. Added Member→Pledge relation. |

## Seeding

### SQL Seed (Recommended)

```bash
cd apps/api
bunx prisma db execute --stdin < prisma/seed.sql
```

### TypeScript Seed (Alternative)

```bash
cd apps/api
bun run db:seed
```

### Seed Data Summary (209+ records)

| Entity | Count | Status Distribution | Notes |
|--------|-------|-------------------|-------|
| **Users** | 8 | 2 admin, 3 staff (1 inactive), 2 member, 1 inactive staff | All password: `password123` |
| **Members** | 16 | 10 active, 3 pending, 1 inactive, 1 suspended | Linked to users where applicable |
| **Accounts** | 20 | 16 active, 1 dormant, 1 frozen, 1 closed | Mix: 13 savings, 3 fixed_deposit, 4 current |
| **Transactions** | 40 | 28 completed, 6 pending, 2 rejected, 1 reversed | All types: deposit, withdrawal, transfer, loan_repayment, loan_disbursement, interest_credit, fee. Spread over 40 days. |
| **Loans** | 16 | 8 active, 3 pending, 2 paid, 1 overdue, 1 rejected, 1 defaulted | Types: business, personal, emergency, education, housing |
| **Expenses** | 20 | 14 approved, 4 pending, 1 rejected | 8 categories: Salaries, Rent, Utilities, Marketing, Operations, IT, Training, Insurance |
| **Deposit Requests** | 10 | 4 pending, 4 approved, 2 rejected | Mixed methods: cash, mobile_money, bank_transfer |
| **Withdraw Requests** | 10 | 3 pending, 4 approved, 3 rejected | With reasons |
| **Payment Gateways** | 5 | 2 active (MTN, Airtel), 3 inactive (Stanbic, Visa, PayPal) | |
| **Welfare Programs** | 4 | All active with varied funding (32-64%) | Medical, Education, Bereavement, Housing |
| **Pledges** | 25 | 10 paid, 10 pledged, 5 cancelled | Distributed across all 4 programs and 14 members |
| **Bank Accounts** | 5 | 4 active, 1 inactive | Stanbic, DFCU, Centenary, Equity, Bank of Africa |
| **Settings** | 15 | All active | Company info, currency, limits, security flags |
| **Audit Logs** | 15 | Login, create, approve, reject, update, deactivate | Spread over 15 days |

### Default Login Credentials

| Portal | Email | Password |
|--------|-------|----------|
| **Admin** | admin@iffeds.org | password123 |
| **Admin** | superadmin@iffeds.org | password123 |
| **Staff** | staff@iffeds.org | password123 |
| **Staff** | mike@iffeds.org | password123 |
| **Member** | john@example.com | password123 |
| **Member** | grace@example.com | password123 |

> **Security**: Change all passwords immediately in production.
