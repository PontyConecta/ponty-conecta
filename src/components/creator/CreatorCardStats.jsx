import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

export default function CreatorCardStats({ creator }) {
  return (
    <div className="flex items-center gap-4 py-3 border-t border-slate-100">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">{creator.completed_campaigns || 0}</span> entregas
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">{creator.on_time_rate || 100}%</span> no prazo
        </span>
      </div>
    </div>
  );
}