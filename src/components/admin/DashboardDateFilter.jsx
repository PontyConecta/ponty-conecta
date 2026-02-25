import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CalendarDays, CalendarRange } from 'lucide-react';

const ranges = [
  { key: 'day', label: 'Hoje', icon: Clock },
  { key: 'week', label: '7 dias', icon: Calendar },
  { key: 'month', label: '30 dias', icon: CalendarDays },
  { key: 'year', label: '12 meses', icon: CalendarRange },
];

export default function DashboardDateFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {ranges.map(r => {
        const active = value === r.key;
        return (
          <Button
            key={r.key}
            variant="ghost"
            size="sm"
            onClick={() => onChange(r.key)}
            className={`h-8 px-3 gap-1.5 text-xs font-medium rounded-md transition-all ${
              active ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
            }`}
            style={active ? { backgroundColor: 'var(--bg-secondary)', color: '#9038fa' } : { color: 'var(--text-secondary)' }}
          >
            <r.icon className="w-3.5 h-3.5" />
            {r.label}
          </Button>
        );
      })}
    </div>
  );
}