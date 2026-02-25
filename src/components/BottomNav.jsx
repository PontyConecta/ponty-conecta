import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Megaphone, 
  FileText, 
  Search,
  Building2
} from 'lucide-react';

export default function BottomNav({ profileType, currentPageName }) {
  const brandNavItems = [
    { name: 'Início', page: 'BrandDashboard', icon: LayoutDashboard },
    { name: 'Campanhas', page: 'CampaignManager', icon: Megaphone },
    { name: 'Descobrir', page: 'DiscoverCreators', icon: Search },
    { name: 'Entregas', page: 'DeliveriesManager', icon: FileText },
  ];

  const creatorNavItems = [
    { name: 'Início', page: 'CreatorDashboard', icon: LayoutDashboard },
    { name: 'Campanhas', page: 'OpportunityFeed', icon: Megaphone },
    { name: 'Marcas', page: 'DiscoverBrands', icon: Search },
    { name: 'Entregas', page: 'MyDeliveries', icon: FileText },
  ];

  const guestNavItems = [
    { name: 'Início', page: 'Home', icon: LayoutDashboard },
    { name: 'Campanhas', page: 'OpportunityFeed', icon: Megaphone },
    { name: 'Criadores', page: 'DiscoverCreators', icon: Search },
    { name: 'Marcas', page: 'DiscoverBrands', icon: Building2 },
  ];

  const navItems = profileType === 'brand' 
    ? brandNavItems 
    : profileType === 'creator' 
      ? creatorNavItems 
      : guestNavItems;

  return (
    /* fixed bottom, HIDDEN at lg+ (desktop uses sidebar) */
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t shadow-[0_-2px_8px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[64px] transition-all active:scale-95 select-none",
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}