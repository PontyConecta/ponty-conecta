import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { UserCircle, ArrowRight, Camera } from 'lucide-react';
import { getMissingFieldsMessage } from './utils/profileValidation';

export default function ProfileIncompleteAlert({ missingFields, profileType, profile }) {
  const hasIncomplete = missingFields && missingFields.length > 0;
  const showAvatarHint = !hasIncomplete && profileType === 'creator' && profile && !profile.avatar_url;

  if (!hasIncomplete && !showAvatarHint) return null;

  if (hasIncomplete) {
    const message = getMissingFieldsMessage(missingFields);
    const actionLabel = profileType === 'brand' 
      ? 'criar campanhas e aparecer no expositor de marcas' 
      : 'se candidatar a oportunidades e aparecer no expositor de criadores';

    return (
      <div className="rounded-xl border border-[#9038fa]/20 bg-[#9038fa]/[0.04] p-4 lg:p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#9038fa]/10 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-5 h-5 text-[#9038fa]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm lg:text-base text-foreground leading-tight">
              Complete seu perfil para começar
            </h3>
            <p className="text-sm mt-1 text-muted-foreground">
              Preencha as informações básicas antes de {actionLabel}.
            </p>
            <div className="mt-3 p-2.5 rounded-lg bg-[#9038fa]/[0.06] border border-[#9038fa]/10">
              <p className="text-xs font-medium text-muted-foreground">
                📋 {message}
              </p>
            </div>
            <Link to={createPageUrl('Profile')} className="inline-block mt-3">
              <Button size="sm" className="bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm h-9 px-4 text-xs font-semibold">
                Completar Perfil
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Soft avatar hint — informative, not blocking
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 lg:p-5">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <Camera className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm lg:text-base text-foreground leading-tight">
            Adicione uma foto de perfil
          </h3>
          <p className="text-sm mt-1 text-muted-foreground">
            Perfis com foto aparecem primeiro nas buscas e aumentam suas chances de receber campanhas.
          </p>
          <Link to={createPageUrl('Profile')} className="inline-block mt-3">
            <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10 shadow-sm h-9 px-4 text-xs font-semibold">
              Adicionar Foto
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}