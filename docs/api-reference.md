# API Reference

**Base URL**: `http://localhost:4000/api/v1`

All responses follow the format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { "field": ["Validation error"] }  // 422 only
}
```

---

## Health Check

### GET `/health`
No auth required.

```json
{ "status": "ok", "timestamp": "2026-03-26T00:00:00Z", "version": "1.0.0", "environment": "development" }
```

---

## Authentication (6 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create user account |
| POST | `/auth/login` | No | Login, returns JWT tokens |
| POST | `/auth/refresh` | No | Refresh expired access token |
| POST | `/auth/reset-password` | No | Request password reset email |
| GET | `/auth/me` | Yes | Get current user profile |
| PATCH | `/auth/change-password` | Yes | Change password (requires current) |
| PUT | `/auth/profile` | Yes | Update own profile |

### POST `/auth/login`
```json
{ "email": "admin@iffeds.org", "password": "password123" }
```
**Response** `200`:
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Admin User", "email": "admin@iffeds.org", "role": "admin" },
    "tokens": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
  }
}
```

### POST `/auth/register`
```json
{ "name": "New User", "email": "new@example.com", "phone": "+256700000000", "password": "securepass", "role": "member" }
```

### PATCH `/auth/change-password`
```json
{ "currentPassword": "oldpass", "newPassword": "newpass123" }
```

---

## Members (6 endpoints)

All require `Authorization: Bearer <token>`

| Method | Path | Role Required | Description |
|--------|------|--------------|-------------|
| GET | `/members` | Any | List members (paginated, searchable, sortable) |
| GET | `/members/stats` | Any | Member count by status |
| GET | `/members/:id` | Any | Get member with accounts |
| POST | `/members` | admin, staff | Create member + auto-create account |
| PUT | `/members/:id` | admin, staff | Update member (partial) |
| DELETE | `/members/:id` | admin | Delete member (cascades) |

### Query Parameters (GET `/members`)
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `search` | string | — | Search name, email, memberId |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | string | desc | asc or desc |

---

## Accounts (5 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/accounts` | Any | List accounts (filterable by memberId, status, type) |
| GET | `/accounts/stats` | Any | Aggregate account statistics |
| GET | `/accounts/:id` | Any | Get account details |
| POST | `/accounts` | admin, staff | Create new account for member |
| PATCH | `/accounts/:id/status` | admin | Change account status (active/dormant/frozen/closed) |

---

## Transactions (7 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/transactions` | Any | List (filterable by type, status, accountId) |
| GET | `/transactions/stats` | Any | Total deposits, withdrawals, pending count |
| GET | `/transactions/:id` | Any | Get transaction with account + member |
| POST | `/transactions` | admin, staff | Create transaction (validates balance for withdrawals) |
| PATCH | `/transactions/:id/approve` | admin | Approve pending → updates account balance |
| PATCH | `/transactions/:id/reject` | admin | Reject pending transaction |
| PATCH | `/transactions/:id/reverse` | admin | Reverse completed → reverses balance change |

### Business Logic
- **Deposits**: Increment account balance on approval
- **Withdrawals**: Validates sufficient balance before creation; decrements on approval
- **Reversals**: Only completed transactions can be reversed; balance change is undone

---

## Loans (7 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/loans` | Any | List (filterable by status, memberId) |
| GET | `/loans/stats` | Any | Active count, outstanding amount, overdue, total disbursed |
| GET | `/loans/:id` | Any | Get loan with member |
| POST | `/loans` | admin, staff | Create loan application (auto-calculates monthly payment) |
| PATCH | `/loans/:id/approve` | admin | Approve → sets active, records disbursement date, calculates next payment |
| PATCH | `/loans/:id/reject` | admin | Reject pending loan |
| PATCH | `/loans/:id/repay` | admin, staff | Record repayment (validates amount <= balance, auto-marks as paid if zero) |

### Repayment Body
```json
{ "amount": 250000 }
```

### Monthly Payment Calculation
Uses standard amortization formula:
```
M = P × [r(1+r)^n] / [(1+r)^n - 1]
```
Where P = principal, r = monthly rate, n = term in months.

---

## Expenses (8 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/expenses` | Any | List (filterable by category, status) |
| GET | `/expenses/stats` | Any | Total by category, pending count |
| GET | `/expenses/:id` | Any | Get expense |
| POST | `/expenses` | admin, staff | Create expense |
| PUT | `/expenses/:id` | admin, staff | Update expense |
| PATCH | `/expenses/:id/approve` | admin | Approve expense |
| PATCH | `/expenses/:id/reject` | admin | Reject expense |
| DELETE | `/expenses/:id` | admin | Delete expense |

---

## Deposit Requests (4 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/deposit-requests` | Any | List (members see only their own) |
| POST | `/deposit-requests` | Any | Submit deposit request |
| PATCH | `/deposit-requests/:id/approve` | admin, staff | Approve → creates transaction + updates balance |
| PATCH | `/deposit-requests/:id/reject` | admin, staff | Reject request |

---

## Withdraw Requests (4 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/withdraw-requests` | Any | List (members see only their own) |
| POST | `/withdraw-requests` | Any | Submit withdrawal request (validates balance) |
| PATCH | `/withdraw-requests/:id/approve` | admin, staff | Approve → creates transaction + decrements balance |
| PATCH | `/withdraw-requests/:id/reject` | admin, staff | Reject request |

---

## Welfare Programs (9 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/welfare` | Any | List programs (paginated) |
| GET | `/welfare/stats` | Any | Aggregate welfare stats |
| GET | `/welfare/:id` | Any | Get program details |
| POST | `/welfare` | admin | Create program |
| PUT | `/welfare/:id` | admin | Update program |
| PATCH | `/welfare/:id/status` | admin | Change program status |
| GET | `/welfare/:id/pledges` | Any | List pledges for a program |
| POST | `/welfare/pledges` | Any | Make a pledge |
| GET | `/welfare/pledges/mine` | Any | Get current user's pledges |

---

## Dashboard (3 endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/stats` | Aggregated KPIs: members, deposits, withdrawals, loans, expenses, savings |
| GET | `/dashboard/recent-transactions?limit=10` | Latest transactions with member info |
| GET | `/dashboard/upcoming-payments?days=7` | Loans with payment due within N days |

---

## Bank Accounts (6 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/bank-accounts` | Any | List bank accounts |
| GET | `/bank-accounts/stats` | Any | Total balance, count |
| GET | `/bank-accounts/:id` | Any | Get bank account |
| POST | `/bank-accounts` | admin | Create bank account |
| PUT | `/bank-accounts/:id` | admin | Update bank account |
| DELETE | `/bank-accounts/:id` | admin | Delete bank account |

---

## Users (5 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/users` | admin | List users (paginated) |
| GET | `/users/:id` | admin | Get user |
| PUT | `/users/:id` | admin | Update user |
| PATCH | `/users/:id/activate` | admin | Activate user |
| PATCH | `/users/:id/deactivate` | admin | Deactivate user |

---

## Settings (4 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/settings` | admin | List all settings |
| GET | `/settings/:key` | admin | Get setting by key |
| PUT | `/settings/:key` | admin | Update setting value |
| DELETE | `/settings/:key` | admin | Delete setting |

---

## Interest Calculation (2 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/interest/preview` | admin | Preview interest calculation (dry run) |
| POST | `/interest/calculate` | admin | Calculate and post interest to accounts |

### Body
```json
{ "accountType": "savings", "startDate": "2026-01-01", "endDate": "2026-03-26" }
```

---

## Reports (2 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/reports` | admin | List available report types |
| POST | `/reports/generate` | admin | Generate report (returns JSON data) |

### Body
```json
{ "type": "transactions", "dateFrom": "2026-01-01", "dateTo": "2026-03-26", "memberId": "optional-uuid" }
```

---

## Payment Gateways (5 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/payment-gateways` | Any | List all gateways |
| GET | `/payment-gateways/:id` | Any | Get gateway |
| POST | `/payment-gateways` | admin | Create gateway |
| PUT | `/payment-gateways/:id` | admin | Update gateway |
| PATCH | `/payment-gateways/:id/toggle` | admin | Toggle active/inactive |

---

## Audit Logs (2 endpoints)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/audit-logs` | admin | List logs (filterable by userId, entity, action) |
| GET | `/audit-logs/:id` | admin | Get single log |

---

## Total Endpoint Count: **75+**

| Category | Endpoints |
|----------|-----------|
| Health | 1 |
| Auth | 7 |
| Members | 6 |
| Accounts | 5 |
| Transactions | 7 |
| Loans | 7 |
| Expenses | 8 |
| Deposit Requests | 4 |
| Withdraw Requests | 4 |
| Welfare | 9 |
| Dashboard | 3 |
| Bank Accounts | 6 |
| Users | 5 |
| Settings | 4 |
| Interest | 2 |
| Reports | 2 |
| Payment Gateways | 5 |
| Audit Logs | 2 |
| **Total** | **87** |

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (business logic violation) |
| 401 | Unauthorized (missing/invalid/expired token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 422 | Validation error (Zod schema) |
| 500 | Internal server error |
