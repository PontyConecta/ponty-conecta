import React from 'react';
import { Megaphone, Zap } from 'lucide-react';

export default function BrandCardStats({ brand }) {
  return (
    <div className="flex items-center gap-4 py-3 border-t border-slate-100">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">{brand.total_campaigns || 0}</span> campanhas
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">{brand.active_campaigns || 0}</span> ativas
        </span>
      </div>
    </div>
  );
}