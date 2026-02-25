import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  FileText, 
  Search,
  Building2,
  Crown,
  Settings,
  User,
  Send,
  PackageCheck,
  Compass,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function Sidebar({ profileType, currentPageName, isSubscribed, isCollapsed, onToggleCollapse }) {
  const brandNavItems = [
    { name: 'Dashboard', page: 'BrandDashboard', icon: LayoutDashboard },
    { name: 'Descobrir Criadores', page: 'DiscoverCreators', icon: Search },
    { name: 'Campanhas', page: 'CampaignManager', icon: Megaphone },
    { name: 'Candidaturas', page: 'Applications', icon: Users },
    { name: 'Entregas de Criadores', page: 'Deliveries', icon: FileText },
    { type: 'divider' },
    { name: 'Meu Perfil', page: 'Profile', icon: User },
    { name: 'Configurações', page: 'Settings', icon: Settings },
  ];

  const creatorNavItems = [
    { name: 'Dashboard', page: 'CreatorDashboard', icon: LayoutDashboard },
    { name: 'Descobrir Marcas', page: 'DiscoverBrands', icon: Building2 },
    { name: 'Campanhas', page: 'OpportunityFeed', icon: Compass },
    { name: 'Minhas Candidaturas', page: 'MyApplications', icon: Send },
    { name: 'Minhas Entregas', page: 'MyDeliveries', icon: PackageCheck },
    { type: 'divider' },
    { name: 'Meu Perfil', page: 'Profile', icon: User },
    { name: 'Configurações', page: 'Settings', icon: Settings },
  ];

  const navItems = profileType === 'brand' ? brandNavItems : creatorNavItems;

  return (
    <TooltipProvider delayDuration={0}>
      {/* hidden below lg, flex at lg+ */}
      <aside 
        className="hidden lg:flex fixed left-0 top-16 bottom-0 flex-col border-r bg-card z-40 overflow-hidden transition-[width] duration-200 ease-in-out"
        style={{ width: isCollapsed ? '64px' : '256px' }}
      >
        {/* Collapse toggle */}
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} px-2 pt-3 flex-shrink-0`}>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={onToggleCollapse}>
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-3'} py-3 space-y-1 overflow-y-auto overflow-x-hidden`}>
          {navItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={`divider-${index}`} className="my-3 border-t" />;
            }
            const isActive = currentPageName === item.page;
            const linkContent = (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150",
                  isCollapsed ? 'justify-center px-2 py-3 min-h-[44px]' : 'px-4 py-3 min-h-[44px]',
                  isActive 
                    ? 'bg-primary/10 text-primary shadow-sm' 
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.page}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="z-[100]">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        {/* Premium CTA */}
        {!isSubscribed && !isCollapsed && (
          <div className="p-4 border-t">
            <Link to={createPageUrl('Subscription')}>
              <div className="p-4 rounded-xl text-white cursor-pointer hover:shadow-lg transition-shadow bg-[#9038fa]">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold text-sm">Plano Premium</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  Desbloqueie recursos premium e crie campanhas ilimitadas
                </p>
              </div>
            </Link>
          </div>
        )}
        {!isSubscribed && isCollapsed && (
          <div className="p-2 pb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={createPageUrl('Subscription')} className="flex justify-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#9038fa]">
                    <Crown className="w-5 h-5" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[100]">
                <p>Plano Premium</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}