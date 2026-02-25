import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Users, 
  Star, 
  CheckCircle2,
  Lock,
  Eye,
  MessageCircle
} from 'lucide-react';
import { getStateLabel } from '@/components/common/BrazilStateSelect';

export default function CreatorCard({ 
  creator, 
  isSubscribed = false, 
  onViewProfile,
  onContact,
  compact = false
}) {
  const getTotalFollowers = () => {
    if (!creator.platforms) return 0;
    return creator.platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
  };

  const formatFollowers = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const profileSizeColors = {
    nano: 'bg-slate-100 text-slate-700',
    micro: 'bg-blue-100 text-blue-700',
    mid: 'bg-violet-100 text-violet-700',
    macro: 'bg-purple-100 text-purple-700',
    mega: 'bg-rose-100 text-rose-700'
  };

  if (compact) {
    return (
      <Card className="hover:shadow-lg transition-all cursor-pointer group"  onClick={onViewProfile}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={creator.avatar_url} />
              <AvatarFallback className="bg-[#9038fa]/10 text-[#9038fa]">
                {creator.display_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold truncate transition-colors" >
                  {creator.display_name}
                </h4>
                {creator.verified && (
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm" className="text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{formatFollowers(getTotalFollowers())}</span>
                {creator.profile_size && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {creator.profile_size}
                  </Badge>
                )}
              </div>
            </div>
            {!isSubscribed && (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col">
      {/* Cover Image */}
      <div className="h-24 relative flex-shrink-0" className="bg-[#9038fa]">
        {creator.cover_image_url && (
          <img 
            src={creator.cover_image_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        )}
        {creator.featured && (
          <Badge className="absolute top-2 right-2 bg-[#9038fa] text-white border-0">
            <Star className="w-3 h-3 mr-1" />
            Destaque
          </Badge>
        )}
      </div>

      <CardContent className="pt-0 -mt-10 relative flex flex-col flex-1">
        {/* Avatar */}
        <div className="flex justify-between items-end mb-4">
          <Avatar className="w-20 h-20 border-4 shadow-xl transition-all" className="border-card">
            <AvatarImage src={creator.avatar_url} />
            <AvatarFallback className="text-white text-2xl" className="bg-[#9038fa]">
              {creator.display_name?.[0]}
            </AvatarFallback>
          </Avatar>
          {creator.profile_size && (
            <Badge className={`${profileSizeColors[creator.profile_size]} border-0 capitalize`}>
              {creator.profile_size}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="space-y-3 flex flex-col flex-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg transition-colors truncate" >
                {creator.display_name}
              </h3>
              {creator.verified && (
                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm" className="text-muted-foreground">
              {(creator.state || creator.location) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {creator.city ? `${creator.city}, ` : ''}{creator.state ? getStateLabel(creator.state) : creator.location}
                </span>
              )}
              {isSubscribed && creator.platforms?.find(p => p.name === 'Instagram') && (
                <a 
                  href={`https://instagram.com/${creator.platforms.find(p => p.name === 'Instagram')?.handle?.replace('@', '') || ''}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Instagram
                </a>
              )}
            </div>
          </div>

          {creator.bio && (
            <p className="text-sm line-clamp-2 min-h-[2.5rem]" className="text-muted-foreground">
              {isSubscribed ? creator.bio : creator.bio.slice(0, 50) + '...'}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1" className="text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="font-medium">{formatFollowers(getTotalFollowers())}</span>
            </div>
            {creator.completed_campaigns > 0 && (
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">{creator.completed_campaigns} jobs</span>
              </div>
            )}
          </div>

          {/* Niches */}
          <div className="flex flex-wrap gap-1 min-h-[1.75rem]">
            {creator.niche?.length > 0 ? (
              <>
                {creator.niche.slice(0, 3).map((n, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {n}
                  </Badge>
                ))}
                {creator.niche.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{creator.niche.length - 3}
                  </Badge>
                )}
              </>
            ) : null}
          </div>

          {/* Actions - pushed to bottom */}
          <div className="flex gap-2 pt-2 mt-auto">
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
                className="bg-[#9038fa]"
                onClick={onContact}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Contato
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 border-primary/20 text-primary bg-primary/5 cursor-not-allowed"
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