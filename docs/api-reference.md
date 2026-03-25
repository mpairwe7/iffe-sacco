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

## Authentication

### POST `/auth/register`
Create a new user account.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+256700000000",
  "password": "securepass123",
  "role": "member"           // "admin" | "member" | "staff"
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com", "role": "member" },
    "tokens": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
  }
}
```

### POST `/auth/login`
**Body:**
```json
{ "email": "admin@iffeds.org", "password": "password123" }
```

**Response** `200`: Same as register response with tokens.

### POST `/auth/refresh`
**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response** `200`:
```json
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ..." } }
```

### GET `/auth/me`
**Headers:** `Authorization: Bearer <accessToken>`

**Response** `200`: Current user profile.

---

## Members

> All member endpoints require `Authorization: Bearer <token>`

### GET `/members`
List members with pagination, search, and sorting.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `search` | string | - | Search by name, email, memberId |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | string | desc | "asc" or "desc" |

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "data": [{ "id": "uuid", "memberId": "IFFE-001", "firstName": "John", ... }],
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### GET `/members/stats`
**Response** `200`:
```json
{ "success": true, "data": { "active": 10, "pending": 2, "inactive": 1, "total": 13 } }
```

### GET `/members/:id`
Get member by ID with related accounts.

### POST `/members`
**Requires**: `admin` or `staff` role

**Body:**
```json
{
  "firstName": "New",
  "lastName": "Member",
  "email": "new@example.com",
  "phone": "+256700000000",
  "gender": "male",
  "nationalId": "CM123456",
  "occupation": "Engineer",
  "address": "Plot 5, Main Street",
  "city": "Kampala",
  "district": "Central",
  "country": "UG",
  "accountType": "savings",
  "initialDeposit": 100000
}
```

### PUT `/members/:id`
**Requires**: `admin` or `staff` role. Partial updates allowed.

### DELETE `/members/:id`
**Requires**: `admin` role only.

---

## Transactions

### GET `/transactions`
**Query Parameters:** Same as members + `type` and `status` filters.

| Param | Values |
|-------|--------|
| `type` | deposit, withdrawal, transfer, loan_repayment, loan_disbursement, interest_credit, fee |
| `status` | pending, completed, rejected, reversed |

### GET `/transactions/stats`
**Response:**
```json
{ "success": true, "data": { "totalDeposits": 25000000, "totalWithdrawals": 8900000, "pending": 5 } }
```

### POST `/transactions`
**Requires**: `admin` or `staff` role

**Body:**
```json
{
  "accountId": "uuid",
  "type": "deposit",
  "amount": 500000,
  "method": "mobile_money",
  "description": "Monthly savings deposit"
}
```

### PATCH `/transactions/:id/approve`
**Requires**: `admin` role. Approves pending transaction and updates account balance.

### PATCH `/transactions/:id/reject`
**Requires**: `admin` role.

---

## Loans

### GET `/loans`
**Query Parameters:** Same pagination + `status` and `memberId` filters.

### GET `/loans/stats`
**Response:**
```json
{
  "success": true,
  "data": { "activeCount": 5, "activeAmount": 15750000, "overdue": 1, "totalDisbursed": 33500000 }
}
```

### POST `/loans`
**Requires**: `admin` or `staff` role

**Body:**
```json
{
  "memberId": "uuid",
  "type": "business",
  "amount": 5000000,
  "interestRate": 12,
  "term": 24
}
```

Monthly payment is auto-calculated using the amortization formula.

### PATCH `/loans/:id/approve`
**Requires**: `admin` role. Sets status to "active", records disbursement date, calculates next payment date.

### PATCH `/loans/:id/reject`
**Requires**: `admin` role.

---

## Dashboard

### GET `/dashboard/stats`
Aggregated statistics for the dashboard overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 12,
    "totalDeposits": 25000000,
    "totalWithdrawals": 8900000,
    "activeLoans": 5,
    "activeLoanAmount": 15750000,
    "totalExpenses": 7830000,
    "totalSavings": 23080000,
    "pendingRequests": 5
  }
}
```

### GET `/dashboard/recent-transactions?limit=10`
Latest transactions with member info.

### GET `/dashboard/upcoming-payments?days=7`
Loans with payment due in the next N days.

---

## Health Check

### GET `/health`
**No auth required.**

```json
{ "status": "ok", "timestamp": "2026-03-26T00:00:00Z", "version": "1.0.0", "environment": "development" }
```

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 422 | Validation error (Zod) |
| 500 | Internal server error |
