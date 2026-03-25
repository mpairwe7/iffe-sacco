"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/schemas";
import { useRegister } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const registerMutation = useRegister();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    try {
      const result = await registerMutation.mutateAsync({
        name: data.firstName + " " + data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "member",
      });
      setAuth(result.user, result.tokens);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    }
  }

  return (
    <div className="glass-card rounded-3xl p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-text text-center">Create Account</h2>
      <p className="text-text-muted text-center mt-2 mb-8">Join IFFE SACCO today</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-text mb-2">First Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <input
                id="first_name"
                type="text"
                placeholder="John"
                {...register("firstName")}
                aria-invalid={!!errors.firstName}
                className={`w-full pl-12 pr-4 py-3 bg-white/60 border rounded-xl text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.firstName ? "border-danger" : "border-white/40"}`}
              />
            </div>
            {errors.firstName && <p className="text-xs text-danger mt-1.5" role="alert">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-text mb-2">Last Name</label>
            <input
              id="last_name"
              type="text"
              placeholder="Doe"
              {...register("lastName")}
              aria-invalid={!!errors.lastName}
              className={`w-full px-4 py-3 bg-white/60 border rounded-xl text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.lastName ? "border-danger" : "border-white/40"}`}
            />
            {errors.lastName && <p className="text-xs text-danger mt-1.5" role="alert">{errors.lastName.message}</p>}
          </div>
        </div>

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
              className={`w-full pl-12 pr-4 py-3 bg-white/60 border rounded-xl text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.email ? "border-danger" : "border-white/40"}`}
            />
          </div>
          {errors.email && <p className="text-xs text-danger mt-1.5" role="alert">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
            <input
              id="phone"
              type="tel"
              placeholder="+254 700 000 000"
              {...register("phone")}
              aria-invalid={!!errors.phone}
              className={`w-full pl-12 pr-4 py-3 bg-white/60 border rounded-xl text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.phone ? "border-danger" : "border-white/40"}`}
            />
          </div>
          {errors.phone && <p className="text-xs text-danger mt-1.5" role="alert">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              {...register("password")}
              aria-invalid={!!errors.password}
              className={`w-full pl-12 pr-12 py-3 bg-white/60 border rounded-xl text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.password ? "border-danger" : "border-white/40"}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text" tabIndex={-1}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1.5" role="alert">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              {...register("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
              className={`w-full pl-12 pr-4 py-3 bg-white/60 border rounded-xl text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.confirmPassword ? "border-danger" : "border-white/40"}`}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-danger mt-1.5" role="alert">{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" {...register("terms")} className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20" />
            <span className="text-sm text-text-muted">I agree to the <a href="/terms" className="text-primary font-medium hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</a></span>
          </label>
          {errors.terms && <p className="text-xs text-danger mt-1.5" role="alert">{errors.terms.message}</p>}
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {registerMutation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
          ) : (
            <>Create Account <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account? <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">Sign In</Link>
      </p>
    </div>
  );
}
