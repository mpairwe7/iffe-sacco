import { z } from "zod/v4";
import { LOAN_TYPES } from "./constants";

// ===== Money =====
// Money is sent over the wire as a decimal string (never a JS number) so that
// float rounding can't silently corrupt amounts. This regex accepts up to
// 14 integer digits and 4 fractional digits (matches Prisma Decimal(18, 4)).
export const moneyString = z
  .string()
  .regex(/^-?\d{1,14}(\.\d{1,4})?$/, "Amount must be a decimal string with at most 4 decimal places")
  .refine((s) => s !== "-0" && s !== "-", "Invalid amount");

export const positiveMoneyString = moneyString.refine(
  (s) => !s.startsWith("-") && s !== "0" && s !== "0.0" && s !== "0.00",
  "Amount must be positive",
);

// ===== Auth =====
export const loginSchema = z.object({
  email: z.email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "chairman", "member", "staff"]).default("member"),
});

export const requestPasswordResetSchema = z.object({
  email: z.email("Valid email required"),
});

export const confirmPasswordResetSchema = z.object({
  token: z.string().min(1, "Reset token required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// ===== Member =====
//
// Defined as an object schema first (reusable for .partial()) and then
// refined with a business rule: a member whose wedding/condolence support
// status is "not_received" cannot have a non-zero debt balance — if they
// never received the support, they can't owe anything for it. The
// refinement is applied to both create and update so the rule is
// uniformly enforced.
const memberInputObject = z.object({
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
  shareCount: z.coerce.number().int().min(0).default(0),
  weddingSupportStatus: z.enum(["received", "requested", "not_received"]).default("not_received"),
  weddingSupportDebt: z.coerce.number().min(0).default(0),
  weddingEventDate: z.string().optional().nullable(),
  condolenceSupportStatus: z.enum(["received", "requested", "not_received"]).default("not_received"),
  condolenceSupportDebt: z.coerce.number().min(0).default(0),
  condolenceEventDate: z.string().optional().nullable(),
  remarks: z.string().trim().max(2000).optional(),
  country: z.string().default("UG"),
  accountType: z.enum(["savings", "current", "fixed_deposit"]).default("savings"),
  initialDeposit: z.number().min(0).default(0),
});

function enforceWelfareDebtRule<
  T extends {
    weddingSupportStatus?: "received" | "requested" | "not_received";
    weddingSupportDebt?: number;
    condolenceSupportStatus?: "received" | "requested" | "not_received";
    condolenceSupportDebt?: number;
  },
>(schema: z.ZodType<T>) {
  return schema
    .refine(
      (data) =>
        data.weddingSupportStatus !== "not_received" || !data.weddingSupportDebt || data.weddingSupportDebt === 0,
      {
        message: "Wedding support debt must be 0 when status is 'not_received'",
        path: ["weddingSupportDebt"],
      },
    )
    .refine(
      (data) =>
        data.condolenceSupportStatus !== "not_received" ||
        !data.condolenceSupportDebt ||
        data.condolenceSupportDebt === 0,
      {
        message: "Condolence support debt must be 0 when status is 'not_received'",
        path: ["condolenceSupportDebt"],
      },
    );
}

export const createMemberSchema = enforceWelfareDebtRule(memberInputObject);
export const updateMemberSchema = enforceWelfareDebtRule(memberInputObject.partial());

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
  type: z.enum(LOAN_TYPES, { message: "Loan type required" }),
  amount: z.number().min(10000, "Minimum loan amount is 10,000"),
  interestRate: z.number().min(0).max(100),
  term: z.number().min(1, "Loan term required (months)"),
});

export const memberLoanApplicationSchema = createLoanSchema.omit({
  memberId: true,
  interestRate: true,
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
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "chairman", "staff"]),
});

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
  amount: z.number().min(5000, "Minimum withdrawal is 5,000").max(5000000, "Maximum daily withdrawal is 5,000,000"),
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
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type MemberLoanApplicationInput = z.infer<typeof memberLoanApplicationSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateWelfareInput = z.infer<typeof createWelfareSchema>;
export type PledgeInput = z.infer<typeof pledgeSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type UpdateWelfareInput = z.infer<typeof updateWelfareSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CalculateInterestInput = z.infer<typeof calculateInterestSchema>;
export type CreateDepositRequestInput = z.infer<typeof createDepositRequestSchema>;
export type CreateWithdrawRequestInput = z.infer<typeof createWithdrawRequestSchema>;
export type CreatePaymentGatewayInput = z.infer<typeof createPaymentGatewaySchema>;
export type UpdatePaymentGatewayInput = z.infer<typeof updatePaymentGatewaySchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;
