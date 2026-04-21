"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Search, X } from "lucide-react";
import { useMembers, useUpdateMember } from "@/hooks/use-members";
import { cn, formatCurrency } from "@/lib/utils";
import type { WelfareKind } from "@/components/welfare/welfare-tabs";
import { EXPECTED_WELFARE_AMOUNT } from "@iffe/shared";
import type { Member } from "@iffe/shared";

interface AddWelfareEventModalProps {
  defaultKind: WelfareKind;
}

function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AddWelfareEventModal({ defaultKind }: AddWelfareEventModalProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<WelfareKind>(defaultKind);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [eventDate, setEventDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useMembers({ limit: 20, search: search.trim() || undefined });
  const updateMember = useUpdateMember();

  const options = useMemo(() => (data?.data ?? []) as Member[], [data]);

  function reset() {
    setKind(defaultKind);
    setSearch("");
    setSelected(null);
    setEventDate(todayIso());
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (updateMember.isPending) return;
    setOpen(next);
    if (!next) reset();
  }

  async function handleSave() {
    if (!selected) {
      setError("Select a member first.");
      return;
    }
    if (!eventDate) {
      setError("Choose an event date.");
      return;
    }
    setError(null);
    try {
      const isoDate = new Date(`${eventDate}T00:00:00`).toISOString();
      const payload =
        kind === "wedding"
          ? {
              weddingSupportStatus: "requested" as const,
              weddingSupportDebt: EXPECTED_WELFARE_AMOUNT,
              weddingEventDate: isoDate,
            }
          : {
              condolenceSupportStatus: "requested" as const,
              condolenceSupportDebt: EXPECTED_WELFARE_AMOUNT,
              condolenceEventDate: isoDate,
            };
      await updateMember.mutateAsync({ id: selected.id, data: payload });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the event. Try again.");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-success rounded-lg hover:bg-success/90 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Event
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white dark:bg-gray-950 rounded-xl shadow-xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-bold text-text">Add welfare event</Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted mt-1">
                Record a new wedding or condolence event against a member&apos;s profile. Expected amount is fixed at{" "}
                {formatCurrency(EXPECTED_WELFARE_AMOUNT)}.
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

          <div className="mt-5 space-y-4">
            <fieldset>
              <legend className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Event type
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {(["wedding", "condolence"] as const).map((option) => {
                  const active = kind === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setKind(option)}
                      className={cn(
                        "px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-text hover:bg-surface-alt/60",
                      )}
                    >
                      {option === "wedding" ? "Wedding" : "Condolence"}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Member
              </label>
              {selected ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-surface-alt/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {selected.firstName} {selected.lastName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {selected.memberId} · {selected.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search
                      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name, member ID, or phone..."
                      aria-label="Search members"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border">
                    {isLoading ? (
                      <p className="px-3 py-3 text-xs text-text-muted">Searching...</p>
                    ) : options.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-text-muted">
                        {search ? "No members found." : "Start typing to search members."}
                      </p>
                    ) : (
                      options.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setSelected(member)}
                          className="w-full text-left px-3 py-2 hover:bg-surface-alt/60"
                        >
                          <p className="text-sm font-semibold text-text">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-text-muted">
                            {member.memberId} · {member.phone}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="event-date-input"
                className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1"
              >
                Event date
              </label>
              <input
                id="event-date-input"
                type="date"
                value={eventDate}
                onChange={(ev) => setEventDate(ev.target.value)}
                max={todayIso()}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="rounded-lg border border-border bg-surface-alt/30 px-4 py-3 text-sm text-text-muted">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Expected amount</p>
              <p className="text-base font-bold text-text mt-1 tabular-nums">
                {formatCurrency(EXPECTED_WELFARE_AMOUNT)}
              </p>
              <p className="text-xs mt-1">
                Fixed by policy. Record received payments via the event&apos;s view action.
              </p>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

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
              onClick={handleSave}
              disabled={updateMember.isPending}
              className={cn(
                "w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark",
                updateMember.isPending && "opacity-60",
              )}
            >
              {updateMember.isPending ? "Saving..." : "Create event"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
