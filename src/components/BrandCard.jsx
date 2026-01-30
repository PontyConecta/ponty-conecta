import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Globe, 
  CheckCircle2,
  Lock,
  Eye,
  MessageCircle,
  Megaphone
} from 'lucide-react';

export default function BrandCard({ 
  brand, 
  isSubscribed = false, 
  onViewProfile,
  onContact,
  compact = false
}) {
  const industryLabels = {
    fashion: 'Moda',
    beauty: 'Beleza',
    tech: 'Tecnologia',
    food_beverage: 'Alimentos',
    health_wellness: 'Saúde',
    travel: 'Viagens',
    entertainment: 'Entretenimento',
    sports: 'Esportes',
    finance: 'Finanças',
    education: 'Educação',
    retail: 'Varejo',
    automotive: 'Automotivo',
    other: 'Outros'
  };

  if (compact) {
    return (
      <Card className="hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group border-slate-200" onClick={onViewProfile}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.company_name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                  {brand.company_name}
                </h4>
                {brand.verified && (
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-slate-500">
                {industryLabels[brand.industry] || brand.industry}
              </p>
            </div>
            {!isSubscribed && (
              <Lock className="w-4 h-4 text-slate-300" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 group border-slate-200 hover:scale-[1.02]">
      {/* Cover Image */}
      <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
        {brand.cover_image_url && (
          <img 
            src={brand.cover_image_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <CardContent className="pt-0 -mt-10 relative">
        {/* Logo */}
        <div className="flex justify-between items-end mb-4">
          {brand.logo_url ? (
            <img 
              src={brand.logo_url} 
              alt={brand.company_name} 
              className="w-20 h-20 rounded-xl border-4 border-white shadow-xl ring-2 ring-indigo-100 group-hover:ring-indigo-200 transition-all object-cover bg-white"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl border-4 border-white shadow-xl ring-2 ring-indigo-100 group-hover:ring-indigo-200 transition-all bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          )}
          {brand.industry && (
            <Badge variant="outline" className="bg-white">
              {industryLabels[brand.industry] || brand.industry}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                {brand.company_name}
              </h3>
              {brand.verified && (
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              )}
            </div>
            {brand.website && isSubscribed && (
              <a 
                href={brand.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="w-3 h-3" />
                Website
              </a>
            )}
            {brand.social_instagram && isSubscribed && (
              <a 
                href={`https://instagram.com/${brand.social_instagram.replace('@', '')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-pink-600 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Instagram
              </a>
            )}
          </div>

          {brand.description && (
            <p className="text-sm text-slate-600 line-clamp-2">
              {isSubscribed ? brand.description : brand.description.slice(0, 50) + '...'}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            {brand.active_campaigns > 0 && (
              <div className="flex items-center gap-1 text-emerald-600">
                <Megaphone className="w-4 h-4" />
                <span className="font-medium">{brand.active_campaigns} campanhas ativas</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
              onClick={onViewProfile}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver Perfil
            </Button>
            {isSubscribed ? (
              <Button 
                size="sm" 
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all"
                onClick={onContact}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Contato
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 border-indigo-200 text-indigo-600 bg-indigo-50 cursor-not-allowed"
                disabled
              >
                <Lock className="w-4 h-4 mr-1" />
                Premium
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}