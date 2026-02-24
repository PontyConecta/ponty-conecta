import React from 'react';
import { Info } from 'lucide-react';

export default function FieldHint({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
      <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</span>
    </div>
  );
}