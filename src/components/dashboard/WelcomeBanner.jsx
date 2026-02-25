import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WelcomeBanner({ profileType, name, isSubscribed }) {
  const isBrand = profileType === 'brand';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border bg-card shadow-sm">
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className="bg-primary/10 text-primary border-0 mb-3">
                <Rocket className="w-3 h-3 mr-1" />
                Perfil Pronto!
              </Badge>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                Bem-vindo, {name}! 🎉
              </h2>
              <p className="text-muted-foreground mb-5 max-w-lg">
                {isBrand
                  ? 'Sua marca está configurada. Comece criando sua primeira campanha para encontrar criadores perfeitos.'
                  : 'Seu perfil está pronto. Explore campanhas e candidate-se para trabalhar com grandes marcas.'
                }
              </p>
              
              <div className="flex flex-wrap gap-3">
                {isSubscribed ? (
                  <Link to={createPageUrl(isBrand ? 'CampaignManager' : 'OpportunityFeed')}>
                    <Button className="bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isBrand ? 'Criar Campanha' : 'Ver Campanhas'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link to={createPageUrl('Subscription')}>
                    <Button className="bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Desbloquear Acesso Completo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
                <Link to={createPageUrl(isBrand ? 'DiscoverCreators' : 'DiscoverBrands')}>
                  <Button variant="outline">
                    {isBrand ? 'Descobrir Criadores' : 'Descobrir Marcas'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}