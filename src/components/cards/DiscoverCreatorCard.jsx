import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Users, CheckCircle2, Lock } from 'lucide-react';
import { getStateLabel } from '@/components/common/BrazilStateSelect';

function formatFollowers(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
}

function ImagePlaceholder({ name }) {
  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-primary/20">
      <span className="text-3xl font-bold text-primary/60">{name?.[0]?.toUpperCase() || '?'}</span>
    </div>
  );
}

export default function DiscoverCreatorCard({ creator, isSubscribed, onClick }) {
  const totalFollowers = (creator.platforms || []).reduce((s, p) => s + (p.followers || 0), 0);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="aspect-[4/5] relative bg-muted overflow-hidden">
        {creator.avatar_url && !imgFailed ? (
          <img
            src={creator.avatar_url}
            alt={creator.display_name}
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ImagePlaceholder name={creator.display_name} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        
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

        {creator.featured && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground border-0 text-[9px] px-1.5 py-0.5">
            Destaque
          </Badge>
        )}

        {!isSubscribed && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
            <Lock className="w-3 h-3 text-white/80" />
          </div>
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