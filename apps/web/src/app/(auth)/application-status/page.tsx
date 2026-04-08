"use client";

import Link from "next/link";
import { useMyApplication } from "@/hooks/use-applications";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import type { Application } from "@iffe/shared";

export default function ApplicationStatusPage() {
  const { data, isLoading, error, refetch } = useMyApplication();
  const application = data as Application | null | undefined;

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-8 shadow-xl">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <Skeleton className="h-6 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-8 shadow-xl text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">
          Failed to load status
        </h2>
        <p className="text-sm text-text-muted mb-6">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  // No application found
  if (!application) {
    return (
      <div className="glass-card rounded-xl p-8 shadow-xl text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">
          No Application Found
        </h2>
        <p className="text-sm text-text-muted mb-6">
          You have not submitted a membership application yet. Apply now to join
          IFFE SACCO.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
        >
          Apply Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-text text-center mb-2">
        Application Status
      </h2>
      <p className="text-text-muted text-center text-sm mb-8">
        Track your IFFE SACCO membership application
      </p>

      {/* Status Badge - Large and Centered */}
      <div className="flex flex-col items-center mb-8" aria-live="polite">
        {application.status === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <Loader2 className="w-10 h-10 text-warning animate-spin" />
            </div>
            <span className="inline-flex items-center px-6 py-2.5 rounded-full text-base font-semibold bg-warning/10 text-warning">
              <Clock className="w-5 h-5 mr-2" />
              Pending Review
            </span>
          </>
        )}

        {application.status === "approved" && (
          <>
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <span className="inline-flex items-center px-6 py-2.5 rounded-full text-base font-semibold bg-success/10 text-success">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Approved
            </span>
          </>
        )}

        {application.status === "rejected" && (
          <>
            <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-danger" />
            </div>
            <span className="inline-flex items-center px-6 py-2.5 rounded-full text-base font-semibold bg-danger/10 text-danger">
              <XCircle className="w-5 h-5 mr-2" />
              Rejected
            </span>
          </>
        )}
      </div>

      {/* Submitted date */}
      <div className="text-center mb-6">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
          Submitted
        </p>
        <p className="text-sm font-medium text-text">
          {formatDate(application.createdAt)}
        </p>
      </div>

      {/* Status-specific content */}
      {application.status === "pending" && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-6 text-center">
          <p className="text-sm text-text">
            Your application is currently being reviewed by the IFFE SACCO
            committee. You will be notified once a decision has been made.
          </p>
          <p className="text-xs text-text-muted mt-3">
            This process typically takes 3-5 business days.
          </p>
        </div>
      )}

      {application.status === "approved" && (
        <div className="space-y-4">
          <div className="bg-success/5 border border-success/20 rounded-xl p-6 text-center">
            <p className="text-sm text-text font-medium">
              Welcome to IFFE SACCO! Your membership is now active.
            </p>
            <p className="text-xs text-text-muted mt-2">
              You can now access all member services and benefits.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/portal/savings"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
            >
              Go to My Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {application.status === "rejected" && (
        <div className="space-y-4">
          {application.rejectionReason && (
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-6">
              <p className="text-xs text-danger font-semibold uppercase tracking-wider mb-2">
                Reason for Rejection
              </p>
              <p className="text-sm text-text">{application.rejectionReason}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-text-muted mb-4">
              You may submit a new application after addressing the issues
              above.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
            >
              Reapply <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Back to login link */}
      <p className="text-center text-sm text-text-muted mt-8">
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-dark"
        >
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
