import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import BottomNav from '@/components/BottomNav';
import { Toaster } from 'sonner';
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Crown,
  Sparkles,
  Bell,
  ChevronDown,
  Search,
  Building2,
  Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children, currentPageName }) {
  const { user, profile, profileType, loading, logout } = useAuth();
  const { isSubscribed } = useSubscription();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout('/');
  };

  // Public/Guest pages
  const publicPages = ['Home', 'Onboarding', 'SelectProfile', 'OnboardingBrand', 'OnboardingCreator', 
                       'ExploreCampaigns', 'ExploreCreators', 'ExploreBrands'];
  const isPublicPage = publicPages.includes(currentPageName);

  // Guest experience pages (show limited nav)
  const guestPages = ['Home', 'ExploreCampaigns', 'ExploreCreators', 'ExploreBrands'];
  const isGuestPage = guestPages.includes(currentPageName) && !user;

  if (currentPageName === 'Home' && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <style>{`
          :root {
            --primary: 79 70 229;
            --primary-foreground: 255 255 255;
            --accent: 249 115 22;
          }
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        `}</style>
        {children}
      </div>
    );
  }

  if (isPublicPage && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <style>{`
          :root {
            --primary: 79 70 229;
            --primary-foreground: 255 255 255;
            --accent: 249 115 22;
          }
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        `}</style>
        {children}
        {isGuestPage && <BottomNav profileType={null} currentPageName={currentPageName} />}
      </div>
    );
  }

  const brandNavItems = [
    { name: 'Dashboard', page: 'BrandDashboard', icon: LayoutDashboard },
    { name: 'Campanhas', page: 'CampaignManager', icon: Megaphone },
    { name: 'Descobrir', page: 'DiscoverCreators', icon: Search },
    { name: 'Candidaturas', page: 'ApplicationsManager', icon: Users },
    { name: 'Entregas', page: 'DeliveriesManager', icon: FileText },
  ];

  const creatorNavItems = [
    { name: 'Dashboard', page: 'CreatorDashboard', icon: LayoutDashboard },
    { name: 'Oportunidades', page: 'OpportunityFeed', icon: Sparkles },
    { name: 'Marcas', page: 'DiscoverBrands', icon: Building2 },
    { name: 'Candidaturas', page: 'MyApplications', icon: FileText },
    { name: 'Entregas', page: 'MyDeliveries', icon: FileText },
  ];

  const adminNavItems = [
    { name: 'Disputas', page: 'AdminDisputes', icon: Shield },
  ];

  const navItems = profileType === 'brand' ? brandNavItems : creatorNavItems;

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Toaster position="top-right" richColors closeButton />
      <style>{`
        :root {
          --primary: 79 70 229;
          --primary-foreground: 255 255 255;
          --accent: 249 115 22;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .pb-safe {
            padding-bottom: calc(env(safe-area-inset-bottom) + 64px);
          }
        }
      `}</style>

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center justify-between px-4 lg:px-8 h-14 lg:h-16">
          {/* Logo */}
          <Link to={createPageUrl(profileType === 'brand' ? 'BrandDashboard' : 'CreatorDashboard')} className="flex items-center gap-2">
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold text-base lg:text-lg">P</span>
            </div>
            <span className="text-lg lg:text-xl font-semibold text-slate-900 hidden sm:block">Ponty</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${currentPageName === item.page 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            {isAdmin && adminNavItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${currentPageName === item.page 
                    ? 'bg-red-50 text-red-700' 
                    : 'text-red-600 hover:bg-red-50'}
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:gap-3">
            {!isSubscribed && (
              <Link to={createPageUrl('Subscription')}>
                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 h-8 lg:h-9 text-xs lg:text-sm px-3 lg:px-4">
                  <Crown className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Assinar</span>
                  <span className="sm:hidden">Pro</span>
                </Button>
              </Link>
            )}

            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative hidden lg:flex">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 lg:p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <Avatar className="w-7 h-7 lg:w-8 lg:h-8">
                    <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs lg:text-sm font-medium">
                      {user?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm">{profile?.display_name || profile?.company_name || user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {profileType === 'brand' ? 'Marca' : 'Criador'}
                    </Badge>
                    {isSubscribed && (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">
                        Pro
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Profile')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Subscription')} className="cursor-pointer">
                    <Crown className="w-4 h-4 mr-2" />
                    Assinatura
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 lg:pt-16 pb-20 lg:pb-8 min-h-screen">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav profileType={profileType} currentPageName={currentPageName} />
    </div>
  );
}