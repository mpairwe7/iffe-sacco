"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  User,
  Briefcase,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { useLogin } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { SecurityBadge } from "@/components/ui/security-badge";
import { useRouter } from "next/navigation";
import { getDefaultRouteForRole, type AppRole } from "@/lib/role-routes";

type UserType = "member" | "staff" | "admin";

const USER_TYPES: Array<{ id: UserType; label: string; sub: string; icon: typeof User }> = [
  { id: "member", label: "Member", sub: "Access your account", icon: User },
  { id: "staff", label: "Staff", sub: "Access staff panel", icon: Briefcase },
  { id: "admin", label: "Admin", sub: "Access admin panel", icon: Shield },
];

function roleGroup(role: AppRole): UserType {
  if (role === "member") return "member";
  if (role === "admin") return "admin";
  return "staff"; // staff + chairman
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>("member");
  const router = useRouter();
  const login = useLogin();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    try {
      const result = await login.mutateAsync({
        email: data.email,
        password: data.password,
        remember: data.remember ?? false,
      });
      setAuth(result.user);
      const actual = roleGroup(result.user.role);
      if (actual === userType) {
        toast.success("Welcome back!");
      } else {
        const actualLabel = USER_TYPES.find((u) => u.id === actual)?.label ?? actual;
        toast.info(`Signed in as ${actualLabel}. Redirecting to your portal.`);
      }
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
        <h2 className="text-2xl font-bold text-text text-center">Login to Your Account</h2>
        <p className="text-text-muted text-center mt-2 mb-8">Select your user type and enter your credentials</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <span className="block text-sm font-medium text-text mb-3">Select User Type</span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="User type">
              {USER_TYPES.map((opt) => {
                const Icon = opt.icon;
                const active = userType === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setUserType(opt.id)}
                    className={`relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border text-center transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-white/60 dark:bg-white/5 text-text-muted hover:border-primary/40 hover:text-text"
                    }`}
                  >
                    {active && (
                      <CheckCircle2 className="absolute top-1.5 right-1.5 w-4 h-4 text-primary" aria-hidden="true" />
                    )}
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-[10px] leading-tight text-text-muted">{opt.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
                autoComplete="email"
                {...register("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full pl-12 pr-4 py-3.5 bg-white/60 dark:bg-white/5 border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white/80 dark:focus:bg-white/10 ${errors.email ? "border-danger" : "border-white/40 dark:border-white/10"}`}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-xs text-danger mt-1.5" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
              Password
            </label>
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
                {showPassword ? (
                  <EyeOff className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Eye className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-danger mt-1.5" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("remember")}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
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
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:text-primary-dark">
            Create Account
          </Link>
        </p>
      </div>
      <SecurityBadge />
    </div>
  );
}
