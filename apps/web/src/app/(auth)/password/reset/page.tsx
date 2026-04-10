"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import {
  resetPasswordConfirmSchema,
  resetPasswordRequestSchema,
  type ResetPasswordConfirmInput,
  type ResetPasswordRequestInput,
} from "@/lib/schemas";

function PasswordResetPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [debugResetUrl, setDebugResetUrl] = useState<string | null>(null);

  const requestForm = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
  });

  const confirmForm = useForm<ResetPasswordConfirmInput>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    defaultValues: {
      token: token || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onRequestReset(data: ResetPasswordRequestInput) {
    try {
      const result = await authApi.requestPasswordReset(data);
      setDebugResetUrl(result?.debugResetUrl || null);
      toast.success("If an account exists with this email, a reset link has been sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset link");
    }
  }

  async function onConfirmReset(data: ResetPasswordConfirmInput) {
    if (!token) {
      toast.error("Reset token is missing");
      return;
    }

    try {
      await authApi.confirmPasswordReset({ token, newPassword: data.newPassword });
      toast.success("Password reset successfully. Please sign in with your new password.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    }
  }

  if (token) {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = confirmForm;

    return (
      <div className="bg-white rounded-xl shadow-xl shadow-black/5 border border-border p-8">
        <h2 className="text-2xl font-bold text-text text-center">Choose a New Password</h2>
        <p className="text-text-muted text-center mt-2 mb-8">Set a new password for your IFFE SACCO account.</p>

        <form onSubmit={handleSubmit(onConfirmReset)} className="space-y-5">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-text mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <input
                id="newPassword"
                type="password"
                placeholder="Enter a new password"
                autoComplete="new-password"
                {...register("newPassword")}
                aria-invalid={!!errors.newPassword}
                className={`w-full pl-12 pr-4 py-3 bg-surface-alt border rounded-lg text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.newPassword ? "border-danger" : "border-border"}`}
              />
            </div>
            {errors.newPassword && (
              <p className="text-xs text-danger mt-1.5" role="alert">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
                className={`w-full pl-12 pr-4 py-3 bg-surface-alt border rounded-lg text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.confirmPassword ? "border-danger" : "border-border"}`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-danger mt-1.5" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Resetting...
              </>
            ) : (
              <>
                Reset Password <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </p>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = requestForm;

  return (
    <div className="bg-white rounded-xl shadow-xl shadow-black/5 border border-border p-8">
      <h2 className="text-2xl font-bold text-text text-center">Reset Password</h2>
      <p className="text-text-muted text-center mt-2 mb-8">Enter your email and we&apos;ll send you a reset link</p>

      <form onSubmit={handleSubmit(onRequestReset)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
            Email Address
          </label>
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
          {errors.email && (
            <p className="text-xs text-danger mt-1.5" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Sending...
            </>
          ) : (
            <>
              Send Reset Link <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {debugResetUrl && (
        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium text-text">Development reset link</p>
          <p className="text-xs text-text-muted mt-1 break-all">{debugResetUrl}</p>
          <Link
            href={debugResetUrl}
            className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:text-primary-dark"
          >
            Open reset link <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <p className="text-center mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </p>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-xl shadow-xl shadow-black/5 border border-border p-8">
          <div className="flex items-center justify-center gap-3 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading reset form...</span>
          </div>
        </div>
      }
    >
      <PasswordResetPageContent />
    </Suspense>
  );
}
