import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, MapPin, Mail, Phone, Globe } from 'lucide-react';
import { getStateLabel } from '@/components/common/BrazilStateSelect';
import { getPresenceUrl, getPresenceLabel } from '@/components/utils/phoneFormatter';

const INDUSTRY_LABELS = {
  fashion: 'Moda', beauty: 'Beleza', tech: 'Tecnologia', food_beverage: 'Alimentos',
  health_wellness: 'Saúde', travel: 'Viagens', entertainment: 'Entretenimento',
  sports: 'Esportes', finance: 'Finanças', education: 'Educação',
  retail: 'Varejo', automotive: 'Automotivo', other: 'Outros',
};

export default function BrandProfileModal({ brand, isSubscribed, onPaywall }) {
  return (
    <div className="space-y-6 py-4">
      <div className="relative">
        <div className="h-32 rounded-xl overflow-hidden bg-gradient-to-r from-primary to-accent">
          {brand.cover_image_url && <img src={brand.cover_image_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="absolute -bottom-12 left-6">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.company_name} className="w-24 h-24 rounded-xl border-4 border-card shadow-lg object-cover bg-card" />
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
            <h2 className="text-2xl font-bold">{brand.company_name || 'Marca'}</h2>
            {brand.is_verified && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {brand.industry && <Badge variant="outline">{INDUSTRY_LABELS[brand.industry] || brand.industry}</Badge>}
            {brand.state && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {brand.city ? `${brand.city}, ` : ''}{getStateLabel(brand.state)}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-muted-foreground">{brand.description || 'Marca parceira'}</p>

        <div className="flex items-center gap-6">
          <div><div className="text-2xl font-bold">{brand.total_campaigns || 0}</div><div className="text-sm text-muted-foreground">Campanhas</div></div>
          <div><div className="text-2xl font-bold text-emerald-600">{brand.active_campaigns || 0}</div><div className="text-sm text-muted-foreground">Ativas</div></div>
        </div>

        {brand.target_audience && <div><h4 className="font-medium mb-2">Público-Alvo</h4><p className="text-muted-foreground">{brand.target_audience}</p></div>}
        {brand.content_guidelines && <div><h4 className="font-medium mb-2">Diretrizes de Conteúdo</h4><p className="text-muted-foreground">{brand.content_guidelines}</p></div>}

        {isSubscribed ? (
          <div className="p-4 bg-primary/5 rounded-xl space-y-3">
            <h4 className="font-medium text-primary">Contato</h4>
            {brand.contact_email && <a href={`mailto:${brand.contact_email}`} className="flex items-center gap-2 text-primary hover:underline"><Mail className="w-4 h-4" />{brand.contact_email}</a>}
            {brand.contact_phone && <a href={`tel:${brand.contact_phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-primary hover:underline"><Phone className="w-4 h-4" />{brand.contact_phone}</a>}
            {brand.online_presences?.length > 0 ? (
              brand.online_presences.map((p, i) => (
                <a key={i} href={getPresenceUrl(p)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe className="w-4 h-4" />{getPresenceLabel(p)}</a>
              ))
            ) : (
              <>
                {brand.website && <a href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe className="w-4 h-4" />Website</a>}
              </>
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