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
      <Card className="hover:shadow-lg transition-all cursor-pointer group" style={{ borderColor: 'var(--border-color)' }} onClick={onViewProfile}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.company_name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#9038fa' }}>
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold truncate transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {brand.company_name}
                </h4>
                {brand.verified && (
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02]" style={{ borderColor: 'var(--border-color)' }}>
      {/* Cover Image */}
      <div className="h-24 relative" style={{ backgroundColor: '#9038fa' }}>
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
              className="w-20 h-20 rounded-xl border-4 shadow-xl transition-all object-cover" 
              style={{ borderColor: 'var(--bg-secondary)', backgroundColor: 'var(--bg-secondary)' }}
            />
          ) : (
            <div className="w-20 h-20 rounded-xl border-4 shadow-xl transition-all flex items-center justify-center" style={{ borderColor: 'var(--bg-secondary)', backgroundColor: '#9038fa' }}>
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
              <h3 className="font-semibold text-lg transition-colors" style={{ color: 'var(--text-primary)' }}>
                {brand.company_name}
              </h3>
              {brand.verified && (
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              )}
            </div>
            {brand.state && (
              <span className="text-sm flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <MapPin className="w-3 h-3" />
                {brand.city ? `${brand.city}, ` : ''}{getStateLabel(brand.state)}
              </span>
            )}
            {brand.website && isSubscribed && (
              <a 
                href={brand.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-[#9038fa] hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="w-3 h-3" />
                Website
              </a>
            )}
            {isSubscribed && brand.online_presences?.length > 0 ? (
              brand.online_presences.filter(p => p.type === 'instagram').slice(0, 1).map((p, i) => (
                <a key={i}
                  href={p.value?.startsWith('http') ? p.value : `https://instagram.com/${p.value.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm text-pink-600 hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >Instagram</a>
              ))
            ) : (
              brand.social_instagram && isSubscribed && (
                <a 
                  href={`https://instagram.com/${brand.social_instagram.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm text-pink-600 hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >Instagram</a>
              )
            )}
          </div>

          {brand.description && (
            <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
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
              className="flex-1 transition-all"
              onClick={onViewProfile}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver Perfil
            </Button>
            {isSubscribed ? (
              <Button 
                size="sm" 
                className="flex-1 text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: '#9038fa' }}
                onClick={onContact}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Contato
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 border-purple-200 text-[#9038fa] bg-purple-50 cursor-not-allowed"
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