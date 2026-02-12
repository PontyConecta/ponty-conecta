import React from 'react';
import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge({ size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <BadgeCheck 
      className={`${sizeClasses[size]} text-blue-500 ${className}`}
      fill="currentColor"
    />
  );
}