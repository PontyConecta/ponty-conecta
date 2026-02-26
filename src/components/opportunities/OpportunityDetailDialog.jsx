import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Send,
  CheckCircle2,
  Hash,
  AtSign,
  ListChecks,
  Ban,
} from 'lucide-react';

export default function OpportunityDetailDialog({
  campaign,
  brand,
  applied,
  onStartApplication,
  onClose,
}) {
  if (!campaign) return null;

  return (
    <>
      {/* Cover */}
      {campaign.cover_image_url && (
        <div className="h-40 rounded-xl overflow-hidden">
          <img src={campaign.cover_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Brand & Title */}
      <div className="flex items-center gap-4">
        {brand?.logo_url ? (
          <img src={brand.logo_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-muted">
            <Building2 className="w-7 h-7 text-muted-foreground" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{campaign.title}</h2>
          <p className="text-muted-foreground">{brand?.company_name}</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <h4 className="font-medium mb-2">Descrição</h4>
        <p className="text-muted-foreground">{campaign.description}</p>
      </div>

      {/* Target Audience */}
      {campaign.target_audience && (
        <div>
          <h4 className="font-medium mb-2">Público-Alvo</h4>
          <p className="text-muted-foreground">{campaign.target_audience}</p>
        </div>
      )}

      {/* Requirements */}
      {campaign.requirements && (
        <div className="p-4 rounded-xl bg-muted">
          <h4 className="font-medium mb-2">Requisitos e Entregas</h4>
          <p className="text-muted-foreground">{campaign.requirements}</p>
        </div>
      )}

      {/* Content Guidelines */}
      {campaign.content_guidelines && (
        <div>
          <h4 className="font-medium mb-2">Diretrizes de Conteúdo</h4>
          <p className="text-muted-foreground">{campaign.content_guidelines}</p>
        </div>
      )}

      {/* Do's and Don'ts */}
      {(campaign.dos?.length > 0 || campaign.donts?.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {campaign.dos?.filter(d => d).length > 0 && (
            <div className="p-4 bg-emerald-500/10 rounded-xl">
              <h4 className="font-medium text-emerald-600 mb-2 flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                O que FAZER
              </h4>
              <ul className="space-y-1">
                {campaign.dos.filter(d => d).map((item, i) => (
                  <li key={i} className="text-sm text-emerald-600 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {campaign.donts?.filter(d => d).length > 0 && (
            <div className="p-4 bg-red-500/10 rounded-xl">
              <h4 className="font-medium text-red-500 mb-2 flex items-center gap-2">
                <Ban className="w-4 h-4" />
                O que NÃO FAZER
              </h4>
              <ul className="space-y-1">
                {campaign.donts.filter(d => d).map((item, i) => (
                  <li key={i} className="text-sm text-red-500 flex items-start gap-2">
                    <Ban className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Hashtags & Mentions */}
      {(campaign.hashtags?.filter(h => h).length > 0 || campaign.mentions?.filter(m => m).length > 0) && (
        <div className="flex flex-wrap gap-2">
          {campaign.hashtags?.filter(h => h).map((tag, i) => (
            <Badge key={i} className="bg-blue-100 text-blue-700 border-0">
              <Hash className="w-3 h-3 mr-1" />{tag}
            </Badge>
          ))}
          {campaign.mentions?.filter(m => m).map((mention, i) => (
            <Badge key={i} className="bg-violet-100 text-violet-700 border-0">
              <AtSign className="w-3 h-3 mr-1" />{mention}
            </Badge>
          ))}
        </div>
      )}

      {/* Platforms & Content Types */}
      <div className="flex flex-wrap gap-2">
        {campaign.platforms?.map((p, i) => (
          <Badge key={i} variant="outline">{p}</Badge>
        ))}
        {campaign.content_type?.map((ct, i) => (
          <Badge key={i} variant="outline" className="bg-muted">{ct}</Badge>
        ))}
      </div>

      {/* Remuneration */}
      <div className="p-4 rounded-xl bg-muted">
        <h4 className="font-medium mb-2">Remuneração</h4>
        {campaign.remuneration_type === 'cash' && (
          <p className="text-lg font-semibold">
            R$ {campaign.budget_min || 0} - {campaign.budget_max || 0}
          </p>
        )}
        {campaign.remuneration_type === 'barter' && (
          <div>
            <Badge className="bg-pink-100 text-pink-700 border-0 mb-2">Permuta</Badge>
            {campaign.barter_description && <p className="text-muted-foreground">{campaign.barter_description}</p>}
            {campaign.barter_value && <p className="text-sm mt-1 text-muted-foreground">Valor estimado: R$ {campaign.barter_value}</p>}
          </div>
        )}
        {campaign.remuneration_type === 'mixed' && (
          <div>
            <Badge className="bg-violet-100 text-violet-700 border-0 mb-2">Misto</Badge>
            <p className="text-muted-foreground">
              R$ {campaign.budget_min || 0} - {campaign.budget_max || 0} + Permuta
            </p>
            {campaign.barter_description && <p className="text-sm mt-1 text-muted-foreground">{campaign.barter_description}</p>}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Fechar
        </Button>
        {!applied && (
          <Button onClick={onStartApplication} className="flex-1 bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm min-h-[44px]">
            <Send className="w-4 h-4 mr-2" />
            Candidatar-se
          </Button>
        )}
      </div>
    </>
  );
}