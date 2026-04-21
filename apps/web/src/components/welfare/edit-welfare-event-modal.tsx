"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useUpdateMember } from "@/hooks/use-members";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { WelfareKind } from "@/components/welfare/welfare-tabs";
import type { WelfareEvent } from "@/components/welfare/welfare-events-table";
import { EXPECTED_WELFARE_AMOUNT } from "@iffe/shared";

interface EditWelfareEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: WelfareKind;
  event: WelfareEvent | null;
}

export function EditWelfareEventModal({ open, onOpenChange, kind, event }: EditWelfareEventModalProps) {
  const eventKey = event ? `${event.member.id}-${event.received}` : "";
  const [receivedInput, setReceivedInput] = useState(() => (event ? String(event.received) : ""));
  const [error, setError] = useState<string | null>(null);
  const [lastEventKey, setLastEventKey] = useState(eventKey);
  const updateMember = useUpdateMember();

  if (eventKey !== lastEventKey) {
    setLastEventKey(eventKey);
    setReceivedInput(event ? String(event.received) : "");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (updateMember.isPending) return;
    onOpenChange(next);
  }

  async function handleSave() {
    if (!event) return;
    const parsed = Number(receivedInput);
    if (Number.isNaN(parsed) || parsed < 0) {
      setError("Enter a valid amount (0 or more).");
      return;
    }
    if (parsed > event.expected) {
      setError(`Received amount cannot exceed the expected ${formatCurrency(event.expected)}.`);
      return;
    }
    setError(null);
    const debt = Math.max(0, event.expected - parsed);
    const status = debt === 0 ? ("received" as const) : ("requested" as const);
    try {
      const payload =
        kind === "wedding"
          ? { weddingSupportStatus: status, weddingSupportDebt: debt }
          : { condolenceSupportStatus: status, condolenceSupportDebt: debt };
      await updateMember.mutateAsync({ id: event.member.id, data: payload });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the event. Try again.");
    }
  }

  async function handleMarkReceived() {
    if (!event) return;
    setError(null);
    try {
      const payload =
        kind === "wedding"
          ? { weddingSupportStatus: "received" as const, weddingSupportDebt: 0 }
          : { condolenceSupportStatus: "received" as const, condolenceSupportDebt: 0 };
      await updateMember.mutateAsync({ id: event.member.id, data: payload });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the event. Try again.");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white dark:bg-gray-950 rounded-xl shadow-xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-bold text-text">
                {kind === "wedding" ? "Wedding" : "Condolence"} event details
              </Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted mt-1">
                Update the received amount as the member makes payments.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                disabled={updateMember.isPending}
                className="p-2 text-text-light hover:text-text rounded-lg disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {event && (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-border bg-surface-alt/40 px-4 py-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Member</p>
                <p className="text-sm font-bold text-text mt-0.5">
                  {event.member.firstName} {event.member.lastName}
                </p>
                <p className="text-xs text-text-muted">
                  {event.member.memberId} · {event.member.phone}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Event date: <span className="font-semibold text-text">{formatDate(event.eventDate)}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border px-4 py-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Expected</p>
                  <p className="text-base font-bold text-text mt-0.5 tabular-nums">{formatCurrency(event.expected)}</p>
                </div>
                <div className="rounded-lg border border-border px-4 py-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Outstanding</p>
                  <p
                    className={cn(
                      "text-base font-bold mt-0.5 tabular-nums",
                      event.pending > 0 ? "text-danger" : "text-success",
                    )}
                  >
                    {formatCurrency(event.pending)}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="received-input"
                  className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1"
                >
                  Received amount (UGX)
                </label>
                <input
                  id="received-input"
                  type="number"
                  min={0}
                  max={event.expected}
                  step={1000}
                  value={receivedInput}
                  onChange={(ev) => setReceivedInput(ev.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary tabular-nums"
                />
                <p className="text-xs text-text-muted mt-1">
                  Status flips to Received automatically once this equals the expected{" "}
                  {formatCurrency(EXPECTED_WELFARE_AMOUNT)}.
                </p>
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <button
                disabled={updateMember.isPending}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-border rounded-lg hover:bg-surface-hover disabled:opacity-50"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleMarkReceived}
              disabled={updateMember.isPending || !event || event.status === "received"}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-success border border-success/40 rounded-lg hover:bg-success/5 disabled:opacity-40"
            >
              Mark as Received
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMember.isPending || !event}
              className={cn(
                "w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark",
                updateMember.isPending && "opacity-60",
              )}
            >
              {updateMember.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
