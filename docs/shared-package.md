# Shared Package (`@iffe/shared`)

The shared package contains TypeScript types, Zod validation schemas, and constants used by both the frontend (`apps/web`) and backend (`packages/api`).

## Installation

The package is automatically available via Bun workspaces:

```json
// In any package.json within the monorepo
{ "dependencies": { "@iffe/shared": "workspace:*" } }
```

## Import

```typescript
// From backend
import { loginSchema, type LoginInput, CURRENCY } from "../../../shared/src";

// From frontend (when configured)
import { type Member, ACCOUNT_TYPES } from "@iffe/shared";
```

## Types (`types.ts`)

### Core Entities

| Interface | Key Fields | Used By |
|-----------|-----------|---------|
| `User` | id, name, email, role, isActive, lastLogin | Auth, user management |
| `Member` | id, memberId, firstName, lastName, status | Member CRUD |
| `Account` | id, accountNo, type, balance, interestRate | Account management |
| `Transaction` | id, type, amount, method, status | Transaction processing |
| `Loan` | id, type, amount, balance, monthlyPayment, status | Loan management |
| `Expense` | id, description, category, amount, status | Expense tracking |
| `WelfareProgram` | id, name, targetAmount, raisedAmount | Social welfare |
| `Pledge` | id, programId, memberId, amount, status | Welfare pledges |
| `BankAccount` | id, bankName, accountNo, balance | Bank management |
| `AuditLog` | id, action, entity, details | Audit trail |
| `Setting` | id, key, value | System config |

### Utility Types

| Type | Description |
|------|-------------|
| `Role` | `"admin" \| "member" \| "staff"` |
| `AccountType` | `"savings" \| "current" \| "fixed_deposit"` |
| `TransactionType` | deposit, withdrawal, transfer, loan_repayment, etc. |
| `LoanStatus` | pending, approved, active, paid, overdue, defaulted, rejected |
| `PaginationParams` | page, limit, search, sortBy, sortOrder |
| `PaginatedResponse<T>` | data[], total, page, limit, totalPages |
| `ApiResponse<T>` | success, data?, message?, errors? |
| `AuthTokens` | accessToken, refreshToken |
| `DashboardStats` | totalMembers, totalDeposits, totalWithdrawals, etc. |

## Schemas (`schemas.ts`)

All schemas use **Zod v4** and export both the schema and inferred TypeScript type.

### Auth Schemas

| Schema | Fields | Validation |
|--------|--------|------------|
| `loginSchema` | email, password | email format, min 6 chars |
| `registerSchema` | name, email, phone, password, role | email, min 10 phone, min 8 password |
| `refreshTokenSchema` | refreshToken | non-empty string |

### Entity Schemas

| Schema | Purpose |
|--------|---------|
| `createMemberSchema` | Full member registration (13 fields) |
| `updateMemberSchema` | Partial member update |
| `createAccountSchema` | Account creation |
| `createTransactionSchema` | Transaction creation (min amount 1) |
| `createLoanSchema` | Loan application (min 10,000) |
| `createExpenseSchema` | Expense entry |
| `createWelfareSchema` | Welfare program creation |
| `pledgeSchema` | Welfare pledge (min 1,000) |

### Utility Schemas

| Schema | Purpose |
|--------|---------|
| `paginationSchema` | Query params (page, limit, search, sort) |
| `changePasswordSchema` | Password change with match validation |
| `updateProfileSchema` | Self-service profile update |
| `updateUserSchema` | Admin user management |
| `calculateInterestSchema` | Interest calculation params |
| `updateAccountStatusSchema` | Account status change |
| `createBankAccountSchema` | Bank account creation |
| `updateSettingSchema` | System setting update |

## Constants (`constants.ts`)

| Constant | Value | Usage |
|----------|-------|-------|
| `CURRENCY` | `"USh"` | Display currency symbol |
| `CURRENCY_CODE` | `"UGX"` | ISO currency code |
| `DEFAULT_COUNTRY` | `"UG"` | Default country code |
| `ACCOUNT_TYPES` | `["savings", "current", "fixed_deposit"]` | Account type options |
| `LOAN_TYPES` | `["business", "personal", "emergency", "education", "housing"]` | Loan type options |
| `TRANSACTION_METHODS` | `["cash", "mobile_money", "bank_transfer", "cheque", "internal"]` | Payment methods |
| `EXPENSE_CATEGORIES` | 10 categories | Expense categorization |
| `INTEREST_RATES` | `{ savings: 12, current: 5, fixed_deposit: 15 }` | Default rates |
| `PAGINATION` | `{ DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100 }` | Pagination defaults |
| `PASSWORD` | `{ MIN_LENGTH: 8, SALT_ROUNDS: 12 }` | Security config |
| `TOKEN` | `{ ACCESS_EXPIRY: "15m", REFRESH_EXPIRY: "7d" }` | JWT expiry times |
