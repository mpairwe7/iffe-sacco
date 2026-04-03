export const CURRENCY = "USh";
export const CURRENCY_CODE = "UGX";
export const DEFAULT_COUNTRY = "UG";
export const DEFAULT_LANGUAGE = "en";

export const ACCOUNT_TYPES = ["savings", "current", "fixed_deposit"] as const;
export const LOAN_TYPES = ["business", "personal", "emergency", "education", "housing"] as const;
export const TRANSACTION_METHODS = ["cash", "mobile_money", "bank_transfer", "cheque", "internal"] as const;

export const EXPENSE_CATEGORIES = [
  "Salaries", "Rent", "Utilities", "Marketing", "Operations",
  "Technical Issues", "Training", "Transport", "Other",
] as const;

export const INTEREST_RATES = {
  savings: 12,
  current: 5,
  fixed_deposit: 15,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const PASSWORD = {
  MIN_LENGTH: 8,
  SALT_ROUNDS: 12,
} as const;

export const TOKEN = {
  ACCESS_EXPIRY: "15m",
  REFRESH_EXPIRY: "7d",
} as const;

export const WELFARE_STATUS = ["active", "completed", "paused"] as const;
export const PLEDGE_STATUS = ["pledged", "paid", "cancelled"] as const;
export const BANK_ACCOUNT_STATUS = ["active", "inactive"] as const;
export const ACCOUNT_STATUS = ["active", "dormant", "frozen", "closed"] as const;
export const MEMBER_STATUS = ["active", "pending", "inactive", "suspended"] as const;
export const ROLES = ["admin", "chairman", "member", "staff"] as const;
export const APPLICATION_STATUS = ["pending", "approved", "rejected"] as const;
export const SEX_OPTIONS = ["male", "female"] as const;

// ===== Derived types from constants =====
export type LoanType = typeof LOAN_TYPES[number];
// AccountType already exported from types.ts
export type TransactionMethod = typeof TRANSACTION_METHODS[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type WelfareStatus = typeof WELFARE_STATUS[number];
export type PledgeStatusType = typeof PLEDGE_STATUS[number];
