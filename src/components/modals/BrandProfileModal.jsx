import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, MapPin, Mail, Phone, Globe, MessageCircle } from 'lucide-react';
import { getStateLabel } from '@/components/common/BrazilStateSelect';
import { getPresenceUrl, getPresenceLabel } from '@/components/utils/phoneFormatter';

const INDUSTRY_LABELS = {
  fashion: 'Moda', beauty: 'Beleza', tech: 'Tecnologia', food_beverage: 'Alimentos',
  health_wellness: 'Saúde', travel: 'Viagens', entertainment: 'Entretenimento',
  sports: 'Esportes', finance: 'Finanças', education: 'Educação',
  retail: 'Varejo', automotive: 'Automotivo', other: 'Outros',
};

export default function BrandProfileModal({ brand, isSubscribed, onPaywall, onMessage }) {
  const [enrichedBrand, setEnrichedBrand] = useState(brand);

  useEffect(() => {
    if (brand && (brand.total_campaigns === 0 || brand.total_campaigns === undefined)) {
      base44.entities.Campaign.filter({ brand_id: brand.id }, '-created_date', 500).then(campaigns => {
        setEnrichedBrand({
          ...brand,
          total_campaigns: campaigns.length,
          active_campaigns: campaigns.filter(c => c.status === 'active').length
        });
      }).catch(() => setEnrichedBrand(brand));
    } else {
      setEnrichedBrand(brand);
    }
  }, [brand?.id]);

  const b = enrichedBrand;

  return (
    <div className="space-y-6 py-4">
      <div className="relative">
        <div className="h-32 rounded-xl overflow-hidden bg-gradient-to-r from-primary to-accent">
          {b.cover_image_url && <img src={b.cover_image_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="absolute -bottom-12 left-6">
          {b.logo_url ? (
            <img src={b.logo_url} alt={b.company_name} className="w-24 h-24 rounded-xl border-4 border-card shadow-lg object-cover bg-card" />
          ) : (
            <div className="w-24 h-24 rounded-xl border-4 border-card shadow-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
          )}
        </div>
      </div>

      <div className="pt-10 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{b.company_name || 'Marca'}</h2>
            {b.is_verified && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {b.industry && <Badge variant="outline">{INDUSTRY_LABELS[b.industry] || b.industry}</Badge>}
            {b.state && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {b.city ? `${b.city}, ` : ''}{getStateLabel(b.state)}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-muted-foreground">{b.description || 'Marca parceira'}</p>

        <div className="flex items-center gap-6">
          <div><div className="text-2xl font-bold">{b.total_campaigns || 0}</div><div className="text-sm text-muted-foreground">Campanhas</div></div>
          <div><div className="text-2xl font-bold text-emerald-600">{b.active_campaigns || 0}</div><div className="text-sm text-muted-foreground">Ativas</div></div>
        </div>

        {b.target_audience && <div><h4 className="font-medium mb-2">Público-Alvo</h4><p className="text-muted-foreground">{b.target_audience}</p></div>}
        {b.content_guidelines && <div><h4 className="font-medium mb-2">Diretrizes de Conteúdo</h4><p className="text-muted-foreground">{b.content_guidelines}</p></div>}

        {isSubscribed ? (
          <div className="space-y-3">
            <div className="p-4 bg-primary/5 rounded-xl space-y-3">
              <h4 className="font-medium text-primary">Contato</h4>
              {b.contact_email && <a href={`mailto:${b.contact_email}`} className="flex items-center gap-2 text-primary hover:underline"><Mail className="w-4 h-4" />{b.contact_email}</a>}
              {b.contact_phone && <a href={`tel:${b.contact_phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-primary hover:underline"><Phone className="w-4 h-4" />{b.contact_phone}</a>}
              {b.online_presences?.length > 0 ? (
                b.online_presences.map((p, i) => (
                  <a key={i} href={getPresenceUrl(p)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe className="w-4 h-4" />{getPresenceLabel(p)}</a>
                ))
              ) : (
                <>{b.website && <a href={b.website.startsWith('http') ? b.website : `https://${b.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe className="w-4 h-4" />Website</a>}</>
              )}
            </div>
            {onMessage && b.user_id && (
              <Button onClick={() => onMessage(b)} className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <MessageCircle className="w-4 h-4" />
                Enviar Mensagem
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/60 border border-border text-center space-y-2">
            <Mail className="w-5 h-5 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">Contatos e perfil completo</p>
            <p className="text-xs text-muted-foreground">Disponíveis no plano Premium</p>
            <Button size="sm" onClick={onPaywall} className="mt-1">Desbloquear</Button>
          </div>
        )}
      </div>
    </div>
  );
}