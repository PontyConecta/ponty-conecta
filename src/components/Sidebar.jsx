import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  FileText, 
  Search,
  Sparkles,
  Building2,
  Crown
} from 'lucide-react';

export default function Sidebar({ profileType, currentPageName, isSubscribed }) {
  const brandNavItems = [
    { name: 'Dashboard', page: 'BrandDashboard', icon: LayoutDashboard },
    { name: 'Descobrir Criadores', page: 'DiscoverCreators', icon: Search },
    { name: 'Campanhas', page: 'CampaignManager', icon: Megaphone },
    { name: 'Candidaturas', page: 'Applications', icon: Users },
    { name: 'Entregas', page: 'Deliveries', icon: FileText },
  ];

  const creatorNavItems = [
    { name: 'Dashboard', page: 'CreatorDashboard', icon: LayoutDashboard },
    { name: 'Descobrir Marcas', page: 'DiscoverBrands', icon: Building2 },
    { name: 'Oportunidades', page: 'OpportunityFeed', icon: Sparkles },
    { name: 'Minhas Candidaturas', page: 'MyApplications', icon: FileText },
    { name: 'Minhas Entregas', page: 'MyDeliveries', icon: FileText },
  ];

  const navItems = profileType === 'brand' ? brandNavItems : creatorNavItems;

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 flex-col transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                 "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                 isActive 
                   ? 'shadow-sm' 
                   : 'hover:opacity-70'
               )}
               style={isActive ? { backgroundColor: 'rgba(var(--accent-primary), 0.1)', color: 'var(--accent-primary)' } : { color: 'var(--text-secondary)' }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Premium CTA */}
      {!isSubscribed && (
        <div className="p-4 transition-colors" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '1px' }}>
          <Link to={createPageUrl('Subscription')}>
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5" />
                <span className="font-semibold text-sm">Plano Pro</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                Desbloqueie recursos premium e crie campanhas ilimitadas
              </p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}