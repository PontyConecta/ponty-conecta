import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, CheckCircle2, Mail, Phone, ExternalLink, Lock } from 'lucide-react';
import { getStateLabel } from '@/components/common/BrazilStateSelect';

function SafeImage({ src, alt, className, fallback }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return fallback || null;
  return <img src={src} alt={alt || ''} className={className} onError={() => setFailed(true)} />;
}

export default function CreatorProfileModal({ creator, isSubscribed, formatFollowers, getTotalFollowers, onPaywall }) {
  return (
    <div className="space-y-6 py-4">
      <div className="relative">
        <div className="h-32 rounded-xl overflow-hidden bg-gradient-to-r from-[#7DB04B] to-[#B5956A]">
          <SafeImage src={creator.cover_image_url} className="w-full h-full object-cover" />
        </div>
        <Avatar className="w-24 h-24 absolute -bottom-12 left-6 border-4 border-background shadow-lg">
          <AvatarImage src={creator.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">{creator.display_name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      </div>

      <div className="pt-10 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{creator.display_name || 'Criadora'}</h2>
            {creator.is_verified && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
          </div>
          {(creator.state || creator.location) && (
            <p className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {creator.city ? `${creator.city}, ` : ''}{getStateLabel(creator.state) || creator.location}
            </p>
          )}
        </div>

        <p className="text-muted-foreground">{creator.bio || 'Criadora de conteúdo'}</p>

        <div className="flex items-center gap-6">
          <div><div className="text-2xl font-bold">{formatFollowers(getTotalFollowers(creator))}</div><div className="text-sm text-muted-foreground">Seguidores</div></div>
          <div><div className="text-2xl font-bold">{creator.completed_campaigns || 0}</div><div className="text-sm text-muted-foreground">Campanhas</div></div>
          <div><div className="text-2xl font-bold">{creator.on_time_rate || 100}%</div><div className="text-sm text-muted-foreground">No Prazo</div></div>
        </div>

        {creator.niche?.length > 0 ? (
          <div>
            <h4 className="font-medium mb-2">Nichos</h4>
            <div className="flex flex-wrap gap-2">{creator.niche.map((n, i) => <Badge key={i} variant="outline">{n}</Badge>)}</div>
          </div>
        ) : (
          <div>
            <h4 className="font-medium mb-2">Nichos</h4>
            <Badge variant="outline" className="text-muted-foreground">Sem nicho informado</Badge>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-2">Plataformas</h4>
          {creator.platforms?.length > 0 ? (
            <div className="space-y-2">
              {creator.platforms.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {isSubscribed ? (
                      <a href={p.url || `https://${p.name.toLowerCase()}.com/${(p.handle || '').replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>@{p.handle}</a>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <Badge variant="outline">{formatFollowers(p.followers || 0)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Plataformas não informadas</p>
          )}
        </div>

        {creator.portfolio_images?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Portfólio</h4>
            <div className="grid grid-cols-3 gap-2">
              {creator.portfolio_images.slice(0, 6).map((url, i) => (
                <SafeImage
                  key={i}
                  src={url}
                  className="aspect-square rounded-lg object-cover w-full"
                  fallback={<div className="aspect-square rounded-lg bg-muted" />}
                />
              ))}
            </div>
          </div>
        )}

        {isSubscribed ? (
          <>
            {(creator.rate_cash_min || creator.rate_cash_max) && (
              <div className="p-4 rounded-xl bg-emerald-500/10">
                <h4 className="font-medium text-emerald-600 mb-1">Faixa de Valores</h4>
                <p className="text-emerald-500">R$ {creator.rate_cash_min || 0} - R$ {creator.rate_cash_max || 0}</p>
                {creator.accepts_barter && <Badge className="mt-2 bg-emerald-500/15 text-emerald-600 border-0">Aceita permutas</Badge>}
              </div>
            )}
            <div className="p-4 rounded-xl space-y-3 bg-primary/5">
              <h4 className="font-medium text-primary">Contato</h4>
              {creator.contact_email && <a href={`mailto:${creator.contact_email}`} className="flex items-center gap-2 text-primary hover:underline"><Mail className="w-4 h-4" />{creator.contact_email}</a>}
              {creator.contact_whatsapp && <a href={`https://wa.me/${creator.contact_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Phone className="w-4 h-4" />{creator.contact_whatsapp}</a>}
              {creator.portfolio_url && <a href={creator.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-4 h-4" />Ver Media Kit</a>}
            </div>
          </>
        ) : (
          <div className="p-4 rounded-xl bg-muted/60 border border-border text-center space-y-2">
            <Lock className="w-5 h-5 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">Valores, contato e redes completas</p>
            <p className="text-xs text-muted-foreground">Disponíveis no plano Premium</p>
            <Button size="sm" onClick={onPaywall} className="mt-1">Desbloquear</Button>
          </div>
        )}
      </div>
    </div>
  );
}