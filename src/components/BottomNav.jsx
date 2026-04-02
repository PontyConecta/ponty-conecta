import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Megaphone, 
  Search,
  Building2,
  MessageCircle,
  User
} from 'lucide-react';

export default function BottomNav({ profileType, currentPageName, unreadCount = 0 }) {
  const brandNavItems = [
    { name: 'Início', page: 'BrandDashboard', icon: LayoutDashboard },
    { name: 'Campanhas', page: 'CampaignManager', icon: Megaphone, alsoActive: ['Applications'] },
    { name: 'Direct', page: 'Inbox', icon: MessageCircle },
    { name: 'Descobrir', page: 'DiscoverCreators', icon: Search },
    { name: 'Perfil', page: 'Profile', icon: User },
  ];

  const creatorNavItems = [
    { name: 'Início', page: 'CreatorDashboard', icon: LayoutDashboard },
    { name: 'Campanhas', page: 'OpportunityFeed', icon: Megaphone, alsoActive: ['Applications'] },
    { name: 'Direct', page: 'Inbox', icon: MessageCircle },
    { name: 'Marcas', page: 'DiscoverBrands', icon: Search },
    { name: 'Perfil', page: 'Profile', icon: User },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t shadow-[0_-2px_8px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-stretch" style={{ height: 'var(--bottom-nav-height, 72px)' }}>
        {navItems.map((item) => {
          const isActive = currentPageName === item.page || (item.alsoActive && item.alsoActive.includes(currentPageName));
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
              <div className="relative">
                <item.icon className={cn("w-5 h-5 transition-colors duration-150", isActive && "w-[22px] h-[22px]")} />
                {item.page === 'Inbox' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium leading-none transition-colors duration-150", isActive && "font-semibold")}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}