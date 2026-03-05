import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Users, CheckCircle2, Lock, EyeOff } from 'lucide-react';
import { getStateLabel } from '@/components/common/BrazilStateSelect';

function formatFollowers(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
}

export default function DiscoverCreatorCard({ creator, isSubscribed, onClick, onHide }) {
  const totalFollowers = (creator.platforms || []).reduce((s, p) => s + (p.followers || 0), 0);

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="aspect-[4/5] relative bg-muted overflow-hidden">
        {creator.avatar_url ? (
          <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <span className="text-3xl font-bold text-primary">{creator.display_name?.[0]}</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Bottom overlay info */}
        <div className="absolute bottom-0 inset-x-0 p-2.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-white font-semibold text-sm line-clamp-1 flex-1">
              {creator.display_name}
            </h3>
            {creator.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
          </div>
          {(creator.city || creator.state) && (
            <p className="text-white/70 text-[10px] flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {creator.city ? `${creator.city}` : ''}{creator.city && creator.state ? ', ' : ''}{creator.state ? getStateLabel(creator.state) : ''}
            </p>
          )}
        </div>

        {/* Featured badge */}
        {creator.featured && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground border-0 text-[9px] px-1.5 py-0.5">
            Destaque
          </Badge>
        )}

        {/* Premium lock */}
        {!isSubscribed && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
            <Lock className="w-3 h-3 text-white/80" />
          </div>
        )}

        {/* Hide button */}
        {onHide && (
          <button
            onClick={(e) => { e.stopPropagation(); onHide(); }}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-10"
            title="Ocultar"
            style={!isSubscribed ? { left: '2.25rem' } : {}}
          >
            <EyeOff className="w-3 h-3 text-white/80" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
        <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[2rem] flex-1">
          {creator.bio || 'Criadora de conteúdo'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="w-3 h-3" />
            <span className="font-medium">{formatFollowers(totalFollowers)}</span>
          </div>
          {creator.profile_size && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">
              {creator.profile_size}
            </Badge>
          )}
        </div>

        {/* Niches */}
        <div className="flex flex-wrap gap-1 overflow-hidden max-h-[1.2rem]">
          {creator.niche?.length > 0 ? (
            <>
              {creator.niche.slice(0, 2).map((n, i) => (
                <span key={i} className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {n}
                </span>
              ))}
              {creator.niche.length > 2 && (
                <span className="text-[9px] text-muted-foreground">+{creator.niche.length - 2}</span>
              )}
            </>
          ) : (
            <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">UGC</span>
          )}
        </div>
      </div>
    </div>
  );
}