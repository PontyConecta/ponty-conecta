import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Megaphone, CheckCircle2, Lock } from 'lucide-react';
import { getStateLabel } from '@/components/common/BrazilStateSelect';

const INDUSTRY_LABELS = {
  fashion: 'Moda', beauty: 'Beleza', tech: 'Tecnologia', food_beverage: 'Alimentos',
  health_wellness: 'Saúde', travel: 'Viagens', entertainment: 'Entretenimento',
  sports: 'Esportes', finance: 'Finanças', education: 'Educação',
  retail: 'Varejo', automotive: 'Automotivo', other: 'Outros',
};

export default function DiscoverBrandCard({ brand, isSubscribed, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="aspect-[4/5] relative bg-muted overflow-hidden">
        {brand.logo_url ? (
          <img src={brand.logo_url} alt={brand.company_name} className="w-full h-full object-cover" />
        ) : brand.cover_image_url ? (
          <img src={brand.cover_image_url} alt={brand.company_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute bottom-0 inset-x-0 p-2.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-white font-semibold text-sm line-clamp-1 flex-1">
              {brand.company_name}
            </h3>
            {brand.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
          </div>
          {(brand.city || brand.state) && (
            <p className="text-white/70 text-[10px] flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {brand.city ? `${brand.city}` : ''}{brand.city && brand.state ? ', ' : ''}{brand.state ? getStateLabel(brand.state) : ''}
            </p>
          )}
        </div>

        {!isSubscribed && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
            <Lock className="w-3 h-3 text-white/80" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
        <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[2rem] flex-1">
          {brand.description || '\u00A0'}
        </p>

        <div className="flex items-center justify-between">
          {brand.industry && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
              {INDUSTRY_LABELS[brand.industry] || brand.industry}
            </Badge>
          )}
          {brand.active_campaigns > 0 && (
            <div className="flex items-center gap-0.5 text-[10px] text-emerald-600">
              <Megaphone className="w-3 h-3" />
              <span className="font-medium">{brand.active_campaigns}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}