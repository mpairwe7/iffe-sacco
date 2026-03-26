"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useForm, useFieldArray, type UseFormReturn } from "react-hook-form";
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
  Users,
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

// ── Zod Schema ──────────────────────────────────────────────────────
const placeSchema = z.object({
  district: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  parish: z.string().optional(),
  village: z.string().optional(),
});

const parentSchema = z.object({
  name: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  alive: z.boolean().default(true),
  diedBeforeOrAfterJoining: z.string().optional(),
});

const spouseSchema = z.object({
  name: z.string().optional(),
  fatherName: z.string().optional(),
  fatherAlive: z.boolean().default(true),
  motherName: z.string().optional(),
  motherAlive: z.boolean().default(true),
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

const applicationSchema = z
  .object({
    // Step 1
    fullName: z.string().min(2, "Full name is required"),
    dateOfBirth: z.string().optional(),
    sex: z.string().optional(),
    phone: z.string().min(10, "Valid phone number is required"),
    email: z.string().optional(),
    clan: z.string().optional(),
    totem: z.string().optional(),
    // Step 2
    birthPlace: placeSchema,
    ancestralPlace: placeSchema,
    residencePlace: placeSchema,
    // Step 3
    occupation: z.string().optional(),
    placeOfWork: z.string().optional(),
    qualifications: z.string().optional(),
    // Step 4
    fatherInfo: parentSchema,
    motherInfo: parentSchema,
    spouses: z.array(spouseSchema).default([]),
    children: z.array(childSchema).default([]),
    otherRelatives: z.array(relativeSchema).default([]),
    // Step 5
    applicationLetterName: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    terms: z.literal(true, "You must accept the terms and conditions"),
    reaffirmation: z.literal(true, "You must reaffirm the information is correct"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ApplicationForm = z.infer<typeof applicationSchema>;

// ── Step definitions ────────────────────────────────────────────────
const STEPS = [
  { label: "General Info", icon: User },
  { label: "Places", icon: MapPin },
  { label: "Work & Education", icon: Briefcase },
  { label: "Family", icon: Users },
  { label: "Documents", icon: FileText },
] as const;

// Fields to validate per step before allowing next
const STEP_FIELDS: (keyof ApplicationForm)[][] = [
  ["fullName", "phone"],
  ["birthPlace", "ancestralPlace", "residencePlace"],
  ["occupation"],
  ["fatherInfo", "motherInfo"],
  ["password", "confirmPassword", "terms", "reaffirmation"],
];

// ── Animation variants ──────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

// ── Collapsible section ─────────────────────────────────────────────
function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/30 dark:border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/30 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 text-sm font-semibold text-text"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
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
  form: UseFormReturn<ApplicationForm, any, any>;
}) {
  const { register, formState: { errors } } = form;
  const fields = ["district", "county", "subCounty", "parish", "village"] as const;
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
          error={(errors[prefix] as any)?.[f]?.message}
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
  form: UseFormReturn<ApplicationForm, any, any>;
}) {
  const { register, watch, formState: { errors } } = form;
  const alive = watch(`${prefix}.alive`);
  const pe = (errors[prefix] || {}) as any;

  return (
    <CollapsibleSection title={title} defaultOpen={prefix === "fatherInfo"}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Name" {...register(`${prefix}.name`)} error={pe.name?.message} placeholder="Full name" />
        <FormField label="District" {...register(`${prefix}.district`)} error={pe.district?.message} placeholder="District" />
        <FormField label="Village" {...register(`${prefix}.village`)} error={pe.village?.message} placeholder="Village" />
        <FormField label="Phone" {...register(`${prefix}.phone`)} error={pe.phone?.message} placeholder="Phone number" />
        <FormField label="Email" {...register(`${prefix}.email`)} error={pe.email?.message} placeholder="Email address" />
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
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3">
          <div>
            <label className="block text-sm font-medium text-text mb-2">If dead, died before or after joining?</label>
            <select
              {...register(`${prefix}.diedBeforeOrAfterJoining`)}
              className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema) as any,
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      sex: "",
      phone: "",
      email: "",
      clan: "",
      totem: "",
      birthPlace: { district: "", county: "", subCounty: "", parish: "", village: "" },
      ancestralPlace: { district: "", county: "", subCounty: "", parish: "", village: "" },
      residencePlace: { district: "", county: "", subCounty: "", parish: "", village: "" },
      occupation: "",
      placeOfWork: "",
      qualifications: "",
      fatherInfo: { name: "", district: "", village: "", phone: "", email: "", alive: true, diedBeforeOrAfterJoining: "" },
      motherInfo: { name: "", district: "", village: "", phone: "", email: "", alive: true, diedBeforeOrAfterJoining: "" },
      spouses: [],
      children: [],
      otherRelatives: [],
      applicationLetterName: "",
      password: "",
      confirmPassword: "",
      terms: undefined as any,
      reaffirmation: undefined as any,
    },
    mode: "onTouched",
  });

  const { register, handleSubmit, trigger, formState: { errors } } = form;

  const spousesField = useFieldArray({ control: form.control, name: "spouses" });
  const childrenField = useFieldArray({ control: form.control, name: "children" });
  const relativesField = useFieldArray({ control: form.control, name: "otherRelatives" });

  // ── Step navigation ──────────────────────────────────────────────
  const goNext = useCallback(async () => {
    const fieldsToValidate = STEP_FIELDS[step];
    const valid = await trigger(fieldsToValidate as any);
    if (!valid) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, trigger]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  // ── File handler ─────────────────────────────────────────────────
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
    form.setValue("applicationLetterName", file.name);
  };

  // ── Submit ───────────────────────────────────────────────────────
  async function onSubmit(data: ApplicationForm) {
    try {
      // 1. Register the user
      const email = data.email || `${data.phone.replace(/\D/g, "")}@iffe-sacco.app`;
      const result = await registerMutation.mutateAsync({
        name: data.fullName,
        email,
        phone: data.phone,
        password: data.password,
        role: "member",
      });
      setAuth(result.user, result.tokens);

      // 2. Submit the application
      const { password: _, confirmPassword: __, terms: ___, reaffirmation: ____, ...appData } = data;
      await submitApp.mutateAsync(appData);

      toast.success("Application submitted successfully!");
      router.push("/application-status");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    }
  }

  const isSubmitting = registerMutation.isPending || submitApp.isPending;

  // ═════════════════════════════════════════════════════════════════
  // ── Render ──────────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl w-full max-w-2xl mx-auto">
      {/* Header */}
      <h2 className="text-2xl font-bold text-text text-center">Membership Application</h2>
      <p className="text-text-muted text-center mt-1 mb-6 text-sm">IBDA Member Bio Data Form</p>

      {/* ── Stepper ──────────────────────────────────────────────── */}
      <div className="mb-8">
        {/* Progress bar */}
        <div className="relative flex items-center justify-between mb-3">
          {/* Background track */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-border/50 rounded-full" />
          {/* Filled track */}
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
                    setDirection(i < step ? -1 : 1);
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
        {/* Step labels */}
        <div className="flex justify-between">
          {STEPS.map((s, i) => (
            <span
              key={i}
              className={`text-[10px] sm:text-xs font-medium text-center w-16 sm:w-20 ${
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
        <div className="relative overflow-hidden min-h-[380px]">
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
              {/* ════════════════ STEP 1 ════════════════ */}
              {step === 0 && (
                <div className="space-y-4">
                  <FormField label="Full Name" icon={User} required {...register("fullName")} error={errors.fullName?.message} placeholder="e.g. Mukasa John" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Date of Birth" type="date" {...register("dateOfBirth")} error={errors.dateOfBirth?.message} />
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Sex</label>
                      <select
                        {...register("sex")}
                        className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Phone" icon={Phone} required {...register("phone")} error={errors.phone?.message} placeholder="+256 700 000 000" />
                    <FormField label="Email" icon={Mail} {...register("email")} error={errors.email?.message} placeholder="you@example.com" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Clan" {...register("clan")} error={errors.clan?.message} placeholder="Your clan" />
                    <FormField label="Totem" {...register("totem")} error={errors.totem?.message} placeholder="Your totem" />
                  </div>
                </div>
              )}

              {/* ════════════════ STEP 2 ════════════════ */}
              {step === 1 && (
                <div className="space-y-4">
                  <CollapsibleSection title="Place of Birth" defaultOpen>
                    <PlaceFields prefix="birthPlace" form={form} />
                  </CollapsibleSection>
                  <CollapsibleSection title="Place of Ancestral Origin">
                    <PlaceFields prefix="ancestralPlace" form={form} />
                  </CollapsibleSection>
                  <CollapsibleSection title="Place of Residence">
                    <PlaceFields prefix="residencePlace" form={form} />
                  </CollapsibleSection>
                </div>
              )}

              {/* ════════════════ STEP 3 ════════════════ */}
              {step === 2 && (
                <div className="space-y-4">
                  <FormField label="Occupation" icon={Briefcase} {...register("occupation")} error={errors.occupation?.message} placeholder="e.g. Farmer, Teacher..." />
                  <FormField label="Place of Work" icon={MapPin} {...register("placeOfWork")} error={errors.placeOfWork?.message} placeholder="e.g. Kampala City Council" />
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Qualifications</label>
                    <textarea
                      {...register("qualifications")}
                      rows={5}
                      placeholder="List your educational qualifications, certificates, etc."
                      className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ════════════════ STEP 4 ════════════════ */}
              {step === 3 && (
                <div className="space-y-5">
                  <ParentFields prefix="fatherInfo" title="Father's Information" form={form} />
                  <ParentFields prefix="motherInfo" title="Mother's Information" form={form} />

                  {/* Spouses table */}
                  <CollapsibleSection title={`Spouses (${spousesField.fields.length})`}>
                    {spousesField.fields.length > 0 && (
                      <div className="overflow-x-auto -mx-4 px-4">
                        <table className="w-full min-w-[700px] text-sm">
                          <thead>
                            <tr className="text-left text-text-muted border-b border-white/20">
                              <th className="pb-2 pr-2">Name</th>
                              <th className="pb-2 pr-2">Father</th>
                              <th className="pb-2 pr-2 w-10">F. Alive</th>
                              <th className="pb-2 pr-2">Mother</th>
                              <th className="pb-2 pr-2 w-10">M. Alive</th>
                              <th className="pb-2 pr-2">Contact</th>
                              <th className="pb-2 pr-2">Address</th>
                              <th className="pb-2 w-8" />
                            </tr>
                          </thead>
                          <tbody>
                            {spousesField.fields.map((field, i) => (
                              <tr key={field.id} className="border-b border-white/10">
                                <td className="py-1.5 pr-2"><input {...register(`spouses.${i}.name`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5 pr-2"><input {...register(`spouses.${i}.fatherName`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5 pr-2 text-center"><input type="checkbox" {...register(`spouses.${i}.fatherAlive`)} className="w-4 h-4 rounded border-border text-primary" /></td>
                                <td className="py-1.5 pr-2"><input {...register(`spouses.${i}.motherName`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5 pr-2 text-center"><input type="checkbox" {...register(`spouses.${i}.motherAlive`)} className="w-4 h-4 rounded border-border text-primary" /></td>
                                <td className="py-1.5 pr-2"><input {...register(`spouses.${i}.contact`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5 pr-2"><input {...register(`spouses.${i}.address`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5"><button type="button" onClick={() => spousesField.remove(i)} className="p-1 text-danger hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => spousesField.append({ name: "", fatherName: "", fatherAlive: true, motherName: "", motherAlive: true, contact: "", address: "" })}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark mt-2"
                    >
                      <Plus className="w-4 h-4" /> Add Spouse
                    </button>
                  </CollapsibleSection>

                  {/* Children table */}
                  <CollapsibleSection title={`Children (${childrenField.fields.length})`}>
                    {childrenField.fields.length > 0 && (
                      <div className="overflow-x-auto -mx-4 px-4">
                        <table className="w-full min-w-[400px] text-sm">
                          <thead>
                            <tr className="text-left text-text-muted border-b border-white/20">
                              <th className="pb-2 pr-2">Name</th>
                              <th className="pb-2 pr-2 w-28">Sex</th>
                              <th className="pb-2 pr-2">Contact</th>
                              <th className="pb-2 w-8" />
                            </tr>
                          </thead>
                          <tbody>
                            {childrenField.fields.map((field, i) => (
                              <tr key={field.id} className="border-b border-white/10">
                                <td className="py-1.5 pr-2"><input {...register(`children.${i}.name`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5 pr-2">
                                  <select {...register(`children.${i}.sex`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text">
                                    <option value="">--</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                  </select>
                                </td>
                                <td className="py-1.5 pr-2"><input {...register(`children.${i}.contact`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5"><button type="button" onClick={() => childrenField.remove(i)} className="p-1 text-danger hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
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

                  {/* Other Relatives table */}
                  <CollapsibleSection title={`Other Relatives (${relativesField.fields.length})`}>
                    {relativesField.fields.length > 0 && (
                      <div className="overflow-x-auto -mx-4 px-4">
                        <table className="w-full min-w-[500px] text-sm">
                          <thead>
                            <tr className="text-left text-text-muted border-b border-white/20">
                              <th className="pb-2 pr-2">Full Name</th>
                              <th className="pb-2 pr-2">Relationship</th>
                              <th className="pb-2 pr-2">Location</th>
                              <th className="pb-2 pr-2">Contact</th>
                              <th className="pb-2 w-8" />
                            </tr>
                          </thead>
                          <tbody>
                            {relativesField.fields.map((field, i) => (
                              <tr key={field.id} className="border-b border-white/10">
                                <td className="py-1.5 pr-2"><input {...register(`otherRelatives.${i}.fullName`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5 pr-2"><input {...register(`otherRelatives.${i}.relationship`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5 pr-2"><input {...register(`otherRelatives.${i}.location`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5 pr-2"><input {...register(`otherRelatives.${i}.contact`)} className="w-full px-2 py-1.5 bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg text-sm text-text" /></td>
                                <td className="py-1.5"><button type="button" onClick={() => relativesField.remove(i)} className="p-1 text-danger hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => relativesField.append({ fullName: "", relationship: "", location: "", contact: "" })}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark mt-2"
                    >
                      <Plus className="w-4 h-4" /> Add Relative
                    </button>
                  </CollapsibleSection>
                </div>
              )}

              {/* ════════════════ STEP 5 ════════════════ */}
              {step === 4 && (
                <div className="space-y-5">
                  {/* File upload */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Application Letter</label>
                    <div className="relative">
                      <label className="flex flex-col items-center justify-center gap-2 py-6 px-4 border-2 border-dashed border-white/40 dark:border-white/15 rounded-xl cursor-pointer hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                        <Upload className="w-8 h-8 text-text-light" />
                        {selectedFileName ? (
                          <span className="text-sm text-primary font-medium">{selectedFileName}</span>
                        ) : (
                          <span className="text-sm text-text-muted">Click to upload PDF, DOC, or DOCX (max 2 MB)</span>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Password fields */}
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
                          className={`w-full pl-12 pr-12 py-3 bg-white/60 dark:bg-white/5 border rounded-xl text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.password ? "border-danger" : "border-white/40 dark:border-white/10"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-danger mt-1.5" role="alert">{errors.password.message}</p>}
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
                          className={`w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-white/5 border rounded-xl text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.confirmPassword ? "border-danger" : "border-white/40 dark:border-white/10"}`}
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-danger mt-1.5" role="alert">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>

                  {/* Terms checkbox */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("terms")}
                        className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm text-text-muted">
                        I agree to the{" "}
                        <a href="/terms" className="text-primary font-medium hover:underline">Terms of Service</a>{" "}
                        and{" "}
                        <a href="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</a>
                      </span>
                    </label>
                    {errors.terms && <p className="text-xs text-danger" role="alert">{errors.terms.message}</p>}
                  </div>

                  {/* Reaffirmation */}
                  <div className="glass-subtle rounded-xl p-4">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("reaffirmation")}
                        className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm text-text font-medium">
                        I reaffirm that the information I have provided above is correct.
                      </span>
                    </label>
                    {errors.reaffirmation && <p className="text-xs text-danger mt-1.5" role="alert">{errors.reaffirmation.message}</p>}
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
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-text bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl hover:bg-white/70 dark:hover:bg-white/10"
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
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <>Submit Application <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
          Sign In
        </Link>
      </p>
    </div>
  );
}
