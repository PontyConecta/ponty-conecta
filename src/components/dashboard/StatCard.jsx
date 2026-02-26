import React from 'react';
import DashboardCard from './DashboardCard';

export default function StatCard({ label, value, icon: Icon, color, index = 0 }) {
  return (
    <div className="h-[120px]">
      <DashboardCard index={index}>
        <div
          className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold tracking-tight tabular-nums leading-none">
            {value}
          </div>
          <div className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight mt-0.5">
            {label}
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}