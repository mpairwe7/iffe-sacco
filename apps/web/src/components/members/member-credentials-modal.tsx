"use client";

import { useState } from "react";
import { KeyRound, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { MemberLoginCredentials } from "@iffe/shared";

/** Read-only value with a copy-to-clipboard button. */
export function CopyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — select and copy manually.");
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <code
          className={`flex-1 px-3 py-2 rounded-lg bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-sm text-text break-all ${
            mono ? "font-mono tracking-wide" : ""
          }`}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:text-primary hover:bg-primary/10"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/**
 * One-time display of a member's login email + temporary password — shown to
 * staff right after creating a member or re-issuing their password. The
 * plaintext password is never persisted and never shown again.
 */
export function MemberCredentialsModal({
  credentials,
  title = "Member created",
  description,
  onClose,
  secondaryAction,
}: {
  credentials: MemberLoginCredentials;
  title?: string;
  description?: React.ReactNode;
  onClose: () => void;
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-success" />
          </div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
        </div>
        <p className="text-sm text-text-muted mb-5">
          {description ?? (
            <>
              Give these one-time login details to the member. They&apos;ll be asked to set their own password the first
              time they sign in. <strong>This temporary password won&apos;t be shown again.</strong>
            </>
          )}
        </p>

        <div className="space-y-3">
          <CopyField label="Login email" value={credentials.email} />
          <CopyField label="Temporary password" value={credentials.tempPassword} mono />
        </div>

        <div className="flex items-center justify-end gap-3 pt-6">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-surface-alt"
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
