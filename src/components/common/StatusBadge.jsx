import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getStatusConfig } from '@/utils/statusConfigs';

export default function StatusBadge({ type, status, className = '' }) {
  const config = getStatusConfig(type, status);
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.color} border-0 ${className}`}>
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}