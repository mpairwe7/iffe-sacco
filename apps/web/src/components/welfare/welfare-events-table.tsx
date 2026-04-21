"use client";

import { useMemo, useState } from "react";
import { Calendar, Eye, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { WelfareKpiStrip, type WelfareKpiData } from "@/components/welfare/welfare-kpi-strip";
import type { WelfareKind } from "@/components/welfare/welfare-tabs";
import { useMembers } from "@/hooks/use-members";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { EXPECTED_WELFARE_AMOUNT } from "@iffe/shared";
import type { Member, MemberSupportStatus } from "@iffe/shared";

type StatusFilter = "all" | "received" | "pending";

interface WelfareEvent {
  member: Member;
  status: MemberSupportStatus;
  expected: number;
  received: number;
  pending: number;
  eventDate: string;
}

interface WelfareEventsTableProps {
  kind: WelfareKind;
  showActions?: boolean;
  onView?: (event: WelfareEvent) => void;
}

const PAGE_SIZE = 7;

function getInitials(member: Member) {
  const first = member.firstName?.[0] ?? "";
  const last = member.lastName?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function buildEvent(member: Member, kind: WelfareKind): WelfareEvent | null {
  const statusField = kind === "wedding" ? "weddingSupportStatus" : "condolenceSupportStatus";
  const debtField = kind === "wedding" ? "weddingSupportDebt" : "condolenceSupportDebt";
  const dateField = kind === "wedding" ? "weddingEventDate" : "condolenceEventDate";
  const status = member[statusField];
  if (status === "not_received") return null;

  const debt = Math.max(0, Number(member[debtField] ?? 0));
  const expected = EXPECTED_WELFARE_AMOUNT;
  const received = Math.max(0, Math.min(expected, expected - debt));
  const pending = Math.max(0, expected - received);

  // Prefer the dedicated event date; fall back to member.updatedAt for
  // legacy rows created before the event-date columns existed.
  const eventDate = member[dateField] || member.updatedAt;

  return {
    member,
    status,
    expected,
    received,
    pending,
    eventDate,
  };
}

function computeKpis(events: WelfareEvent[]): WelfareKpiData {
  const received = events.filter((e) => e.status === "received").length;
  const pending = events.filter((e) => e.status === "requested").length;
  const totalCollected = events.reduce((sum, e) => sum + e.received, 0);
  const totalPending = events.reduce((sum, e) => sum + e.pending, 0);
  return {
    totalEvents: events.length,
    received,
    pending,
    totalCollected,
    totalPending,
  };
}

export function WelfareEventsTable({ kind, showActions = false, onView }: WelfareEventsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useMembers({ limit: 500 });
  const allMembers = useMemo(() => (data?.data ?? []) as Member[], [data]);
  const membersTotal = data?.total ?? allMembers.length;
  const capped = membersTotal > allMembers.length;

  const allEvents = useMemo(() => {
    return allMembers.flatMap((member) => {
      const event = buildEvent(member, kind);
      return event ? [event] : [];
    });
  }, [allMembers, kind]);

  const kpis = useMemo(() => computeKpis(allEvents), [allEvents]);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allEvents.filter((event) => {
      if (statusFilter === "received" && event.status !== "received") return false;
      if (statusFilter === "pending" && event.status !== "requested") return false;
      if (!term) return true;
      const name = `${event.member.firstName} ${event.member.lastName}`.toLowerCase();
      return name.includes(term) || event.member.memberId.toLowerCase().includes(term);
    });
  }, [allEvents, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * PAGE_SIZE;
  const pageRows = filteredEvents.slice(pageStart, pageStart + PAGE_SIZE);
  const pageEnd = pageStart + pageRows.length;

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-12 text-center">
        <p className="text-text-muted">
          {error instanceof Error ? error.message : "Welfare events could not be loaded."}
        </p>
        <button type="button" onClick={() => refetch()} className="text-primary font-medium hover:underline mt-3">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WelfareKpiStrip kind={kind} data={kpis} loading={isLoading} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by member name..."
            aria-label="Search welfare events by member"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Status filter</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
            className="px-3 py-2.5 text-sm border border-border rounded-lg bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="received">Received</option>
            <option value="pending">Pending</option>
          </select>
        </label>
        {capped && (
          <span className="text-xs text-text-muted">
            Sampled from {allMembers.length} of {membersTotal} members
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary text-white">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Member</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Event Date</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider">Expected Amount</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider">Received Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Status</th>
                {showActions && (
                  <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={showActions ? 7 : 6} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 7 : 6} className="px-4 py-10">
                    <EmptyState
                      variant="inline"
                      title={`No ${kind === "wedding" ? "wedding" : "condolence"} events`}
                      description={
                        search || statusFilter !== "all"
                          ? "Try clearing your filters."
                          : "Events will appear here once recorded."
                      }
                    />
                  </td>
                </tr>
              ) : (
                pageRows.map((event, index) => {
                  const rowNumber = pageStart + index + 1;
                  const fullName = `${event.member.firstName} ${event.member.lastName}`;
                  return (
                    <tr key={event.member.id} className="hover:bg-surface-alt/40">
                      <td className="px-4 py-3 text-text-muted tabular-nums">{rowNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(event.member)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text truncate">{fullName}</p>
                            <p className="text-xs text-text-muted">{event.member.memberId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          {formatDate(event.eventDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-text tabular-nums">
                        {formatCurrency(event.expected)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        <span className={event.received >= event.expected ? "text-success" : "text-text"}>
                          {formatCurrency(event.received)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                            event.status === "received" ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                          )}
                        >
                          {event.status === "received" ? "Received" : "Pending"}
                        </span>
                      </td>
                      {showActions && (
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => onView?.(event)}
                            aria-label={`View welfare event for ${fullName}`}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredEvents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
            <p className="text-xs text-text-muted">
              Showing {pageStart + 1} to {pageEnd} of {filteredEvents.length} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={clampedPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-alt/60"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const p = index + 1;
                const active = p === clampedPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "w-8 h-8 text-sm font-semibold rounded-lg",
                      active ? "bg-primary text-white" : "text-text hover:bg-surface-alt/60",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={clampedPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-alt/60"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { WelfareEvent };
