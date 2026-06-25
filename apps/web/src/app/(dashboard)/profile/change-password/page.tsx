"use client";

import { useState } from "react";
import { Lock, Save, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/schemas";
import { useChangePassword } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function ChangePasswordPage() {
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const [showPassword, setShowPassword] = useState(false);
  // useWatch (not watch()) so the React Compiler can memoize this component.
  const newPassword = useWatch({ control, name: "newPassword" }) || "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) || "";
  const longEnough = newPassword.length >= 8;
  const matches = confirmPassword.length > 0 && newPassword === confirmPassword;

  async function onSubmit(data: ChangePasswordInput) {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated successfully!");
      reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
          <Lock className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h1>
          <p className="text-text-muted text-sm">Update your account password</p>
        </div>
      </div>

      <div className="max-w-lg">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-text mb-2">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              {...register("currentPassword")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.currentPassword && <p className="text-xs text-danger mt-1">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                {...register("newPassword")}
                className="w-full px-4 py-2.5 pr-11 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-danger mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Confirm New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              {...register("confirmPassword")}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <ul className="space-y-1" aria-live="polite">
            <li className={cn("flex items-center gap-1.5 text-xs", longEnough ? "text-success" : "text-text-muted")}>
              <Check className={cn("w-3.5 h-3.5", longEnough ? "opacity-100" : "opacity-30")} /> At least 8 characters
            </li>
            <li className={cn("flex items-center gap-1.5 text-xs", matches ? "text-success" : "text-text-muted")}>
              <Check className={cn("w-3.5 h-3.5", matches ? "opacity-100" : "opacity-30")} /> Passwords match
            </li>
          </ul>
          <button
            type="submit"
            disabled={isSubmitting || changePassword.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSubmitting || changePassword.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
