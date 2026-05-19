"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, User, Phone, Mail, Lock, Eye, EyeOff, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/ui/form-field";
import { useRegister } from "@/hooks/use-auth";
import { useSubmitApplication } from "@/hooks/use-applications";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

// ── Zod Schema ──────────────────────────────────────────────────────
// First-time signup only collects what's strictly needed to create an
// account and a minimal Member identity. Everything else (date of
// birth, totem, places, work, family, application letter, …) can be
// filled in later from the member portal. Keeping signup short
// dramatically cuts drop-off.
//
// Required: fullName, sex, phone, email, clan, password, terms.
const applicationSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    sex: z.enum(["male", "female"], { message: "Please select your sex" }),
    phone: z.string().min(10, "Valid phone number is required"),
    email: z.email("Valid email is required"),
    clan: z.string().min(1, "Clan is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, "You must accept the terms and conditions"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ApplicationFormInput = z.input<typeof applicationSchema>;
type ApplicationForm = z.output<typeof applicationSchema>;

// ── Step definitions ────────────────────────────────────────────────
// Two steps: bio data → account credentials. Past iterations carried
// five steps (places, work, family, documents) but every one of those
// is now optional and lives on the profile-completion flow.
const STEPS = [
  { label: "Member Info", icon: User },
  { label: "Account", icon: Lock },
] as const;

const STEP_FIELDS: (keyof ApplicationFormInput)[][] = [
  ["fullName", "sex", "phone", "email", "clan"],
  ["password", "confirmPassword", "terms"],
];

// ── Animation variants ──────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

// ═══════════════════════════════════════════════════════════════════
// ── Main Page ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const registerMutation = useRegister();
  const submitApp = useSubmitApplication();
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm<ApplicationFormInput, unknown, ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      sex: "" as unknown as "male",
      phone: "",
      email: "",
      clan: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const goNext = useCallback(async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) {
      toast.error("Please complete all required fields before continuing");
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, trigger]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  async function onSubmit(data: ApplicationForm) {
    try {
      // 1. Create the user account.
      const result = await registerMutation.mutateAsync({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "member",
      });
      setAuth(result.user);

      // 2. Submit the minimal application. Backend schema accepts the
      // optional fields as absent — the Member record will be created
      // with the rest of the columns nullable on approval. Members can
      // fill in places / work / family / qualifications later from the
      // portal profile.
      await submitApp.mutateAsync({
        fullName: data.fullName,
        sex: data.sex,
        phone: data.phone,
        email: data.email,
        clan: data.clan,
      });

      toast.success("Application submitted successfully!");
      router.push("/application-status");
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong. Please try again.");
    }
  }

  const isSubmitting = registerMutation.isPending || submitApp.isPending;

  return (
    <div className="relative glass-card rounded-2xl p-6 sm:p-8 shadow-xl w-full max-w-2xl mx-auto overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-dark via-primary to-success" />
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="pointer-events-none absolute -bottom-6 -right-6 w-32 h-32 text-primary/10"
      >
        <path fill="currentColor" d="M50 5C25 5 5 25 5 50c0 12 6 24 14 32 4-22 22-40 44-44-3-19-13-33-13-33z" />
        <path fill="currentColor" opacity="0.6" d="M55 35c-8 4-15 11-19 19l-8 8c10-2 19-7 26-14s12-16 14-26l-13 13z" />
      </svg>

      {/* Header */}
      <div className="relative flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/25 mb-3">
          <FileText className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-text text-center tracking-tight">
          Membership Application
        </h2>
        <p className="text-text-muted text-center mt-1 mb-5 text-sm">Join the IFFE SACCO in under a minute.</p>
        <div className="mb-6 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-xs sm:text-sm text-text-muted text-center">
          Only essentials now &mdash; you can add the rest from your portal after approval.
        </div>
      </div>

      {/* ── Stepper ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="relative flex items-center justify-between mb-3">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-border/50 rounded-full" />
          <div
            className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-gradient-to-r from-success to-primary rounded-full transition-all duration-500"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < step;
            const isCurrent = i === step;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (i < step) {
                    setDirection(-1);
                    setStep(i);
                  }
                }}
                className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-gradient-to-br from-success to-success/80 border-success text-white shadow-lg shadow-success/30"
                    : isCurrent
                      ? "bg-gradient-to-br from-primary to-primary-dark border-primary text-white shadow-lg shadow-primary/30 scale-110"
                      : "bg-white/70 dark:bg-white/10 border-border/60 text-text-light"
                } ${i <= step ? "cursor-pointer" : "cursor-default"}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between">
          {STEPS.map((s, i) => (
            <span
              key={i}
              className={`text-[11px] sm:text-xs font-medium text-center w-24 ${
                i === step ? "text-primary" : i < step ? "text-success" : "text-text-light"
              }`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="relative overflow-hidden min-h-[320px]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* ════════════════ STEP 1 — Member Info ════════════════ */}
              {step === 0 && (
                <div className="space-y-4">
                  <FormField
                    label="Full Name"
                    icon={User}
                    required
                    {...register("fullName")}
                    error={errors.fullName?.message}
                    placeholder="e.g. Mukasa John"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Sex<span className="text-danger ml-0.5">*</span>
                      </label>
                      <select
                        {...register("sex")}
                        className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                      {errors.sex && <p className="text-sm text-danger mt-1.5">{errors.sex.message}</p>}
                    </div>
                    <FormField
                      label="Clan"
                      required
                      {...register("clan")}
                      error={errors.clan?.message}
                      placeholder="Your clan"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Phone"
                      icon={Phone}
                      type="tel"
                      required
                      {...register("phone")}
                      error={errors.phone?.message}
                      placeholder="+256 700 000 000"
                    />
                    <FormField
                      label="Email"
                      icon={Mail}
                      type="email"
                      required
                      {...register("email")}
                      error={errors.email?.message}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              )}

              {/* ════════════════ STEP 2 — Account ════════════════ */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Password<span className="text-danger ml-0.5">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min 8 characters"
                          {...register("password")}
                          className={`w-full pl-12 pr-12 py-3 bg-white/60 dark:bg-white/5 border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.password ? "border-danger" : "border-white/40 dark:border-white/10"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-danger mt-1.5" role="alert">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Confirm Password<span className="text-danger ml-0.5">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          {...register("confirmPassword")}
                          className={`w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-white/5 border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.confirmPassword ? "border-danger" : "border-white/40 dark:border-white/10"}`}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-danger mt-1.5" role="alert">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("terms")}
                        className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm text-text-muted">
                        I agree to the{" "}
                        <a href="/terms" className="text-primary font-medium hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" className="text-primary font-medium hover:underline">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-xs text-danger" role="alert">
                        {errors.terms.message}
                      </p>
                    )}
                  </div>

                  <div className="glass-subtle rounded-lg p-4 text-sm text-text-muted">
                    Place of birth / ancestral origin / residence, work, qualifications, family details, and the
                    application letter are optional now and can be completed from your member portal after approval.
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Navigation buttons ─────────────────────────────────── */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/20 dark:border-white/10">
          {step > 0 ? (
            <button
              type="button"
              onClick={goPrev}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-text bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg hover:bg-white/70 dark:hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit Application <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
          Sign In
        </Link>
      </p>
    </div>
  );
}
