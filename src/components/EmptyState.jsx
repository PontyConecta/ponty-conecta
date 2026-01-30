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
  const variantStyles = {
    default: 'text-slate-400',
    primary: 'text-indigo-300',
    secondary: 'text-orange-300'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className={`w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4`}>
        <Icon className={`w-8 h-8 ${variantStyles[variant]}`} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" className="gap-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}