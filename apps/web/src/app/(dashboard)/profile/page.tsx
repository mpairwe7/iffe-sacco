"use client";

import { User, Save, Camera, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useUpdateProfile, useMe } from "@/hooks/use-auth";
import { useEffect } from "react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number").optional(),
});
type ProfileInput = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const updateProfile = useUpdateProfile();
  const { data: meData } = useMe();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: "",
    },
  });

  // Pre-fill when user data is loaded
  useEffect(() => {
    if (meData) {
      reset({
        name: meData.name ?? "",
        email: meData.email ?? "",
        phone: "",
      });
    } else if (user) {
      reset({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: "",
      });
    }
  }, [meData, user, reset]);

  async function onSubmit(data: ProfileInput) {
    try {
      const updated = await updateProfile.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      setUser(updated);
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    }
  }

  const displayName = meData?.name ?? user?.name ?? "User";
  const displayRole = user?.role ?? "member";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Profile Settings</h1>
          <p className="text-text-muted text-sm">Update your account information</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-2xl">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {initials}
                </div>
                <button type="button" className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">{displayName}</h3>
                <p className="text-sm text-text-muted capitalize">{displayRole}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Full Name</label>
              <input
                type="text"
                {...register("name")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Email Address</label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Phone Number</label>
              <input
                type="tel"
                {...register("phone")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-border">
            <button
              type="submit"
              disabled={isSubmitting || updateProfile.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting || updateProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
