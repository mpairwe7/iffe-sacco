"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { useLogin } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { SecurityBadge } from "@/components/ui/security-badge";
import { useRouter } from "next/navigation";
import { getDefaultRouteForRole } from "@/lib/role-routes";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const login = useLogin();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    try {
      const result = await login.mutateAsync({ email: data.email, password: data.password, remember: data.remember ?? false });
      setAuth(result.user);
      toast.success("Welcome back!");
      router.push(getDefaultRouteForRole(result.user.role));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
    }
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      <div className="glass-card rounded-xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-text text-center">Welcome Back</h2>
        <p className="text-text-muted text-center mt-2 mb-8">Sign in to your account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full pl-12 pr-4 py-3.5 bg-white/60 dark:bg-white/5 border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white/80 dark:focus:bg-white/10 ${errors.email ? "border-danger" : "border-white/40 dark:border-white/10"}`}
              />
            </div>
            {errors.email && <p id="email-error" className="text-xs text-danger mt-1.5" role="alert">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`w-full pl-12 pr-12 py-3.5 bg-white/60 dark:bg-white/5 border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white/80 dark:focus:bg-white/10 ${errors.password ? "border-danger" : "border-white/40 dark:border-white/10"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
            {errors.password && <p id="password-error" className="text-xs text-danger mt-1.5" role="alert">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("remember")} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
              <span className="text-sm text-text-muted">Remember me</span>
            </label>
            <Link href="/password/reset" className="text-sm font-medium text-primary hover:text-primary-dark">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {login.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
            ) : (
              <>Sign In <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:text-primary-dark">Create Account</Link>
        </p>
      </div>
      <SecurityBadge />
    </div>
  );
}
