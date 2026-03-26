import { z } from "zod/v4";

// ===== Auth =====
export const loginSchema = z.object({
  email: z.email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "chairman", "member", "staff"]).default("member"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ===== Member =====
export const createMemberSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  email: z.email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  country: z.string().default("UG"),
  accountType: z.enum(["savings", "current", "fixed_deposit"]).default("savings"),
  initialDeposit: z.number().min(0).default(0),
});

export const updateMemberSchema = createMemberSchema.partial();

// ===== Account =====
export const createAccountSchema = z.object({
  memberId: z.string().uuid(),
  type: z.enum(["savings", "current", "fixed_deposit"]),
  interestRate: z.number().min(0).max(100).default(12),
});

// ===== Transaction =====
export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(["deposit", "withdrawal", "transfer", "loan_repayment", "loan_disbursement", "interest_credit", "fee"]),
  amount: z.number().min(1, "Amount must be positive"),
  method: z.string().default("cash"),
  description: z.string().optional(),
  reference: z.string().optional(),
});

// ===== Loan =====
export const createLoanSchema = z.object({
  memberId: z.string().uuid(),
  type: z.string().min(1, "Loan type required"),
  amount: z.number().min(10000, "Minimum loan amount is 10,000"),
  interestRate: z.number().min(0).max(100),
  term: z.number().min(1, "Loan term required (months)"),
});

export const approveLoanSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comment: z.string().optional(),
});

// ===== Expense =====
export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description required"),
  category: z.string().min(1, "Category required"),
  amount: z.number().min(1, "Amount must be positive"),
  date: z.string(),
});

// ===== Welfare =====
export const createWelfareSchema = z.object({
  name: z.string().min(1, "Program name required"),
  description: z.string().min(1, "Description required"),
  targetAmount: z.number().min(1, "Target amount required"),
});

export const pledgeSchema = z.object({
  programId: z.string().uuid(),
  amount: z.number().min(1000, "Minimum pledge is 1,000"),
});

// ===== Password =====
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// ===== Pagination =====
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ===== Expense update =====
export const updateExpenseSchema = createExpenseSchema.partial();

// ===== Welfare update =====
export const updateWelfareSchema = createWelfareSchema.partial();

// ===== Bank Account =====
export const createBankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name required"),
  accountName: z.string().min(1, "Account name required"),
  accountNo: z.string().min(1, "Account number required"),
  branch: z.string().optional(),
  balance: z.number().min(0).default(0),
});

export const updateBankAccountSchema = createBankAccountSchema.partial();

// ===== User management =====
export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "chairman", "member", "staff"]).optional(),
  isActive: z.boolean().optional(),
});

// ===== Profile update (self) =====
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required").optional(),
});

// ===== Setting =====
export const updateSettingSchema = z.object({
  value: z.string().min(1, "Value required"),
});

// ===== Interest calculation =====
export const calculateInterestSchema = z.object({
  accountType: z.enum(["savings", "current", "fixed_deposit"]),
  startDate: z.string(),
  endDate: z.string(),
  postingDate: z.string().optional(),
});

// ===== Account status update =====
export const updateAccountStatusSchema = z.object({
  status: z.enum(["active", "dormant", "frozen", "closed"]),
});

// ===== Deposit Request =====
export const createDepositRequestSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().min(1000, "Minimum deposit is 1,000"),
  method: z.string().default("cash"),
  description: z.string().optional(),
});

// ===== Withdraw Request =====
export const createWithdrawRequestSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().min(1000, "Minimum withdrawal is 1,000"),
  method: z.string().default("cash"),
  reason: z.string().optional(),
});

// ===== Payment Gateway =====
export const createPaymentGatewaySchema = z.object({
  name: z.string().min(1, "Name required"),
  type: z.enum(["mobile_money", "bank", "card", "online"]),
  currency: z.string().default("UGX"),
  fee: z.string().default("0%"),
  isActive: z.boolean().default(false),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updatePaymentGatewaySchema = createPaymentGatewaySchema.partial();

// ===== Application (Membership) =====
const placeSchema = z.object({
  district: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  parish: z.string().optional(),
  village: z.string().optional(),
});

const parentInfoSchema = z.object({
  name: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  alive: z.boolean().optional(),
  diedBeforeOrAfterJoining: z.string().optional(),
});

const spouseSchema = z.object({
  name: z.string().optional(),
  fatherName: z.string().optional(),
  fatherAlive: z.boolean().optional(),
  motherName: z.string().optional(),
  motherAlive: z.boolean().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
});

const childSchema = z.object({
  name: z.string().optional(),
  sex: z.string().optional(),
  contact: z.string().optional(),
});

const relativeSchema = z.object({
  fullName: z.string().optional(),
  relationship: z.string().optional(),
  location: z.string().optional(),
  contact: z.string().optional(),
});

export const createApplicationSchema = z.object({
  // General info
  fullName: z.string().min(2, "Full name required"),
  dateOfBirth: z.string().optional(),
  sex: z.enum(["male", "female"]).optional(),
  phone: z.string().min(10, "Valid phone required"),
  email: z.email("Valid email required").optional(),
  clan: z.string().optional(),
  totem: z.string().optional(),

  // Places
  birthPlace: placeSchema.optional(),
  ancestralPlace: placeSchema.optional(),
  residencePlace: placeSchema.optional(),

  // Work
  occupation: z.string().optional(),
  placeOfWork: z.string().optional(),
  qualifications: z.string().optional(),

  // Family
  fatherInfo: parentInfoSchema.optional(),
  motherInfo: parentInfoSchema.optional(),
  spouses: z.array(spouseSchema).optional(),
  children: z.array(childSchema).optional(),
  otherRelatives: z.array(relativeSchema).optional(),

  // Document
  applicationLetterUrl: z.string().optional(),
  applicationLetterName: z.string().optional(),

  // Account credentials
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const reviewApplicationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

// ===== Export types =====
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateWelfareInput = z.infer<typeof createWelfareSchema>;
export type PledgeInput = z.infer<typeof pledgeSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type UpdateWelfareInput = z.infer<typeof updateWelfareSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CalculateInterestInput = z.infer<typeof calculateInterestSchema>;
export type CreateDepositRequestInput = z.infer<typeof createDepositRequestSchema>;
export type CreateWithdrawRequestInput = z.infer<typeof createWithdrawRequestSchema>;
export type CreatePaymentGatewayInput = z.infer<typeof createPaymentGatewaySchema>;
export type UpdatePaymentGatewayInput = z.infer<typeof updatePaymentGatewaySchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;
