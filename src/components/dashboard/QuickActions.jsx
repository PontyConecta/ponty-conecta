import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Megaphone, Search, Users, FileText, Building2, 
  Crown, UserCircle, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

const brandActions = [
  { label: 'Nova Campanha', icon: Plus, page: 'CampaignManager', bg: '#9038fa', requiresSub: true },
  { label: 'Descobrir Criadores', icon: Search, page: 'DiscoverCreators', bg: '#6366f1' },
  { label: 'Candidaturas', icon: Users, page: 'Applications', bg: '#f59e0b' },
  { label: 'Entregas', icon: FileText, page: 'Deliveries', bg: '#10b981' },
];

const creatorActions = [
  { label: 'Campanhas', icon: Megaphone, page: 'OpportunityFeed', bg: '#9038fa' },
  { label: 'Descobrir Marcas', icon: Building2, page: 'DiscoverBrands', bg: '#6366f1' },
  { label: 'Candidaturas', icon: FileText, page: 'Applications', bg: '#f59e0b' },
  { label: 'Meu Perfil', icon: UserCircle, page: 'Profile', bg: '#10b981' },
];

export default function QuickActions({ profileType, isSubscribed }) {
  const actions = profileType === 'brand' ? brandActions : creatorActions;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action, index) => {
        const needsSub = action.requiresSub && !isSubscribed;
        const targetPage = needsSub ? 'Subscription' : action.page;

        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link to={createPageUrl(targetPage)}>
              <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer" 
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative shadow-sm"
                    style={{ backgroundColor: action.bg }}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                    {needsSub && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#9038fa] rounded-full flex items-center justify-center shadow">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {action.label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}