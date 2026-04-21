"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { WelfareEventsTable } from "@/components/welfare/welfare-events-table";
import { WelfareTabs, type WelfareKind } from "@/components/welfare/welfare-tabs";

export default function WelfarePage() {
  const [kind, setKind] = useState<WelfareKind>("wedding");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center">
          <Heart className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Welfare</h1>
          <p className="text-text-muted text-sm">Member welfare events and outstanding contributions.</p>
        </div>
      </div>

      <WelfareTabs value={kind} onChange={setKind} />
      <WelfareEventsTable kind={kind} />
    </div>
  );
}
