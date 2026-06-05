"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPageWindow } from "@/lib/pagination";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  /** When provided, renders the rows-per-page selector. */
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  /** Show the "go to page" input once paging is windowed (default true). */
  showJump?: boolean;
}

const ICON_BTN =
  "p-2.5 rounded-lg hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed text-text-muted";

/**
 * The single pagination control used by every paginated table (DataTable, welfare
 * events, …) so navigation looks and behaves the same app-wide. Provides a range
 * readout (announced to screen readers), an optional rows-per-page selector,
 * First/Prev/Next/Last, a bounded page-number window, and a jump-to-page input
 * for large page counts.
 */
export function Pagination({
  page,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 25, 50],
  showJump = true,
}: PaginationProps) {
  const [jump, setJump] = useState("");

  const pages = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), pages);
  const start = totalItems === 0 ? 0 : (current - 1) * perPage + 1;
  const end = Math.min(current * perPage, totalItems);
  const atFirst = current <= 1;
  const atLast = current >= pages;

  function go(next: number) {
    const target = Math.min(Math.max(1, next), pages);
    if (target !== current) onPageChange(target);
  }

  function submitJump(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(jump);
    if (Number.isFinite(n) && n >= 1) {
      go(Math.floor(n));
      setJump("");
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 lg:px-6 py-4 border-t border-border/50">
      <div className="flex items-center gap-3 text-sm text-text-muted">
        {/* aria-live so screen-reader users hear the range change on navigation. */}
        <span aria-live="polite">
          Showing {start}-{end} of {totalItems}
        </span>
        {onPerPageChange && (
          <select
            aria-label="Rows per page"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1">
        <button onClick={() => go(1)} disabled={atFirst} className={ICON_BTN} aria-label="First page">
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button onClick={() => go(current - 1)} disabled={atFirst} className={ICON_BTN} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageWindow(current, pages).map((p) => (
          <button
            key={p}
            onClick={() => go(p)}
            aria-label={`Page ${p}`}
            aria-current={p === current ? "page" : undefined}
            className={cn(
              "w-10 h-10 rounded-lg text-sm font-medium",
              p === current ? "bg-primary text-white" : "hover:bg-surface-hover text-text-muted",
            )}
          >
            {p}
          </button>
        ))}

        <button onClick={() => go(current + 1)} disabled={atLast} className={ICON_BTN} aria-label="Next page">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => go(pages)} disabled={atLast} className={ICON_BTN} aria-label="Last page">
          <ChevronsRight className="w-4 h-4" />
        </button>

        {showJump && pages > 7 && (
          <form onSubmit={submitJump} className="flex items-center ml-1">
            <input
              type="number"
              min={1}
              max={pages}
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              placeholder="Go to"
              aria-label="Go to page"
              className="w-20 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </form>
        )}
      </div>
    </div>
  );
}
