import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { getMissingFieldsMessage } from './utils/profileValidation';

export default function ProfileIncompleteAlert({ missingFields, profileType }) {
  if (!missingFields || missingFields.length === 0) return null;

  const message = getMissingFieldsMessage(missingFields);
  const actionLabel = profileType === 'brand' 
    ? 'criar campanhas e aparecer no expositor de marcas' 
    : 'se candidatar a oportunidades e aparecer no expositor de criadores';

  return (
    <Card className="border-amber-300">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1 text-base lg:text-lg">
              Complete seu perfil para começar
            </h3>
            <p className="text-sm lg:text-base mb-3 text-muted-foreground">
              Você precisa preencher informações básicas do seu perfil antes de {actionLabel}.
            </p>
            <div className="p-3 rounded-lg border bg-muted mb-4">
              <p className="text-sm font-medium text-muted-foreground">
                📋 {message}
              </p>
            </div>
            <Link to={createPageUrl('Profile')}>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                Completar Perfil
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}