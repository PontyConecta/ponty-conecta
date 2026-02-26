import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { UserCircle, ArrowRight } from 'lucide-react';
import { getMissingFieldsMessage } from './utils/profileValidation';

export default function ProfileIncompleteAlert({ missingFields, profileType }) {
  if (!missingFields || missingFields.length === 0) return null;

  const message = getMissingFieldsMessage(missingFields);
  const actionLabel = profileType === 'brand' 
    ? 'criar campanhas e aparecer no expositor de marcas' 
    : 'se candidatar a oportunidades e aparecer no expositor de criadores';

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 lg:p-5">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <UserCircle className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm lg:text-base text-foreground leading-tight">
            Complete seu perfil para começar
          </h3>
          <p className="text-sm mt-1 text-muted-foreground">
            Preencha as informações básicas antes de {actionLabel}.
          </p>
          <div className="mt-3 p-2.5 rounded-lg bg-primary/[0.06] border border-primary/10">
            <p className="text-xs font-medium text-muted-foreground">
              📋 {message}
            </p>
          </div>
          <Link to={createPageUrl('Profile')} className="inline-block mt-3">
            <Button size="sm" className="shadow-sm h-9 px-4 text-xs font-semibold">
              Completar Perfil
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}