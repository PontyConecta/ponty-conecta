import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className={`bg-gradient-to-r ${isBrand ? 'from-indigo-600 via-violet-600 to-purple-600' : 'from-orange-500 via-amber-500 to-yellow-500'} p-6 lg:p-8`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className="bg-white/20 text-white border-0 mb-3">
                <Rocket className="w-3 h-3 mr-1" />
                Perfil Pronto!
              </Badge>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Bem-vindo, {name}! 🎉
              </h2>
              <p className="text-white/80 mb-4 max-w-lg">
                {isBrand
                  ? 'Sua marca está configurada. Comece criando sua primeira campanha para encontrar criadores perfeitos.'
                  : 'Seu perfil está pronto. Explore campanhas e candidate-se para trabalhar com grandes marcas.'
                }
              </p>
              
              <div className="flex flex-wrap gap-3">
                {isSubscribed ? (
                  <Link to={createPageUrl(isBrand ? 'CampaignManager' : 'OpportunityFeed')}>
                    <Button className="bg-white text-slate-900 hover:bg-white/90 shadow-lg">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isBrand ? 'Criar Campanha' : 'Ver Campanhas'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link to={createPageUrl('Subscription')}>
                    <Button className="bg-white text-slate-900 hover:bg-white/90 shadow-lg">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Desbloquear Acesso Completo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
                <Link to={createPageUrl(isBrand ? 'DiscoverCreators' : 'DiscoverBrands')}>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
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