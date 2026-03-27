"use client";

import { useState, useMemo } from "react";
import { Search, Download, Plus, ChevronLeft, ChevronRight, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, AlertTriangle, RefreshCw, Inbox } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  hiddenOnMobile?: boolean;
}

interface DataTableProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  addHref?: string;
  addLabel?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyAction?: { label: string; href: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportToCSV<T extends Record<string, any>>(data: T[], columns: Column<T>[], filename: string) {
  const header = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      const str = typeof val === "object" && val !== null
        ? JSON.stringify(val)
        : String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  title,
  description,
  columns,
  data,
  addHref,
  addLabel = "Add New",
  searchPlaceholder = "Search...",
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = "No data found",
  emptyAction,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() =>
    data.filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase())
      )
    ), [data, search]
  );

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice((page - 1) * perPage, page * perPage);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div className="space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-48" /></div>
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-2 py-4 border-t border-border/20">
              {Array.from({ length: columns.length }).map((_, c) => (
                <Skeleton key={c} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <div className="w-14 h-14 rounded-xl bg-danger/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-danger" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-1">Failed to load data</h3>
        <p className="text-sm text-text-muted mb-4">{error.message}</p>
        {onRetry && (
          <button onClick={onRetry} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6 border-b border-border/50">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2.5 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-48 lg:w-64"
            />
          </div>
          <button
            onClick={() => exportToCSV(filtered, columns, title.toLowerCase().replace(/\s+/g, "-"))}
            className="p-2.5 text-text-muted hover:text-text border border-border/50 rounded-lg hover:bg-surface-hover"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          {addHref && (
            <Link href={addHref} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg hover:shadow-lg hover:shadow-primary/20">
              <Plus className="w-4 h-4" /> {addLabel}
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full" role="grid" aria-label={title}>
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-border/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "text-xs font-bold text-text-muted uppercase tracking-wider px-6 py-3",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  )}
                  aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {col.sortable !== false ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:text-text"
                      aria-label={`Sort by ${col.label}`}
                    >
                      {col.label}
                      <SortIcon colKey={col.key} />
                    </button>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider">{col.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-surface-alt flex items-center justify-center">
                      <Inbox className="w-10 h-10 text-text-light" />
                    </div>
                    <p className="text-text-muted font-medium">{emptyMessage}</p>
                    {emptyAction && (
                      <Link href={emptyAction.href} className="text-sm text-primary font-medium hover:underline">
                        {emptyAction.label}
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={i} className={cn("border-b border-border/30 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors", i % 2 === 1 && "bg-gray-50/50 dark:bg-gray-900/30")}>
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-6 py-5 text-sm", col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left")}>
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-border/30">
        {paged.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Inbox className="w-10 h-10 text-text-light mx-auto mb-3" />
            <p className="text-text-muted">{emptyMessage}</p>
          </div>
        ) : (
          paged.map((row, i) => (
            <div key={i} className="p-4 space-y-2 hover:bg-surface-hover/30">
              {columns.filter((c) => !c.hiddenOnMobile).map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider shrink-0">{col.label}</span>
                  <span className={cn("text-sm text-right", col.align === "right" && "font-semibold")}>
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 lg:px-6 py-4 border-t border-border/50">
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <span>Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, sorted.length)} of {sorted.length}</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>{n}/page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) { p = i + 1; }
              else if (page <= 4) { p = i + 1; }
              else if (page >= totalPages - 3) { p = totalPages - 6 + i; }
              else { p = page - 3 + i; }
              return (
                <button key={p} onClick={() => setPage(p)} aria-label={`Page ${p}`} className={cn("w-9 h-9 rounded-lg text-sm font-medium", p === page ? "bg-primary text-white" : "hover:bg-surface-hover text-text-muted")}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
