import React, { useRef } from 'react';

export default function CategoryChips({ categories, value, onChange }) {
  const ref = useRef(null);

  return (
    <div ref={ref} className="overflow-x-auto flex gap-2 pb-1 scrollbar-hide -mx-1 px-1">
      <button
        onClick={() => onChange('all')}
        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
          value === 'all'
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-muted-foreground border-border hover:border-primary/30'
        }`}
      >
        Todas
      </button>
      {categories.map(cat => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
            value === cat.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/30'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}