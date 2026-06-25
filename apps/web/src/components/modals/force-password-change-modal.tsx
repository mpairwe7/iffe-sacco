"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff, Check } from "lucide-react";
import type { User } from "@iffe/shared";
import { useSetInitialPassword } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

/**
 * Non-dismissible popup shown when the signed-in account was issued a temporary
 * password (`mustChangePassword`). The member must set a new password before
 * doing anything else — the server also blocks every other endpoint until then.
 */
export function ForcePasswordChangeModal({ user }: { user: User }) {
  const [open, setOpen] = useState(Boolean(user.mustChangePassword));
  const setInitialPassword = useSetInitialPassword();
  const setStoreUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [showPassword, setShowPassword] = useState(false);
  // useWatch (not watch()) so the React Compiler can memoize this component.
  const newPassword = useWatch({ control, name: "newPassword" }) || "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) || "";
  const longEnough = newPassword.length >= 8;
  const matches = confirmPassword.length > 0 && newPassword === confirmPassword;

  function onSubmit(values: FormValues) {
    setInitialPassword.mutate(
      { newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success("Password set. Welcome aboard!");
          setStoreUser({ ...user, mustChangePassword: false });
          setOpen(false);
          router.refresh();
        },
        onError: (err) => toast.error(err.message || "Could not set your password. Try again."),
      },
    );
  }

  const inputClass = (hasError?: boolean) =>
    cn(
      "w-full px-4 py-2.5 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
      hasError && "border-danger/50 focus:ring-danger/20 focus:border-danger",
    );

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md glass-card rounded-xl p-6 z-[60] max-h-[90vh] overflow-y-auto"
          // Non-dismissible: block Esc, outside-click, and the auto-focus close.
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <Dialog.Title className="text-lg font-semibold text-text">Set your password</Dialog.Title>
          </div>
          <Dialog.Description className="text-sm text-text-muted mb-5">
            You signed in with a temporary password. Choose a new password to finish setting up your account.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  {...register("newPassword")}
                  className={cn(inputClass(Boolean(errors.newPassword)), "pr-11")}
                  placeholder="At least 8 characters"
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
              <label className="block text-sm font-medium text-text mb-2">Confirm new password</label>
              <input
                type={showPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className={inputClass(Boolean(errors.confirmPassword))}
                placeholder="Re-enter your new password"
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
              disabled={setInitialPassword.isPending}
              className="w-full px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {setInitialPassword.isPending ? "Saving..." : "Save password & continue"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
