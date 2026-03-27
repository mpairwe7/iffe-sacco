"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  useApplication,
  useApproveApplication,
  useRejectApplication,
} from "@/hooks/use-applications";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  Check,
  X,
  ExternalLink,
  User,
  MapPin,
  Briefcase,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Application } from "@iffe/shared";

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm text-text mt-0.5">{value || "\u2014"}</p>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const id = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <section aria-labelledby={id} className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 id={id} className="text-base font-semibold text-text">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function JsonTable({
  data,
  columns,
}: {
  data: Record<string, unknown>[];
  columns: { key: string; label: string }[];
}) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-text-muted">None recorded</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-2"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/20 hover:bg-surface-hover/30"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-sm text-text">
                  {String(row[col.key] ?? "\u2014")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useApplication(id);
  const approveMutation = useApproveApplication();
  const rejectMutation = useRejectApplication();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const app = data as Application | undefined;

  function handleApprove() {
    approveMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Application approved successfully");
        router.push("/admin/applications");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to approve application");
      },
    });
  }

  function handleReject() {
    rejectMutation.mutate(
      { id, reason: rejectReason || undefined },
      {
        onSuccess: () => {
          toast.success("Application rejected");
          router.push("/admin/applications");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to reject application");
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-text-muted">Application not found.</p>
        <Link
          href="/admin/applications"
          className="text-primary font-medium hover:underline mt-2 inline-block"
        >
          Back to Applications
        </Link>
      </div>
    );
  }

  const statusLabel =
    app.status.charAt(0).toUpperCase() + app.status.slice(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/applications"
            className="p-2.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">{app.fullName}</h1>
            <p className="text-text-muted text-sm">
              Application submitted {formatDate(app.createdAt)}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
            app.status === "approved"
              ? "bg-success/15 text-success"
              : app.status === "rejected"
                ? "bg-danger/15 text-danger"
                : "bg-warning/15 text-warning"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Information */}
        <SectionCard title="General Information" icon={User}>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Full Name" value={app.fullName} />
            <InfoField
              label="Date of Birth"
              value={app.dateOfBirth ? formatDate(app.dateOfBirth) : null}
            />
            <InfoField label="Sex" value={app.sex} />
            <InfoField label="Phone" value={app.phone} />
            <InfoField label="Email" value={app.email} />
            <InfoField label="Clan" value={app.clan} />
            <InfoField label="Totem" value={app.totem} />
          </div>
        </SectionCard>

        {/* Place of Birth */}
        <SectionCard title="Place of Birth" icon={MapPin}>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="District" value={app.birthDistrict} />
            <InfoField label="County" value={app.birthCounty} />
            <InfoField label="Sub-County" value={app.birthSubCounty} />
            <InfoField label="Parish" value={app.birthParish} />
            <InfoField label="Village" value={app.birthVillage} />
          </div>
        </SectionCard>

        {/* Ancestral Origin */}
        <SectionCard title="Ancestral Origin" icon={MapPin}>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="District" value={app.ancestralDistrict} />
            <InfoField label="County" value={app.ancestralCounty} />
            <InfoField label="Sub-County" value={app.ancestralSubCounty} />
            <InfoField label="Parish" value={app.ancestralParish} />
            <InfoField label="Village" value={app.ancestralVillage} />
          </div>
        </SectionCard>

        {/* Residence */}
        <SectionCard title="Residence" icon={MapPin}>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="District" value={app.residenceDistrict} />
            <InfoField label="County" value={app.residenceCounty} />
            <InfoField label="Sub-County" value={app.residenceSubCounty} />
            <InfoField label="Parish" value={app.residenceParish} />
            <InfoField label="Village" value={app.residenceVillage} />
          </div>
        </SectionCard>

        {/* Work & Education */}
        <SectionCard title="Work & Education" icon={Briefcase}>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Occupation" value={app.occupation} />
            <InfoField label="Place of Work" value={app.placeOfWork} />
            <InfoField
              label="Qualifications"
              value={app.qualifications}
            />
          </div>
        </SectionCard>

        {/* Father Info */}
        <SectionCard title="Father Information" icon={User}>
          {app.fatherInfo ? (
            <div className="grid grid-cols-2 gap-4">
              <InfoField
                label="Name"
                value={String(app.fatherInfo.name ?? "")}
              />
              <InfoField
                label="Clan"
                value={String(app.fatherInfo.clan ?? "")}
              />
              <InfoField
                label="Totem"
                value={String(app.fatherInfo.totem ?? "")}
              />
              <InfoField
                label="Origin"
                value={String(app.fatherInfo.origin ?? "")}
              />
            </div>
          ) : (
            <p className="text-sm text-text-muted">No information provided</p>
          )}
        </SectionCard>

        {/* Mother Info */}
        <SectionCard title="Mother Information" icon={User}>
          {app.motherInfo ? (
            <div className="grid grid-cols-2 gap-4">
              <InfoField
                label="Name"
                value={String(app.motherInfo.name ?? "")}
              />
              <InfoField
                label="Clan"
                value={String(app.motherInfo.clan ?? "")}
              />
              <InfoField
                label="Totem"
                value={String(app.motherInfo.totem ?? "")}
              />
              <InfoField
                label="Origin"
                value={String(app.motherInfo.origin ?? "")}
              />
            </div>
          ) : (
            <p className="text-sm text-text-muted">No information provided</p>
          )}
        </SectionCard>

        {/* Application Letter */}
        <SectionCard title="Application Letter" icon={FileText}>
          {app.applicationLetterUrl ? (
            <a
              href={app.applicationLetterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {app.applicationLetterName || "View Application Letter"}
            </a>
          ) : (
            <p className="text-sm text-text-muted">
              No application letter uploaded
            </p>
          )}
        </SectionCard>
      </div>

      {/* Spouses Table */}
      {app.spouses && app.spouses.length > 0 && (
        <SectionCard title="Spouses" icon={Users}>
          <JsonTable
            data={app.spouses}
            columns={[
              { key: "name", label: "Name" },
              { key: "clan", label: "Clan" },
              { key: "totem", label: "Totem" },
              { key: "origin", label: "Origin" },
            ]}
          />
        </SectionCard>
      )}

      {/* Children Table */}
      {app.children && app.children.length > 0 && (
        <SectionCard title="Children" icon={Users}>
          <JsonTable
            data={app.children}
            columns={[
              { key: "name", label: "Name" },
              { key: "sex", label: "Sex" },
              { key: "dateOfBirth", label: "Date of Birth" },
            ]}
          />
        </SectionCard>
      )}

      {/* Other Relatives Table */}
      {app.otherRelatives && app.otherRelatives.length > 0 && (
        <SectionCard title="Other Relatives" icon={Users}>
          <JsonTable
            data={app.otherRelatives}
            columns={[
              { key: "name", label: "Name" },
              { key: "relationship", label: "Relationship" },
              { key: "contact", label: "Contact" },
            ]}
          />
        </SectionCard>
      )}

      {/* Rejection Reason (if rejected) */}
      {app.status === "rejected" && app.rejectionReason && (
        <div className="glass-card rounded-xl p-6 border-l-4 border-danger">
          <h3 className="text-base font-semibold text-danger mb-2">
            Rejection Reason
          </h3>
          <p className="text-sm text-text">{app.rejectionReason}</p>
          {app.reviewedAt && (
            <p className="text-xs text-text-muted mt-2">
              Reviewed on {formatDate(app.reviewedAt)}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons (only for pending) */}
      {app.status === "pending" && (
        <div className="sticky bottom-0 bg-surface/80 backdrop-blur-lg border-t border-border/50 p-4 -mx-4 mt-6 flex gap-3 justify-end">
          <button
            onClick={() => {
              setRejectReason("");
              setRejectOpen(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-danger border border-danger/30 rounded-lg hover:bg-danger/15 transition-colors"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={() => setApproveOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-success to-emerald-600 rounded-lg hover:shadow-lg hover:shadow-success/20 transition-all"
          >
            <Check className="w-4 h-4" />
            Approve
          </button>
        </div>
      )}

      {/* Approve Dialog */}
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Application"
        description="Are you sure you want to approve this membership application? The applicant will become a registered SACCO member."
        confirmLabel="Approve"
        onConfirm={handleApprove}
        variant="default"
        loading={approveMutation.isPending}
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) setRejectReason("");
        }}
        title="Reject Application"
        description=""
        confirmLabel="Reject"
        onConfirm={handleReject}
        variant="destructive"
        loading={rejectMutation.isPending}
      >
        <div className="mt-2 space-y-3">
          <p className="text-sm text-text-muted">
            Are you sure you want to reject this application? Please provide a
            reason below.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            rows={3}
            className="w-full px-4 py-3 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
