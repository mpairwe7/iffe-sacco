"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PaginationParams } from "@iffe/shared";

interface UseServerTableOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
  /** Namespace the URL query keys so multiple tables can coexist on one page. */
  paramPrefix?: string;
}

/**
 * Table state (page / rows-per-page / sort / search) persisted in the URL query
 * string, so it survives refresh and back/forward and is shareable/bookmarkable.
 * The return shape is unchanged, so existing DataTable consumers get this for free.
 */
export function useServerTable(options: UseServerTableOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefix = options.paramPrefix ? `${options.paramPrefix}_` : "";
  const k = useCallback((key: string) => `${prefix}${key}`, [prefix]);

  // The URL is the source of truth for page / limit / sort / (committed) search.
  const pageParam = Number(searchParams.get(k("page")));
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : (options.initialPage ?? 1);
  const limitParam = Number(searchParams.get(k("limit")));
  const limit = Number.isFinite(limitParam) && limitParam >= 1 ? limitParam : (options.initialLimit ?? 10);
  const sortBy = searchParams.get(k("sortBy")) ?? options.initialSortBy ?? null;
  const sortOrderParam = searchParams.get(k("sortOrder"));
  const sortOrder: "asc" | "desc" =
    sortOrderParam === "asc" || sortOrderParam === "desc" ? sortOrderParam : (options.initialSortOrder ?? "desc");
  const urlSearch = searchParams.get(k("search")) ?? options.initialSearch ?? "";

  // Local state drives the search input for instant feedback; the committed value
  // is mirrored to the URL (deferred) and back into the input on external changes.
  const [search, setSearch] = useState(urlSearch);
  const deferredSearch = useDeferredValue(search.trim());

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(k(key));
        else next.set(k(key), value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [k, pathname, router, searchParams],
  );

  // Commit the debounced search term to the URL (resetting to page 1).
  useEffect(() => {
    if (deferredSearch !== urlSearch) {
      setParams({ search: deferredSearch || null, page: null });
    }
    // Only react to the debounced term; urlSearch/setParams are read inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  // Follow external URL changes (back/forward, shared links) into the input.
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const params: PaginationParams = {
    page,
    limit,
    search: urlSearch || undefined,
    sortBy: sortBy || undefined,
    sortOrder,
  };

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const p = Math.max(1, nextPage);
      setParams({ page: p > 1 ? String(p) : null });
    },
    [setParams],
  );

  const handlePerPageChange = useCallback(
    (nextPerPage: number) => {
      setParams({ limit: String(nextPerPage), page: null });
    },
    [setParams],
  );

  const handleSortChange = useCallback(
    (key: string, direction: "asc" | "desc") => {
      setParams({ sortBy: key, sortOrder: direction, page: null });
    },
    [setParams],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return {
    params,
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    setPage: handlePageChange,
    handleSearchChange,
    handlePageChange,
    handlePerPageChange,
    handleSortChange,
  };
}
