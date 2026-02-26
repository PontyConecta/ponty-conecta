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
        <div className="mt-auto">
          <div className="text-2xl font-bold tracking-tight tabular-nums leading-none">
            {value}
          </div>
          <div className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight mt-1">
            {label}
          </div>
          {total !== undefined && (
            <div className="text-xs text-muted-foreground leading-none mt-0.5">
              de {total} no total
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}