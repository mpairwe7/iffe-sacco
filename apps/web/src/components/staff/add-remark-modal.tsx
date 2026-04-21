"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Search, X } from "lucide-react";
import { useMembers, useUpdateMember } from "@/hooks/use-members";
import { cn } from "@/lib/utils";
import type { Member } from "@iffe/shared";

export function AddRemarkModal() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useMembers({ limit: 20, search: search.trim() || undefined });
  const updateMember = useUpdateMember();

  const options = useMemo(() => (data?.data ?? []) as Member[], [data]);

  function reset() {
    setSearch("");
    setSelected(null);
    setRemark("");
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
    const trimmed = remark.trim();
    if (trimmed.length === 0) {
      setError("Enter a remark to save.");
      return;
    }
    setError(null);
    try {
      const combined =
        selected.remarks && selected.remarks.trim().length > 0 ? `${selected.remarks.trim()}\n\n${trimmed}` : trimmed;
      await updateMember.mutateAsync({ id: selected.id, data: { remarks: combined } });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the remark. Try again.");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary border border-primary/40 rounded-lg hover:bg-primary/5"
        >
          <Plus className="w-4 h-4" />
          Add Remark
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white dark:bg-gray-950 rounded-xl shadow-xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-bold text-text">Add remark</Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted mt-1">
                Append a note to a member&apos;s profile. The member portal will display it read-only.
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
                htmlFor="remark-textarea"
                className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1"
              >
                Remark
              </label>
              <textarea
                id="remark-textarea"
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                rows={4}
                placeholder="Type the remark to record on this member's profile..."
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
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
              {updateMember.isPending ? "Saving..." : "Save remark"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
