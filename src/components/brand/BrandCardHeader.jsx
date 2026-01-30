import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle2 } from 'lucide-react';

export default function BrandCardHeader({ brand, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={brand.logo_url} alt={brand.company_name} />
          <AvatarFallback className="bg-indigo-100">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{brand.company_name}</h3>
            {brand.verified && (
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <Badge variant="outline" className="text-xs mt-1 capitalize">
            {brand.industry?.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <Avatar className="w-16 h-16">
        <AvatarImage src={brand.logo_url} alt={brand.company_name} />
        <AvatarFallback className="bg-indigo-100">
          <Building2 className="w-8 h-8 text-indigo-600" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{brand.company_name}</h3>
          {brand.verified && (
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          )}
        </div>
        {brand.description && (
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
            {brand.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="capitalize">
            {brand.industry?.replace('_', ' ')}
          </Badge>
          {brand.subscription_status === 'active' && (
            <Badge className="bg-emerald-100 text-emerald-700 border-0">
              Pro
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}