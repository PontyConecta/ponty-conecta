import React from 'react';
import { Button } from "@/components/ui/button";

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'new', label: 'Novos' },
  { key: 'never_active', label: 'Nunca acessaram' },
  { key: 'inactive', label: 'Inativos' },
  { key: 'hidden', label: 'Ocultos' },
  { key: 'free', label: 'Free' },
  { key: 'premium', label: 'Premium' },
  { key: 'trial', label: 'Em Trial' },
  { key: 'feedback_beta', label: 'Pesquisa' },
];

export default function UserQuickFilters({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {FILTERS.map(f => (
        <Button
          key={f.key}
          variant={value === f.key ? 'default' : 'outline'}
          size="sm"
          className={`h-7 text-xs px-3 ${value === f.key ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
}