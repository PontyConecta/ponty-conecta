import React from 'react';
import { Button } from "@/components/ui/button";
import { Building2, Star, Users } from 'lucide-react';

const filters = [
  { key: 'all', label: 'Todos', icon: Users },
  { key: 'brand', label: 'Marcas', icon: Building2 },
  { key: 'creator', label: 'Criadores', icon: Star },
];

export default function DashboardProfileFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {filters.map(f => {
        const active = value === f.key;
        return (
          <Button
            key={f.key}
            variant="ghost"
            size="sm"
            onClick={() => onChange(f.key)}
            className={`h-8 px-3 gap-1.5 text-xs font-medium rounded-md transition-all ${
              active ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
            }`}
            style={active ? { backgroundColor: 'var(--bg-secondary)', color: '#9038fa' } : { color: 'var(--text-secondary)' }}
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </Button>
        );
      })}
    </div>
  );
}