import React from 'react';

export default function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
          {Icon && <Icon className="w-7 h-7 lg:w-8 lg:h-8 text-primary" />}
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}