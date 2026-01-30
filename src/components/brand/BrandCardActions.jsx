import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, ExternalLink } from 'lucide-react';

export default function BrandCardActions({ brand, onContact, onViewProfile, compact = false }) {
  if (compact) {
    return (
      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewProfile}
          className="flex-1"
        >
          Ver Perfil
        </Button>
        {onContact && (
          <Button 
            size="sm" 
            onClick={onContact}
            className="flex-1"
          >
            Contatar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Button 
        variant="outline" 
        onClick={onViewProfile}
        className="flex-1"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Ver Perfil
      </Button>
      {onContact && (
        <Button 
          onClick={onContact}
          className="flex-1"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Contatar
        </Button>
      )}
    </div>
  );
}