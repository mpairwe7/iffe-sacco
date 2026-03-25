// ===== User & Auth =====
export type Role = "admin" | "member" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  avatar?: string | null;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// ===== Member =====
export interface Member {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  nationalId?: string | null;
  occupation?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  country: string;
  status: "active" | "pending" | "inactive" | "suspended";
  joinDate: string;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===== Account =====
export type AccountType = "savings" | "current" | "fixed_deposit";
export type AccountStatus = "active" | "dormant" | "frozen" | "closed";

export interface Account {
  id: string;
  accountNo: string;
  memberId: string;
  type: AccountType;
  balance: number;
  interestRate: number;
  status: AccountStatus;
  lastActivity?: string | null;
  createdAt: string;
  member?: Member;
}

// ===== Transaction =====
export type TransactionType = "deposit" | "withdrawal" | "transfer" | "loan_repayment" | "loan_disbursement" | "interest_credit" | "fee";
export type TransactionStatus = "pending" | "completed" | "rejected" | "reversed";

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
  method: string;
  reference?: string | null;
  status: TransactionStatus;
  processedBy?: string | null;
  createdAt: string;
  account?: Account;
}

// ===== Loan =====
export type LoanStatus = "pending" | "approved" | "active" | "paid" | "overdue" | "defaulted" | "rejected";

export interface Loan {
  id: string;
  memberId: string;
  type: string;
  amount: number;
  balance: number;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  nextPaymentDate?: string | null;
  status: LoanStatus;
  approvedBy?: string | null;
  disbursedAt?: string | null;
  createdAt: string;
  member?: Member;
}

// ===== Expense =====
export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  approvedBy?: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// ===== Welfare =====
export interface WelfareProgram {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  contributorCount: number;
  status: "active" | "completed" | "paused";
  createdAt: string;
}

// ===== Report / Dashboard =====
export interface DashboardStats {
  totalMembers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeLoans: number;
  activeLoanAmount: number;
  totalExpenses: number;
  totalSavings: number;
  pendingRequests: number;
}

// ===== Pagination =====
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== Bank Account =====
export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  branch?: string | null;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Setting =====
export interface Setting {
  id: string;
  key: string;
  value: string;
}

// ===== Pledge =====
export interface Pledge {
  id: string;
  programId: string;
  memberId: string;
  amount: number;
  status: "pledged" | "paid" | "cancelled";
  createdAt: string;
  program?: WelfareProgram;
}

// ===== Audit Log =====
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: { name: string; email: string };
}

// ===== Deposit Request =====
export interface DepositRequest {
  id: string;
  memberId: string;
  accountId: string;
  amount: number;
  method: string;
  description?: string | null;
  status: "pending" | "approved" | "rejected";
  processedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===== Withdraw Request =====
export interface WithdrawRequest {
  id: string;
  memberId: string;
  accountId: string;
  amount: number;
  method: string;
  reason?: string | null;
  status: "pending" | "approved" | "rejected";
  processedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===== Payment Gateway =====
export interface PaymentGateway {
  id: string;
  name: string;
  type: string;
  currency: string;
  fee: string;
  isActive: boolean;
  config?: Record<string, unknown> | null;
}

// ===== API Response =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
