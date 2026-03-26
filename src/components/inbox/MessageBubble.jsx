import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Target, Megaphone } from 'lucide-react';
import moment from 'moment';

export default function MessageBubble({ message, isOwn, profileType }) {
  const isInvite = message.content?.startsWith('🎯 *Convite para campanha');
  const isPitch = !isInvite && message.content?.startsWith('🎯 Pitch de Parceria');

  if (isPitch) {
    const lines = message.content.split('\n');
    const nicho = lines.find(l => l.startsWith('Nicho:'))?.replace('Nicho: ', '') || '';
    const alcance = lines.find(l => l.startsWith('Alcance:'))?.replace('Alcance: ', '') || '';
    const proposta = lines.find(l => l.startsWith('Proposta:'))?.replace('Proposta: ', '') || '';

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Target className="w-4 h-4" />
            <span className="text-sm font-bold">Pitch de Parceria</span>
          </div>
          {nicho && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Nicho:</span> {nicho}</p>}
          {alcance && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Alcance:</span> {alcance}</p>}
          {proposta && <p className="text-sm text-foreground whitespace-pre-wrap mt-1">{proposta}</p>}
          <p className={`text-[10px] ${isOwn ? 'text-primary/60' : 'text-muted-foreground/60'}`}>
            {moment(message.created_date).format('HH:mm')}
          </p>
        </div>
      </div>
    );
  }

  if (isInvite) {
    // Extract campaign name from content
    const match = message.content.match(/\*Convite para campanha: "(.+?)"\*/);
    const campaignName = match?.[1] || 'Campanha';
    const bodyText = message.content.replace(/🎯\s*\*Convite para campanha: ".+?"\*\n?\n?/, '').trim();

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Target className="w-4 h-4" />
            <span className="text-sm font-bold">Convite para campanha</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{campaignName}</p>
          {bodyText && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bodyText}</p>}
          {!isOwn && (
            <Link to={createPageUrl(profileType === 'creator' ? 'OpportunityFeed' : 'CampaignManager')}>
              <Button size="sm" className="mt-1 min-h-[36px] bg-primary hover:bg-primary/90 text-primary-foreground">
                <Megaphone className="w-3.5 h-3.5 mr-1.5" />
                {profileType === 'creator' ? 'Ver campanhas' : 'Ver campanha'}
              </Button>
            </Link>
          )}
          <p className={`text-[10px] ${isOwn ? 'text-primary/60' : 'text-muted-foreground/60'}`}>
            {moment(message.created_date).format('HH:mm')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 ${
        isOwn 
          ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm' 
          : 'bg-muted text-foreground rounded-2xl rounded-bl-sm'
      }`}>
        <p className="text-sm whitespace-pre-wrap break-words">{String(message.content || '')}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground/60'}`}>
          {moment(message.created_date).format('HH:mm')}
        </p>
      </div>
    </div>
  );
}