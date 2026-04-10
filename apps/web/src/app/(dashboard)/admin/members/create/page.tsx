"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Save, UserPlus, Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberCreateSchema, type MemberCreateInput } from "@/lib/schemas";
import { useCreateMember } from "@/hooks/use-members";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export default function CreateMemberPage() {
  const router = useRouter();
  const userRole = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (userRole && userRole !== "admin") {
      toast.error("Only administrators can add members directly");
      router.replace("/admin/members");
    }
  }, [userRole, router]);
  const createMember = useCreateMember();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberCreateInput>({
    resolver: zodResolver(memberCreateSchema) as Resolver<MemberCreateInput>,
    defaultValues: {
      country: "UG",
      accountType: "savings",
      shareCount: 0,
      weddingSupportStatus: "not_received",
      weddingSupportDebt: 0,
      condolenceSupportStatus: "not_received",
      condolenceSupportDebt: 0,
    },
  });

  async function onSubmit(data: MemberCreateInput) {
    try {
      await createMember.mutateAsync(data as Parameters<typeof createMember.mutateAsync>[0]);
      toast.success("Member created");
      router.push("/admin/members");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create member");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/members" className="p-2 hover:bg-white rounded-lg border border-border">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add New Member</h1>
            <p className="text-text-muted text-sm">Register a new SACCO member</p>
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
                placeholder="Auto-generated"
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

        {/* Account Settings */}
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-text mb-4">Account Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Account Type *</label>
              <select
                {...register("accountType")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
                <option value="fixed_deposit">Fixed Deposit</option>
              </select>
              {errors.accountType && <p className="text-xs text-danger mt-1">{errors.accountType.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Initial Deposit</label>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                {...register("initialDeposit", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
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
          </div>
        </div>

        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-text mb-4">Community Support</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Wedding Support</label>
              <select
                {...register("weddingSupportStatus")}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="requested">Requested</option>
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
                <option value="requested">Requested</option>
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
              placeholder="Add context about subscriptions, welfare follow-up, or any member notes."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6">
          <Link
            href="/admin/members"
            className="px-6 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-surface-alt"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || createMember.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSubmitting || createMember.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Member
          </button>
        </div>
      </form>
    </div>
  );
}
