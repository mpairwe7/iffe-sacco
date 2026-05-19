"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useForm, useFieldArray, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Briefcase,
  FileText,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/ui/form-field";
import { useRegister } from "@/hooks/use-auth";
import { useSubmitApplication } from "@/hooks/use-applications";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

// ── Zod Schemas ─────────────────────────────────────────────────────
// Only the five identity fields plus the credentials block are required.
// Everything else (places, work, family, application letter, …) is
// optional at signup; members can fill them in later from the portal.
// Array rows (spouses, children, relatives) stay strict when a row is
// added so half-typed rows are still caught.
const placeSchema = z
  .object({
    district: z.string().optional(),
    county: z.string().optional(),
    subCounty: z.string().optional(),
    parish: z.string().optional(),
    village: z.string().optional(),
  })
  .optional();

const parentSchema = z
  .object({
    name: z.string().optional(),
    district: z.string().optional(),
    village: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    alive: z.boolean().default(true),
    diedBeforeOrAfterJoining: z.string().optional(),
  })
  .optional();

const spouseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  fatherAlive: z.boolean().default(true),
  motherName: z.string().min(1, "Mother's name is required"),
  motherAlive: z.boolean().default(true),
  contact: z.string().min(10, "Valid contact is required"),
  address: z.string().min(1, "Address is required"),
});

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sex: z.string().min(1, "Please select sex"),
  contact: z.string().min(10, "Valid contact is required"),
});

const relativeSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  location: z.string().min(1, "Location is required"),
  contact: z.string().min(10, "Valid contact is required"),
});

const applicationSchema = z
  .object({
    // Required identity
    fullName: z.string().min(2, "Full name is required"),
    sex: z.enum(["male", "female"], { message: "Please select your sex" }),
    phone: z.string().min(10, "Valid phone number is required"),
    email: z.email("Valid email is required"),
    clan: z.string().min(1, "Clan is required"),

    // Optional bio
    dateOfBirth: z.string().optional(),
    totem: z.string().optional(),
    birthPlace: placeSchema,
    ancestralPlace: placeSchema,
    residencePlace: placeSchema,
    occupation: z.string().optional(),
    placeOfWork: z.string().optional(),
    qualifications: z.string().optional(),
    fatherInfo: parentSchema,
    motherInfo: parentSchema,
    spouses: z.array(spouseSchema).default([]),
    children: z.array(childSchema).default([]),
    otherRelatives: z.array(relativeSchema).default([]),
    applicationLetterName: z.string().optional(),

    // Account
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((value) => value, "You must accept the terms and conditions"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ApplicationFormInput = z.input<typeof applicationSchema>;
type ApplicationForm = z.output<typeof applicationSchema>;
type PlaceFieldKey = "district" | "county" | "subCounty" | "parish" | "village";
type ParentFieldKey = "name" | "district" | "village" | "phone" | "email";

// ── Step definitions ────────────────────────────────────────────────
const STEPS = [
  { label: "Member Info", icon: User },
  { label: "Account", icon: Lock },
] as const;

// Step-advance validation runs only against required fields; optional
// fields are happy with empty values and don't gate Next.
const STEP_FIELDS: (keyof ApplicationFormInput)[][] = [
  ["fullName", "sex", "phone", "email", "clan"],
  ["password", "confirmPassword", "terms"],
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

function getNestedErrorMessage(errors: FieldErrors<ApplicationFormInput>, path: readonly string[]) {
  let current: unknown = errors;
  for (const segment of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  if (!current || typeof current !== "object") return undefined;
  const message = (current as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

// ── Collapsible section ─────────────────────────────────────────────
function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-white/30 dark:border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/30 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 text-sm font-semibold text-text"
      >
        <span className="flex flex-col items-start gap-0.5">
          <span>{title}</span>
          {subtitle && <span className="text-[11px] font-normal text-text-light">{subtitle}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Place fields component ──────────────────────────────────────────
function PlaceFields({
  prefix,
  form,
}: {
  prefix: "birthPlace" | "ancestralPlace" | "residencePlace";
  form: UseFormReturn<ApplicationFormInput, unknown, ApplicationForm>;
}) {
  const {
    register,
    formState: { errors },
  } = form;
  const fields: readonly PlaceFieldKey[] = ["district", "county", "subCounty", "parish", "village"];
  const labels: Record<string, string> = {
    district: "District",
    county: "County",
    subCounty: "Sub-county",
    parish: "Parish",
    village: "Village",
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {fields.map((f) => (
        <FormField
          key={f}
          label={labels[f]}
          {...register(`${prefix}.${f}`)}
          error={getNestedErrorMessage(errors, [prefix, f])}
          placeholder={labels[f]}
        />
      ))}
    </div>
  );
}

// ── Parent info component ───────────────────────────────────────────
function ParentFields({
  prefix,
  title,
  form,
}: {
  prefix: "fatherInfo" | "motherInfo";
  title: string;
  form: UseFormReturn<ApplicationFormInput, unknown, ApplicationForm>;
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const alive = watch(`${prefix}.alive`);
  const parentFields: readonly ParentFieldKey[] = ["name", "district", "village", "phone", "email"];

  return (
    <CollapsibleSection title={title}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {parentFields.map((field) => (
          <FormField
            key={field}
            type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
            label={
              field === "name"
                ? "Name"
                : field === "district"
                  ? "District"
                  : field === "village"
                    ? "Village"
                    : field === "phone"
                      ? "Phone"
                      : "Email"
            }
            {...register(`${prefix}.${field}`)}
            error={getNestedErrorMessage(errors, [prefix, field])}
            placeholder={
              field === "name"
                ? "Full name"
                : field === "district"
                  ? "District"
                  : field === "village"
                    ? "Village"
                    : field === "phone"
                      ? "Phone number"
                      : "Email address"
            }
          />
        ))}
      </div>
      <div className="flex items-center gap-6 mt-3">
        <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
          <input
            type="checkbox"
            {...register(`${prefix}.alive`)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
          />
          Alive
        </label>
      </div>
      {!alive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3"
        >
          <div>
            <label className="block text-sm font-medium text-text mb-2">If dead, died before or after joining?</label>
            <select
              {...register(`${prefix}.diedBeforeOrAfterJoining`)}
              className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select...</option>
              <option value="before">Before joining</option>
              <option value="after">After joining</option>
            </select>
          </div>
        </motion.div>
      )}
    </CollapsibleSection>
  );
}

// ── Payload cleaner — drop blanks before posting so the application
// row gets actual NULL columns rather than empty strings, and empty
// nested place/parent objects get omitted entirely.
function isMeaningful(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value).some((v) => isMeaningful(v));
  }
  return true;
}

function pruneObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = pruneObject(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) out[key] = nested;
    } else if (isMeaningful(value)) {
      out[key] = value;
    }
  }
  return out as Partial<T>;
}

// ═══════════════════════════════════════════════════════════════════
// ── Main Page ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

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
      dateOfBirth: "",
      totem: "",
      birthPlace: { district: "", county: "", subCounty: "", parish: "", village: "" },
      ancestralPlace: { district: "", county: "", subCounty: "", parish: "", village: "" },
      residencePlace: { district: "", county: "", subCounty: "", parish: "", village: "" },
      occupation: "",
      placeOfWork: "",
      qualifications: "",
      fatherInfo: {
        name: "",
        district: "",
        village: "",
        phone: "",
        email: "",
        alive: true,
        diedBeforeOrAfterJoining: "",
      },
      motherInfo: {
        name: "",
        district: "",
        village: "",
        phone: "",
        email: "",
        alive: true,
        diedBeforeOrAfterJoining: "",
      },
      spouses: [],
      children: [],
      otherRelatives: [],
      applicationLetterName: "",
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

  const spousesField = useFieldArray({ control: form.control, name: "spouses" });
  const childrenField = useFieldArray({ control: form.control, name: "children" });
  const relativesField = useFieldArray({ control: form.control, name: "otherRelatives" });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, or DOCX file");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2 MB");
      e.target.value = "";
      return;
    }
    setSelectedFileName(file.name);
    form.setValue("applicationLetterName", file.name, { shouldValidate: true, shouldDirty: true });
  };

  async function onSubmit(data: ApplicationForm) {
    try {
      // 1. Create the account first — vital identity only.
      const result = await registerMutation.mutateAsync({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "member",
      });
      setAuth(result.user);

      // 2. Build the application payload. Required fields go in
      //    verbatim; optional fields are run through pruneObject so
      //    untouched sections (empty places, empty parent objects,
      //    untouched arrays) don't write empty strings or skeleton
      //    objects into the Application row.
      const required = {
        fullName: data.fullName,
        sex: data.sex,
        phone: data.phone,
        email: data.email,
        clan: data.clan,
      };
      const optional = pruneObject({
        dateOfBirth: data.dateOfBirth,
        totem: data.totem,
        birthPlace: data.birthPlace,
        ancestralPlace: data.ancestralPlace,
        residencePlace: data.residencePlace,
        occupation: data.occupation,
        placeOfWork: data.placeOfWork,
        qualifications: data.qualifications,
        fatherInfo: data.fatherInfo,
        motherInfo: data.motherInfo,
        spouses: data.spouses,
        children: data.children,
        otherRelatives: data.otherRelatives,
        applicationLetterName: data.applicationLetterName,
      });

      await submitApp.mutateAsync({ ...required, ...optional });

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
        <p className="text-text-muted text-center mt-1 mb-5 text-sm">
          Fill in the essentials &mdash; add the rest now or later from your portal.
        </p>
        <div className="mb-6 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-xs sm:text-sm text-text-muted text-center">
          <span className="text-danger font-bold">*</span> marks the only required fields.
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
        <div className="relative overflow-hidden min-h-[420px]">
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
                <div className="space-y-5">
                  {/* Required identity */}
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

                  {/* Optional extras — one big collapsible, closed by default */}
                  <CollapsibleSection
                    title="Add more details"
                    subtitle="Optional. You can also do this later from your portal."
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          label="Date of Birth"
                          type="date"
                          min="1930-01-01"
                          max={new Date().toISOString().split("T")[0]}
                          {...register("dateOfBirth")}
                          error={errors.dateOfBirth?.message}
                        />
                        <FormField
                          label="Totem"
                          {...register("totem")}
                          error={errors.totem?.message}
                          placeholder="Your totem"
                        />
                      </div>

                      <CollapsibleSection title="Place of Birth">
                        <PlaceFields prefix="birthPlace" form={form} />
                      </CollapsibleSection>
                      <CollapsibleSection title="Place of Ancestral Origin">
                        <PlaceFields prefix="ancestralPlace" form={form} />
                      </CollapsibleSection>
                      <CollapsibleSection title="Place of Residence">
                        <PlaceFields prefix="residencePlace" form={form} />
                      </CollapsibleSection>

                      <CollapsibleSection title="Work & Education">
                        <FormField
                          label="Occupation"
                          icon={Briefcase}
                          {...register("occupation")}
                          error={errors.occupation?.message}
                          placeholder="e.g. Farmer, Teacher..."
                        />
                        <FormField
                          label="Place of Work"
                          icon={MapPin}
                          {...register("placeOfWork")}
                          error={errors.placeOfWork?.message}
                          placeholder="e.g. Kampala City Council"
                        />
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">Qualifications</label>
                          <textarea
                            {...register("qualifications")}
                            rows={4}
                            placeholder="List your educational qualifications, certificates, etc."
                            className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                          />
                          {errors.qualifications && (
                            <p className="text-sm text-danger mt-1.5">{errors.qualifications.message}</p>
                          )}
                        </div>
                      </CollapsibleSection>

                      <CollapsibleSection title="Family" subtitle="Parents, spouses, children, relatives">
                        <div className="space-y-4">
                          <ParentFields prefix="fatherInfo" title="Father's Information" form={form} />
                          <ParentFields prefix="motherInfo" title="Mother's Information" form={form} />

                          {/* Spouses */}
                          <CollapsibleSection title={`Spouses (${spousesField.fields.length})`}>
                            {spousesField.fields.length > 0 && (
                              <div className="overflow-x-auto -mx-4 px-4">
                                <table className="w-full min-w-[700px] text-sm">
                                  <thead>
                                    <tr className="text-left text-text-muted border-b border-white/20">
                                      <th scope="col" className="pb-2 pr-2">
                                        Name
                                      </th>
                                      <th scope="col" className="pb-2 pr-2">
                                        Father
                                      </th>
                                      <th scope="col" className="pb-2 pr-2 w-10">
                                        F. Alive
                                      </th>
                                      <th scope="col" className="pb-2 pr-2">
                                        Mother
                                      </th>
                                      <th scope="col" className="pb-2 pr-2 w-10">
                                        M. Alive
                                      </th>
                                      <th scope="col" className="pb-2 pr-2">
                                        Contact
                                      </th>
                                      <th scope="col" className="pb-2 pr-2">
                                        Address
                                      </th>
                                      <th scope="col" className="pb-2 w-8" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {spousesField.fields.map((field, i) => (
                                      <tr key={field.id} className="border-b border-white/10">
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`spouses.${i}.name`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`spouses.${i}.fatherName`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2 text-center">
                                          <input
                                            type="checkbox"
                                            {...register(`spouses.${i}.fatherAlive`)}
                                            className="w-4 h-4 rounded border-border text-primary"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`spouses.${i}.motherName`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2 text-center">
                                          <input
                                            type="checkbox"
                                            {...register(`spouses.${i}.motherAlive`)}
                                            className="w-4 h-4 rounded border-border text-primary"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`spouses.${i}.contact`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`spouses.${i}.address`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5">
                                          <button
                                            type="button"
                                            onClick={() => spousesField.remove(i)}
                                            className="p-1 text-danger hover:bg-danger/10 rounded-lg"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                spousesField.append({
                                  name: "",
                                  fatherName: "",
                                  fatherAlive: true,
                                  motherName: "",
                                  motherAlive: true,
                                  contact: "",
                                  address: "",
                                })
                              }
                              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark mt-2"
                            >
                              <Plus className="w-4 h-4" /> Add Spouse
                            </button>
                          </CollapsibleSection>

                          {/* Children */}
                          <CollapsibleSection title={`Children (${childrenField.fields.length})`}>
                            {childrenField.fields.length > 0 && (
                              <div className="overflow-x-auto -mx-4 px-4">
                                <table className="w-full min-w-[400px] text-sm">
                                  <thead>
                                    <tr className="text-left text-text-muted border-b border-white/20">
                                      <th scope="col" className="pb-2 pr-2">
                                        Name
                                      </th>
                                      <th scope="col" className="pb-2 pr-2 w-28">
                                        Sex
                                      </th>
                                      <th scope="col" className="pb-2 pr-2">
                                        Contact
                                      </th>
                                      <th scope="col" className="pb-2 w-8" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {childrenField.fields.map((field, i) => (
                                      <tr key={field.id} className="border-b border-white/10">
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`children.${i}.name`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <select
                                            {...register(`children.${i}.sex`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          >
                                            <option value="">--</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                          </select>
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`children.${i}.contact`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5">
                                          <button
                                            type="button"
                                            onClick={() => childrenField.remove(i)}
                                            className="p-1 text-danger hover:bg-danger/10 rounded-lg"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => childrenField.append({ name: "", sex: "", contact: "" })}
                              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark mt-2"
                            >
                              <Plus className="w-4 h-4" /> Add Child
                            </button>
                          </CollapsibleSection>

                          {/* Other Relatives */}
                          <CollapsibleSection title={`Other Relatives (${relativesField.fields.length})`}>
                            {relativesField.fields.length > 0 && (
                              <div className="overflow-x-auto -mx-4 px-4">
                                <table className="w-full min-w-[500px] text-sm">
                                  <thead>
                                    <tr className="text-left text-text-muted border-b border-white/20">
                                      <th scope="col" className="pb-2 pr-2">
                                        Full Name
                                      </th>
                                      <th scope="col" className="pb-2 pr-2">
                                        Relationship
                                      </th>
                                      <th scope="col" className="pb-2 pr-2">
                                        Location
                                      </th>
                                      <th scope="col" className="pb-2 pr-2">
                                        Contact
                                      </th>
                                      <th scope="col" className="pb-2 w-8" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {relativesField.fields.map((field, i) => (
                                      <tr key={field.id} className="border-b border-white/10">
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`otherRelatives.${i}.fullName`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`otherRelatives.${i}.relationship`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`otherRelatives.${i}.location`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <input
                                            {...register(`otherRelatives.${i}.contact`)}
                                            className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text"
                                          />
                                        </td>
                                        <td className="py-1.5">
                                          <button
                                            type="button"
                                            onClick={() => relativesField.remove(i)}
                                            className="p-1 text-danger hover:bg-danger/10 rounded-lg"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                relativesField.append({ fullName: "", relationship: "", location: "", contact: "" })
                              }
                              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark mt-2"
                            >
                              <Plus className="w-4 h-4" /> Add Relative
                            </button>
                          </CollapsibleSection>
                        </div>
                      </CollapsibleSection>

                      <CollapsibleSection title="Application Letter">
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">
                            Upload your application letter
                          </label>
                          <div className="relative">
                            <label className="flex flex-col items-center justify-center gap-2 py-6 px-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-white/40 dark:border-white/15 hover:bg-white/20 dark:hover:bg-white/5">
                              <Upload className="w-8 h-8 text-text-light" />
                              {selectedFileName ? (
                                <span className="text-sm text-primary font-medium">{selectedFileName}</span>
                              ) : (
                                <span className="text-sm text-text-muted">
                                  Click to upload PDF, DOC, or DOCX (max 2 MB)
                                </span>
                              )}
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                aria-label="Upload application letter"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </CollapsibleSection>
                    </div>
                  </CollapsibleSection>
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
