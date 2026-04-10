/**
 * Chart of accounts for IFFE SACCO.
 *
 * These codes are stable identifiers — do not renumber. Accounting reports
 * (trial balance, balance sheet, income statement) group by the `type`
 * field, not by code prefix.
 *
 * Naming convention: TYPE-AREA-DETAIL
 *   1xxx = Assets
 *   2xxx = Liabilities
 *   3xxx = Equity
 *   4xxx = Income / Revenue
 *   5xxx = Expenses
 */

export type GlAccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export interface GlAccountDef {
  code: string;
  name: string;
  type: GlAccountType;
  /** Normal balance side: ASSET/EXPENSE = debit; LIABILITY/EQUITY/INCOME = credit. */
  normal: "DEBIT" | "CREDIT";
}

const A = (code: string, name: string, type: GlAccountType, normal: "DEBIT" | "CREDIT"): GlAccountDef => ({
  code,
  name,
  type,
  normal,
});

export const GL_ACCOUNTS = {
  // ASSETS
  CASH_ON_HAND: A("1000", "Cash on hand", "ASSET", "DEBIT"),
  CASH_AT_BANK: A("1010", "Cash at bank", "ASSET", "DEBIT"),
  MOBILE_MONEY: A("1020", "Mobile money float", "ASSET", "DEBIT"),
  LOANS_RECEIVABLE: A("1200", "Loans receivable", "ASSET", "DEBIT"),
  INTEREST_RECEIVABLE: A("1210", "Interest receivable (loans)", "ASSET", "DEBIT"),
  LATE_FEES_RECEIVABLE: A("1220", "Late fees receivable", "ASSET", "DEBIT"),

  // LIABILITIES — member deposits are liabilities of the SACCO to its members
  MEMBER_SAVINGS: A("2100", "Member savings deposits", "LIABILITY", "CREDIT"),
  MEMBER_CURRENT: A("2110", "Member current deposits", "LIABILITY", "CREDIT"),
  MEMBER_FIXED_DEPOSIT: A("2120", "Member fixed deposits", "LIABILITY", "CREDIT"),
  WELFARE_FUND_LIABILITY: A("2200", "Welfare fund obligations", "LIABILITY", "CREDIT"),
  INTEREST_PAYABLE: A("2210", "Interest payable on deposits", "LIABILITY", "CREDIT"),
  SUSPENSE: A("2900", "Suspense (unreconciled)", "LIABILITY", "CREDIT"),

  // EQUITY
  SHARE_CAPITAL: A("3000", "Share capital (members)", "EQUITY", "CREDIT"),
  RETAINED_EARNINGS: A("3100", "Retained earnings", "EQUITY", "CREDIT"),
  OPENING_BALANCE_EQUITY: A("3200", "Opening balance equity (pre-ledger)", "EQUITY", "CREDIT"),

  // INCOME
  INTEREST_INCOME_LOANS: A("4000", "Interest income — loans", "INCOME", "CREDIT"),
  FEE_INCOME: A("4100", "Fee income", "INCOME", "CREDIT"),
  PENALTY_INCOME: A("4110", "Late payment penalties", "INCOME", "CREDIT"),
  PLEDGE_INCOME: A("4200", "Welfare pledge receipts", "INCOME", "CREDIT"),

  // EXPENSES
  INTEREST_EXPENSE_DEPOSITS: A("5000", "Interest expense — member deposits", "EXPENSE", "DEBIT"),
  WELFARE_DISBURSEMENT: A("5100", "Welfare fund disbursements", "EXPENSE", "DEBIT"),
  OPERATING_EXPENSE: A("5200", "Operating expenses", "EXPENSE", "DEBIT"),
  BAD_DEBT_EXPENSE: A("5300", "Bad debt write-off", "EXPENSE", "DEBIT"),
} as const satisfies Record<string, GlAccountDef>;

export type GlAccountKey = keyof typeof GL_ACCOUNTS;

export const GL_ACCOUNT_LIST: GlAccountDef[] = Object.values(GL_ACCOUNTS);

/** Map an Account.type to the correct member-liability GL account. */
export function memberLiabilityAccountFor(accountType: string): GlAccountDef {
  switch (accountType) {
    case "savings":
      return GL_ACCOUNTS.MEMBER_SAVINGS;
    case "current":
      return GL_ACCOUNTS.MEMBER_CURRENT;
    case "fixed_deposit":
      return GL_ACCOUNTS.MEMBER_FIXED_DEPOSIT;
    default:
      return GL_ACCOUNTS.SUSPENSE;
  }
}
