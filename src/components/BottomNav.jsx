import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  FileText, 
  Sparkles,
  Search,
  User,
  Building2
} from 'lucide-react';

export default function BottomNav({ profileType, currentPageName }) {
  const brandNavItems = [
    { name: 'Início', page: 'BrandDashboard', icon: LayoutDashboard },
    { name: 'Campanhas', page: 'CampaignManager', icon: Megaphone },
    { name: 'Descobrir', page: 'DiscoverCreators', icon: Search },
    { name: 'Entregas', page: 'DeliveriesManager', icon: FileText },
    { name: 'Perfil', page: 'Profile', icon: Building2 },
  ];

  const creatorNavItems = [
    { name: 'Início', page: 'CreatorDashboard', icon: LayoutDashboard },
    { name: 'Vagas', page: 'OpportunityFeed', icon: Sparkles },
    { name: 'Marcas', page: 'DiscoverBrands', icon: Search },
    { name: 'Entregas', page: 'MyDeliveries', icon: FileText },
    { name: 'Perfil', page: 'Profile', icon: User },
  ];

  const guestNavItems = [
    { name: 'Início', page: 'Home', icon: LayoutDashboard },
    { name: 'Campanhas', page: 'ExploreCampaigns', icon: Sparkles },
    { name: 'Criadores', page: 'ExploreCreators', icon: Users },
    { name: 'Marcas', page: 'ExploreBrands', icon: Building2 },
  ];

  const navItems = profileType === 'brand' 
    ? brandNavItems 
    : profileType === 'creator' 
      ? creatorNavItems 
      : guestNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`
                flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[64px]
                transition-all active:scale-95
                ${isActive 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-600' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}