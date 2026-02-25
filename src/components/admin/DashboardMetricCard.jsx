import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardMetricCard({ label, value, subtitle, icon: Icon, iconColor = 'text-blue-600' }) {
  return (
    <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm mb-1 truncate" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
            )}
          </div>
          {Icon && <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${iconColor} flex-shrink-0`} />}
        </div>
      </CardContent>
    </Card>
  );
}