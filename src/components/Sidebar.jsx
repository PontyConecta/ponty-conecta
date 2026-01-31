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
  const brandNavSections = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', page: 'BrandDashboard', icon: LayoutDashboard },
        { name: 'Descobrir Criadores', page: 'DiscoverCreators', icon: Search },
      ]
    },
    {
      title: 'Gestão',
      items: [
        { name: 'Campanhas', page: 'CampaignManager', icon: Megaphone },
        { name: 'Candidaturas', page: 'Applications', icon: Users },
        { name: 'Entregas', page: 'Deliveries', icon: FileText },
      ]
    }
  ];

  const creatorNavSections = [
    {
      title: 'Navegação',
      items: [
        { name: 'Dashboard', page: 'CreatorDashboard', icon: LayoutDashboard },
        { name: 'Oportunidades', page: 'OpportunityFeed', icon: Sparkles },
        { name: 'Descobrir Marcas', page: 'DiscoverBrands', icon: Building2 },
        { name: 'Minhas Candidaturas', page: 'MyApplications', icon: FileText },
        { name: 'Minhas Entregas', page: 'MyDeliveries', icon: FileText },
      ]
    }
  ];

  const navSections = profileType === 'brand' ? brandNavSections : creatorNavSections;

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 flex-col">
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Premium CTA */}
      {!isSubscribed && (
        <div className="p-4 border-t border-slate-200">
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