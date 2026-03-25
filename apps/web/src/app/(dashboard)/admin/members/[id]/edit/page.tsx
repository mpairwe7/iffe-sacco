"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Save, UserCog, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema, type MemberInput } from "@/lib/schemas";
import { useMember, useUpdateMember } from "@/hooks/use-members";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: member, isLoading: memberLoading } = useMember(id);
  const updateMember = useUpdateMember();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberInput>({
    resolver: zodResolver(memberSchema) as any,
  });

  useEffect(() => {
    if (member) {
      reset({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        dateOfBirth: member.dateOfBirth || "",
        gender: member.gender || "",
        nationalId: member.nationalId || "",
        occupation: member.occupation || "",
        address: member.address || "",
        city: member.city || "",
        district: member.district || "",
        country: member.country || "UG",
        accountType: "",
      });
    }
  }, [member, reset]);

  async function onSubmit(data: MemberInput) {
    try {
      await updateMember.mutateAsync({
        id,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth || undefined,
          gender: data.gender || undefined,
          nationalId: data.nationalId || undefined,
          occupation: data.occupation || undefined,
          address: data.address || undefined,
          city: data.city || undefined,
          district: data.district || undefined,
          country: data.country,
        } as Parameters<typeof updateMember.mutateAsync>[0]["data"],
      });
      toast.success("Member updated");
      router.push("/admin/members");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member");
    }
  }

  if (memberLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 space-y-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/members" className="p-2 hover:bg-white rounded-xl border border-border">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Edit Member</h1>
            <p className="text-text-muted text-sm">
              Update details for {member?.firstName} {member?.lastName}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-2xl">
        {/* Personal Information */}
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-text mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">First Name *</label>
              <input
                type="text"
                {...register("firstName")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.firstName && <p className="text-xs text-danger mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Last Name *</label>
              <input
                type="text"
                {...register("lastName")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.lastName && <p className="text-xs text-danger mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Member ID</label>
              <input
                type="text"
                value={member?.memberId || ""}
                disabled
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm text-text-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Email *</label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Phone Number *</label>
              <input
                type="tel"
                {...register("phone")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Date of Birth</label>
              <input
                type="date"
                {...register("dateOfBirth")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Gender</label>
              <select
                {...register("gender")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">National ID</label>
              <input
                type="text"
                {...register("nationalId")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Occupation</label>
              <input
                type="text"
                {...register("occupation")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-text mb-4">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-text mb-2">Street Address</label>
              <input
                type="text"
                {...register("address")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">City</label>
              <input
                type="text"
                {...register("city")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">District</label>
              <input
                type="text"
                {...register("district")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Country</label>
              <select
                {...register("country")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="UG">Uganda</option>
                <option value="KE">Kenya</option>
                <option value="TZ">Tanzania</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6">
          <Link href="/admin/members" className="px-6 py-2.5 text-sm font-medium text-text-muted border border-border rounded-xl hover:bg-surface-alt">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || updateMember.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSubmitting || updateMember.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Update Member
          </button>
        </div>
      </form>
    </div>
  );
}
