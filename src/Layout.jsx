import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { AuthProvider, useAuth } from '@/components/contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from '@/components/contexts/SubscriptionContext';
import { ThemeProvider, useTheme } from '@/components/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import NotificationDropdown from '@/components/NotificationDropdown';
import AdminMenu from '@/components/AdminMenu';
import ThemeSelector from '@/components/ThemeSelector';
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
  User,
  HelpCircle,
  BarChart3,
  Zap
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

function LayoutContent({ children, currentPageName }) {
    const { user, profile, profileType, loading, logout } = useAuth();
    const { isSubscribed } = useSubscription();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout('/');
  };

  // Pages que não precisam de layout completo
        const noLayoutPages = ['Home', 'SelectProfile', 'OnboardingBrand', 'OnboardingCreator'];

        // Redirect to login if not authenticated (except special pages)
        if (!loading && !user && !noLayoutPages.includes(currentPageName)) {
          window.location.href = '/';
          return null;
        }

        // Pages without full layout (Home, SelectProfile, Onboarding)
        if (noLayoutPages.includes(currentPageName)) {
          return (
            <div className="min-h-screen">
                <style>{`
                  [data-theme="light"] {
                    --bg-primary: #f8fafc;
                    --bg-secondary: #ffffff;
                    --text-primary: #0f172a;
                    --text-secondary: #64748b;
                    --border-color: #e2e8f0;
                    --accent-primary: #4f46e5;
                  }

                  [data-theme="dark"] {
                    --bg-primary: #0f172a;
                    --bg-secondary: #1e293b;
                    --text-primary: #f1f5f9;
                    --text-secondary: #cbd5e1;
                    --border-color: #334155;
                    --accent-primary: #6366f1;
                  }

                  [data-theme="musk"] {
                    --bg-primary: #1a1a2e;
                    --bg-secondary: #16213e;
                    --text-primary: #eaeaea;
                    --text-secondary: #b0b0b0;
                    --border-color: #2d3561;
                    --accent-primary: #e94560;
                  }

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

          // Se usuário está autenticado mas não tem perfil completo, redireciona
          if (!loading && user && profile && profile.account_state === 'exploring') {
            const onboardingPage = profileType === 'brand' ? 'OnboardingBrand' : 'OnboardingCreator';
            if (currentPageName !== onboardingPage && currentPageName !== 'Subscription') {
              window.location.href = createPageUrl(onboardingPage);
              return null;
            }
          }

  const brandNavItems = [
    { name: 'Dashboard', page: 'BrandDashboard', icon: LayoutDashboard },
    { name: 'Campanhas', page: 'CampaignManager', icon: Megaphone },
    { name: 'Descobrir', page: 'DiscoverCreators', icon: Search },
    { name: 'Candidaturas', page: 'Applications', icon: Users },
    { name: 'Entregas', page: 'Deliveries', icon: FileText },
  ];

  const creatorNavItems = [
    { name: 'Dashboard', page: 'CreatorDashboard', icon: LayoutDashboard },
    { name: 'Oportunidades', page: 'OpportunityFeed', icon: Sparkles },
    { name: 'Marcas', page: 'DiscoverBrands', icon: Building2 },
    { name: 'Candidaturas', page: 'Applications', icon: FileText },
    { name: 'Entregas', page: 'Deliveries', icon: FileText },
  ];

  const navItems = profileType === 'brand' ? brandNavItems : creatorNavItems;

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  return (
    <ThemeProviderWrapper>
      <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Toaster position="top-right" richColors closeButton />
      <style>{`
        :root {
          --primary: 79 70 229;
          --primary-foreground: 255 255 255;
          --accent: 249 115 22;
          --bg-primary: #f8fafc;
          --bg-secondary: #ffffff;
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --border-color: #e2e8f0;
          --accent-primary: #4f46e5;
        }

        [data-theme="light"] {
          --bg-primary: #f8fafc;
          --bg-secondary: #ffffff;
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --border-color: #e2e8f0;
          --accent-primary: #4f46e5;
        }

        [data-theme="dark"] {
          --bg-primary: #0f172a;
          --bg-secondary: #1e293b;
          --text-primary: #f1f5f9;
          --text-secondary: #cbd5e1;
          --border-color: #334155;
          --accent-primary: #6366f1;
        }

        [data-theme="musk"] {
          --bg-primary: #1a1a2e;
          --bg-secondary: #16213e;
          --text-primary: #eaeaea;
          --text-secondary: #b0b0b0;
          --border-color: #2d3561;
          --accent-primary: #e94560;
        }

        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .pb-safe {
            padding-bottom: calc(env(safe-area-inset-bottom) + 80px);
          }
        }
        @media (max-width: 1024px) {
          .pb-safe {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 80px);
          }
        }
      `}</style>

      {/* Top Navigation */}
       <header className="fixed top-0 left-0 right-0 z-50 transition-colors border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-4 lg:px-8 h-14 lg:h-16">
          {/* Logo */}
          <Link to={createPageUrl(profileType === 'brand' ? 'BrandDashboard' : 'CreatorDashboard')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-base lg:text-lg">P</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base lg:text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-tight">Ponty</span>
              <span className="text-[10px] lg:text-xs font-medium text-slate-500 leading-tight">
                {profileType === 'brand' ? 'Marcas' : 'Creators'}
              </span>
            </div>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden sm:block">
              <ThemeSelector />
            </div>

            {!isSubscribed && (
              <Link to={createPageUrl('Subscription')}>
                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 h-8 lg:h-9 text-xs lg:text-sm px-3 lg:px-4">
                  <Crown className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Assinar</span>
                  <span className="sm:hidden">Pro</span>
                </Button>
              </Link>
            )}

            <NotificationDropdown />

            {isAdmin && <AdminMenu currentPageName={currentPageName} />}

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
                <div className="px-3 py-2.5">
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
                    <User className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Subscription')} className="cursor-pointer">
                    <Crown className="w-4 h-4 mr-2" />
                    {isSubscribed ? 'Gerenciar Assinatura' : 'Assinar Premium'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Profile')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation - Desktop */}
      <Sidebar 
        profileType={profileType} 
        currentPageName={currentPageName}
        isSubscribed={isSubscribed}
      />

      {/* Main Content */}
      <main className="pt-14 lg:pt-16 lg:pl-64 pb-20 lg:pb-8 min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav profileType={profileType} currentPageName={currentPageName} />
      </div>
      </ThemeProviderWrapper>
      );
      }



      export default function Layout({ children, currentPageName }) {
        return (
          <ErrorBoundary>
            <AuthProvider>
              <SubscriptionProvider>
                <ThemeProvider>
                  <LayoutContent children={children} currentPageName={currentPageName} />
                </ThemeProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </ErrorBoundary>
        );
      }