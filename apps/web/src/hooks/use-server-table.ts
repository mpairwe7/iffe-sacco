"use client";

import { useDeferredValue, useState } from "react";
import type { PaginationParams } from "@iffe/shared";

interface UseServerTableOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
}

export function useServerTable(options: UseServerTableOptions = {}) {
  const [page, setPage] = useState(options.initialPage ?? 1);
  const [limit, setLimit] = useState(options.initialLimit ?? 10);
  const [search, setSearch] = useState(options.initialSearch ?? "");
  const [sortBy, setSortBy] = useState<string | null>(options.initialSortBy ?? null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(options.initialSortOrder ?? "desc");
  const deferredSearch = useDeferredValue(search.trim());

  const params: PaginationParams = {
    page,
    limit,
    search: deferredSearch || undefined,
    sortBy: sortBy || undefined,
    sortOrder,
  };

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageChange(nextPage: number) {
    setPage(Math.max(1, nextPage));
  }

  function handlePerPageChange(nextPerPage: number) {
    setLimit(nextPerPage);
    setPage(1);
  }

  function handleSortChange(key: string, direction: "asc" | "desc") {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  }

  return {
    params,
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    setPage,
    handleSearchChange,
    handlePageChange,
    handlePerPageChange,
    handleSortChange,
  };
}
