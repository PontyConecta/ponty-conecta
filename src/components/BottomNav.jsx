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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t shadow-[0_-2px_8px_rgba(0,0,0,0.06)] safe-area-bottom">
      <div className="flex items-stretch h-[72px]">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 min-h-[48px] rounded-none transition-all duration-150 active:scale-95 select-none",
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-colors duration-150", isActive && "w-[22px] h-[22px]")} />
              <span className={cn("text-[10px] font-medium leading-none transition-colors duration-150", isActive && "font-semibold")}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}