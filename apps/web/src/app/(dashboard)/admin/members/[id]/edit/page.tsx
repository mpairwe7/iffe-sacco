"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Save, UserCog, Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberUpdateSchema, type MemberUpdateFormInput } from "@/lib/schemas";
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
  } = useForm<MemberUpdateFormInput>({
    resolver: zodResolver(memberUpdateSchema) as Resolver<MemberUpdateFormInput>,
    defaultValues: {
      country: "UG",
      shareCount: 0,
      weddingSupportStatus: "not_received",
      weddingSupportDebt: 0,
      condolenceSupportStatus: "not_received",
      condolenceSupportDebt: 0,
    },
  });

  useEffect(() => {
    if (member) {
      reset({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split("T")[0] : "",
        gender: member.gender || "",
        nationalId: member.nationalId || "",
        occupation: member.occupation || "",
        address: member.address || "",
        city: member.city || "",
        district: member.district || "",
        country: member.country || "UG",
        shareCount: member.shareCount ?? 0,
        weddingSupportStatus: member.weddingSupportStatus ?? "not_received",
        weddingSupportDebt: member.weddingSupportDebt ?? 0,
        condolenceSupportStatus: member.condolenceSupportStatus ?? "not_received",
        condolenceSupportDebt: member.condolenceSupportDebt ?? 0,
        remarks: member.remarks || "",
      });
    }
  }, [member, reset]);

  async function onSubmit(data: MemberUpdateFormInput) {
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
          shareCount: data.shareCount ?? 0,
          weddingSupportStatus: data.weddingSupportStatus,
          weddingSupportDebt: data.weddingSupportDebt ?? 0,
          condolenceSupportStatus: data.condolenceSupportStatus,
          condolenceSupportDebt: data.condolenceSupportDebt ?? 0,
          remarks: data.remarks || undefined,
          country: data.country,
        } as Parameters<typeof updateMember.mutateAsync>[0]["data"],
      });
      toast.success("Member updated");
      router.push(`/admin/members/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member");
    }
  }

  if (memberLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6 space-y-6">
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
        <Link href={`/admin/members/${id}`} className="p-2 hover:bg-white rounded-lg border border-border">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Member</h1>
            <p className="text-text-muted text-sm">
              Update details for {member?.firstName} {member?.lastName}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl"
      >
        {/* Personal Information */}
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-text mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">First Name *</label>
              <input
                type="text"
                {...register("firstName")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.firstName && <p className="text-xs text-danger mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Last Name *</label>
              <input
                type="text"
                {...register("lastName")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.lastName && <p className="text-xs text-danger mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Member ID</label>
              <input
                type="text"
                value={member?.memberId || ""}
                disabled
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm text-text-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Email *</label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Phone Number *</label>
              <input
                type="tel"
                {...register("phone")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Date of Birth</label>
              <input
                type="date"
                {...register("dateOfBirth")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Gender</label>
              <select
                {...register("gender")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Occupation</label>
              <input
                type="text"
                {...register("occupation")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">City</label>
              <input
                type="text"
                {...register("city")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">District</label>
              <input
                type="text"
                {...register("district")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Country</label>
              <select
                {...register("country")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="UG">Uganda</option>
                <option value="KE">Kenya</option>
                <option value="TZ">Tanzania</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-text mb-4">Member Dashboard Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">No. of Shares</label>
              <input
                type="number"
                min="0"
                {...register("shareCount", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.shareCount && <p className="text-xs text-danger mt-1">{errors.shareCount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Wedding Support</label>
              <select
                {...register("weddingSupportStatus")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="requested">Pending</option>
                <option value="not_received">Not Received</option>
                <option value="received">Received</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Wedding Debt</label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("weddingSupportDebt", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.weddingSupportDebt && (
                <p className="text-xs text-danger mt-1">{errors.weddingSupportDebt.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Condolence Support</label>
              <select
                {...register("condolenceSupportStatus")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="requested">Pending</option>
                <option value="not_received">Not Received</option>
                <option value="received">Received</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Condolence Debt</label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("condolenceSupportDebt", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.condolenceSupportDebt && (
                <p className="text-xs text-danger mt-1">{errors.condolenceSupportDebt.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-text mb-4">Remarks</h3>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Member Remarks</label>
            <textarea
              rows={4}
              {...register("remarks")}
              className="w-full px-4 py-3 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              placeholder="Add any notes that should remain visible on the member dashboard."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6">
          <Link
            href={`/admin/members/${id}`}
            className="px-6 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-surface-alt"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || updateMember.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
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
