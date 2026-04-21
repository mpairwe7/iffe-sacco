"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { AddWelfareEventModal } from "@/components/welfare/add-welfare-event-modal";
import { EditWelfareEventModal } from "@/components/welfare/edit-welfare-event-modal";
import { WelfareEventsTable, type WelfareEvent } from "@/components/welfare/welfare-events-table";
import { WelfareTabs, type WelfareKind } from "@/components/welfare/welfare-tabs";

export default function WelfareAdminPage() {
  const [kind, setKind] = useState<WelfareKind>("wedding");
  const [editOpen, setEditOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<WelfareEvent | null>(null);

  function handleView(event: WelfareEvent) {
    setActiveEvent(event);
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center">
            <Heart className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Welfare</h1>
            <p className="text-text-muted text-sm">
              Manage members&apos; social welfare contributions for weddings and condolences.
            </p>
          </div>
        </div>
        <AddWelfareEventModal defaultKind={kind} />
      </div>

      <WelfareTabs value={kind} onChange={setKind} />
      <WelfareEventsTable kind={kind} showActions onView={handleView} />

      <EditWelfareEventModal
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (!next) setActiveEvent(null);
        }}
        kind={kind}
        event={activeEvent}
      />
    </div>
  );
}
