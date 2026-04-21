"use client";

import Link from "next/link";
import { ScrollText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembers } from "@/hooks/use-members";
import { formatDate } from "@/lib/utils";
import type { Member } from "@iffe/shared";

interface RecentRemarksFeedProps {
  limit?: number;
}

export function RecentRemarksFeed({ limit = 6 }: RecentRemarksFeedProps) {
  const { data, isLoading } = useMembers({ limit: 100, sortBy: "updatedAt", sortOrder: "desc" });
  const members = (data?.data ?? []) as Member[];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  const remarks = members.filter((m) => m.remarks && m.remarks.trim().length > 0).slice(0, limit);

  if (remarks.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted text-sm flex flex-col items-center gap-2">
        <ScrollText className="w-6 h-6 text-text-muted/40" />
        <span>No remarks recorded yet.</span>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {remarks.map((member) => (
        <li key={member.id} className="py-3">
          <Link
            href={`/admin/members/${member.id}/edit`}
            className="block hover:bg-surface-alt/40 -mx-2 px-2 py-1 rounded-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-text truncate">
                {member.firstName} {member.lastName}
              </p>
              <span className="text-[11px] text-text-muted shrink-0">{formatDate(member.updatedAt)}</span>
            </div>
            <p className="text-xs text-text-muted line-clamp-2 mt-1">{member.remarks}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
