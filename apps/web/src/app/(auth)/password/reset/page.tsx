"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas";

export default function PasswordResetPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(_data: ResetPasswordInput) {
    // Simulate a small delay for UX
    await new Promise((r) => setTimeout(r, 800));
    toast.success("If an account exists with this email, a reset link has been sent.");
  }

  return (
    <div className="bg-white rounded-xl shadow-xl shadow-black/5 border border-border p-8">
      <h2 className="text-2xl font-bold text-text text-center">Reset Password</h2>
      <p className="text-text-muted text-center mt-2 mb-8">Enter your email and we&apos;ll send you a reset link</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
              className={`w-full pl-12 pr-4 py-3 bg-surface-alt border rounded-lg text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.email ? "border-danger" : "border-border"}`}
            />
          </div>
          {errors.email && <p className="text-xs text-danger mt-1.5" role="alert">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
          ) : (
            <>Send Reset Link <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </form>

      <p className="text-center mt-6">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </p>
    </div>
  );
}
