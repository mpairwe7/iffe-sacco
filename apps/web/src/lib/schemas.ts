import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.email("Please enter a valid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    terms: z.literal(true, "You must accept the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const resetPasswordRequestSchema = z.object({
  email: z.email("Please enter a valid email address"),
});
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

export const resetPasswordConfirmSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;

const memberBaseSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationalId: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  shareCount: z.coerce.number().int().min(0, "Shares cannot be negative").default(0),
  weddingSupportStatus: z.enum(["received", "requested", "not_received"]).default("not_received"),
  weddingSupportDebt: z.coerce.number().min(0, "Debt cannot be negative").default(0),
  condolenceSupportStatus: z.enum(["received", "requested", "not_received"]).default("not_received"),
  condolenceSupportDebt: z.coerce.number().min(0, "Debt cannot be negative").default(0),
  remarks: z.string().optional(),
  country: z.string().default("UG"),
  initialDeposit: z.number().min(0).optional(),
});

export const memberCreateSchema = memberBaseSchema.extend({
  accountType: z.enum(["savings", "current", "fixed_deposit"], {
    message: "Please select an account type",
  }),
});
export type MemberCreateInput = z.infer<typeof memberCreateSchema>;

export const memberUpdateSchema = memberBaseSchema.extend({
  accountType: z.enum(["savings", "current", "fixed_deposit"]).optional(),
});
export type MemberUpdateFormInput = z.infer<typeof memberUpdateSchema>;

export const transactionSchema = z.object({
  type: z.enum(["deposit", "withdraw", "transfer", "loan_repayment"]),
  member: z.string().min(1, "Please select a member"),
  account: z.string().min(1, "Please select an account"),
  amount: z.number().min(1000, "Minimum amount is UGX 1,000"),
  method: z.string().default("cash"),
  date: z.string().optional(),
  description: z.string().optional(),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
