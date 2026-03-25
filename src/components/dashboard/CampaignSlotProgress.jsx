import React from 'react';
import { Progress } from "@/components/ui/progress";

export default function CampaignSlotProgress({ filled = 0, total = 1 }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <Progress value={pct} className="h-1.5 flex-1" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{filled}/{total}</span>
    </div>
  );
}