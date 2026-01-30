import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle2, MapPin } from 'lucide-react';

export default function CreatorCardHeader({ creator, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={creator.avatar_url} alt={creator.display_name} />
          <AvatarFallback className="bg-indigo-100">
            <User className="w-6 h-6 text-indigo-600" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{creator.display_name}</h3>
            {creator.verified && (
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <Badge variant="outline" className="text-xs mt-1 capitalize">
            {creator.profile_size || 'nano'}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <Avatar className="w-16 h-16">
        <AvatarImage src={creator.avatar_url} alt={creator.display_name} />
        <AvatarFallback className="bg-indigo-100">
          <User className="w-8 h-8 text-indigo-600" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{creator.display_name}</h3>
          {creator.verified && (
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          )}
        </div>
        {creator.bio && (
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
            {creator.bio}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="capitalize">
            {creator.profile_size || 'nano'}
          </Badge>
          {creator.location && (
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {creator.location}
            </Badge>
          )}
          {creator.subscription_status === 'active' && (
            <Badge className="bg-emerald-100 text-emerald-700 border-0">
              Pro
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}