import React from 'react';
import DashboardCard from './DashboardCard';

export default function StatCard({ label, value, total, icon: Icon, color, index = 0 }) {
  return (
    <div className="h-[140px]">
      <DashboardCard index={index}>
        <div
          className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight tabular-nums leading-none">
              {value}
            </span>
            {total > 0 && total !== value && (
              <span className="text-[11px] text-muted-foreground/60 font-normal">
                /{total}
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight mt-0.5">
            {label}
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}