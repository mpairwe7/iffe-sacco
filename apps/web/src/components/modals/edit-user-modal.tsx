"use client";

import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema } from "@iffe/shared";
import type { UpdateUserInput, User } from "@iffe/shared";
import { useUpdateUser } from "@/hooks/use-users";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function EditUserModal({ open, onOpenChange, user }: Props) {
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: "",
        role: user.role,
      });
    }
  }, [user, reset]);

  function onSubmit(data: UpdateUserInput) {
    if (!user) return;
    updateUser.mutate(
      { id: user.id, data },
      {
        onSuccess: () => {
          toast.success("User updated successfully");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update user");
        },
      },
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg glass-card rounded-xl p-6 z-50 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-text">Edit User</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 text-text-light hover:text-text rounded-lg" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Full Name</label>
              <input
                type="text"
                {...register("name")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.name && "border-danger/50 focus:ring-danger/20 focus:border-danger",
                )}
                placeholder="Full name"
              />
              {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Email</label>
              <input
                type="email"
                {...register("email")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.email && "border-danger/50 focus:ring-danger/20 focus:border-danger",
                )}
                placeholder="user@example.com"
              />
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Phone</label>
              <input
                type="tel"
                {...register("phone")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="+256 700 000 000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Role</label>
              <select
                {...register("role")}
                className={cn(
                  "w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  errors.role && "border-danger/50 focus:ring-danger/20 focus:border-danger",
                )}
              >
                <option value="member">Member</option>
                <option value="staff">Staff</option>
                <option value="chairman">Chairman</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="text-xs text-danger mt-1">{errors.role.message}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-5 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={updateUser.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {updateUser.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
