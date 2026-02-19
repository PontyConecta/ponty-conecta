import React from 'react';
import { Button } from "@/components/ui/button";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  variant = 'default' 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Icon className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm max-w-md mb-6" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" className="gap-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}