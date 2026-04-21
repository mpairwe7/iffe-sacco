"use client";

import { Gift, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";

export type WelfareKind = "wedding" | "condolence";

interface WelfareTabsProps {
  value: WelfareKind;
  onChange: (value: WelfareKind) => void;
}

export function WelfareTabs({ value, onChange }: WelfareTabsProps) {
  const tabs: Array<{ id: WelfareKind; label: string; icon: React.ElementType }> = [
    { id: "wedding", label: "Weddings", icon: Gift },
    { id: "condolence", label: "Condolences", icon: HandHeart },
  ];

  return (
    <div role="tablist" aria-label="Welfare event type" className="flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors",
              active
                ? "text-primary border-primary bg-primary/5"
                : "text-text-muted border-transparent hover:text-text hover:bg-surface-alt/40",
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
