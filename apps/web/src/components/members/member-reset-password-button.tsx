"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { MemberLoginCredentials } from "@iffe/shared";
import { useReissueCredentials } from "@/hooks/use-members";
import { useAuthStore } from "@/stores/auth-store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MemberCredentialsModal } from "@/components/members/member-credentials-modal";

/**
 * Admin/staff action to re-issue a member's one-time password (lockout
 * recovery — e.g. the member lost their temporary password). Confirms first
 * (it signs the member out of active sessions), then shows the new temporary
 * password once for staff to relay; it is also emailed to the member.
 */
export function MemberResetPasswordButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const reissue = useReissueCredentials();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [credentials, setCredentials] = useState<MemberLoginCredentials | null>(null);

  // Only admin/staff can re-issue (matches the API guard); hide it for others.
  if (role !== "admin" && role !== "staff") return null;

  function handleConfirm() {
    reissue.mutate(memberId, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        setCredentials(result.credentials);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Could not reset the password"),
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text border border-border rounded-lg hover:bg-surface-hover"
      >
        <KeyRound className="w-4 h-4" />
        Reset password
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reset this member's password?"
        description={`A new one-time password will be issued for ${memberName}. This signs them out of any active sessions, and they'll set a new password the next time they sign in.`}
        confirmLabel="Issue new password"
        onConfirm={handleConfirm}
        loading={reissue.isPending}
      />

      {credentials && (
        <MemberCredentialsModal
          credentials={credentials}
          title="New temporary password"
          description={
            <>
              Give these one-time login details to {memberName}. They&apos;ll set their own password on the next
              sign-in. <strong>This password won&apos;t be shown again.</strong>
            </>
          }
          onClose={() => setCredentials(null)}
        />
      )}
    </>
  );
}
