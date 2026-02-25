import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { trackPageView } from '@/components/analytics/analyticsUtils';
import { AuthProvider, useAuth } from '@/components/contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from '@/components/contexts/SubscriptionContext';
import { ThemeProvider, useTheme } from '@/components/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import NotificationDropdown from '@/components/NotificationDropdown';
import { Toaster } from 'sonner';
import { 
        Crown,
        HelpCircle,
        Shield
      } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function LayoutContent({ children, currentPageName }) {
  const { user, profile, profileType, loading, logout } = useAuth();
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isAdmin = user?.role === 'admin';
  const noLayoutPages = ['Home', 'SelectProfile', 'OnboardingBrand', 'OnboardingCreator'];
  const noBackButtonPages = ['BrandDashboard', 'CreatorDashboard'];

  // Rastrear página visualizada
  useEffect(() => {
    trackPageView(currentPageName);
  }, [currentPageName]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Redirect to login if not authenticated (except special pages)
  if (!loading && !user && !noLayoutPages.includes(currentPageName)) {
    navigate(createPageUrl('Home'));
    return null;
  }

  // Pages without full layout (Home, SelectProfile, Onboarding)
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen">
        {/* Facebook Pixel */}
        <script async src="https://connect.facebook.net/en_US/fbevents.js"></script>
        <script>{`
          window.fbq = window.fbq || function() { (window.fbq.q = window.fbq.q || []).push(arguments); };
          window.fbq('init', '${import.meta.env.VITE_FACEBOOK_PIXEL_ID || ''}');
          window.fbq('setTestEventCode', 'TEST9662');
          window.fbq('track', 'PageView');
        `}</script>
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=${import.meta.env.VITE_FACEBOOK_PIXEL_ID || ''}&ev=PageView&noscript=1"
          />
        </noscript>
        {children}
      </div>
    );
  }

  // Se usuário está autenticado mas não tem perfil completo, redireciona
  if (!loading && user && profile && profile.account_state !== 'ready') {
    const onboardingPage = profileType === 'brand' ? 'OnboardingBrand' : 'OnboardingCreator';
    if (currentPageName !== onboardingPage && currentPageName !== 'Subscription') {
      navigate(createPageUrl(onboardingPage));
      return null;
    }
  }

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Toaster position="top-right" richColors closeButton />

      {/* Top Navigation */}
       <header className="fixed top-0 left-0 right-0 z-50 transition-colors border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-4 lg:px-8 h-14 lg:h-16">
          {/* Back Button + Logo */}
          <div className="flex items-center gap-2">
            <Link to={createPageUrl(profileType === 'brand' ? 'BrandDashboard' : 'CreatorDashboard')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform" style={{ backgroundColor: '#9038fa' }}>
              <span className="text-white font-bold text-base lg:text-lg">P</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base lg:text-lg font-bold leading-tight" style={{ color: '#9038fa' }}>Ponty</span>
              <span className="text-[10px] lg:text-xs font-medium text-slate-500 leading-tight">
                {profileType === 'brand' ? 'Marcas' : 'Creators'}
              </span>
            </div>
          </Link>
          </div>

          {/* Right Section - Fixed Alignment */}
          <div className="flex items-center gap-3 h-full">
            {/* Support Button */}
            <AlertDialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-purple-500/10">
                  <HelpCircle className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <AlertDialogTitle style={{ color: 'var(--text-primary)' }}>Abrir WhatsApp?</AlertDialogTitle>
                <AlertDialogDescription style={{ color: 'var(--text-secondary)' }}>
                  Você será redirecionado para o WhatsApp. Deseja continuar?
                </AlertDialogDescription>
                <div className="flex gap-3 justify-end">
                  <AlertDialogCancel style={{ color: 'var(--text-primary)' }}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => window.open('https://wa.me/5561998591499?text=Estou%20utilizando%20o%20aplicativo%20e%20preciso%20de%20ajuda.', '_blank')}
                    className="bg-[#9038fa] hover:bg-[#7a2de0] text-white"
                  >
                    Abrir WhatsApp
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>

            {/* Notifications */}
            <NotificationDropdown />

                {/* Admin Link */}
                {isAdmin && (
                  <Link to={createPageUrl('AdminDashboard')}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-purple-500/10">
                      <Shield className="w-5 h-5" style={{ color: '#9038fa' }} />
                    </Button>
                  </Link>
                )}

                {/* Subscription Button */}
                {!isSubscribed && (
                  <Button 
                    onClick={() => window.location.href = createPageUrl('Subscription')}
                    className="h-9 px-4 font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
                    style={{ 
                      backgroundColor: '#9038fa',
                      color: 'white'
                    }}
                  >
                    <Crown className="w-4 h-4" />
                    <span className="hidden sm:inline">Assinar</span>
                  </Button>
                )}

                {/* User Avatar - Links to Settings */}
                <Link to={createPageUrl('Settings')} className="relative h-10 w-10 rounded-full overflow-hidden border-2 hover:opacity-80 transition-opacity" style={{ borderColor: 'var(--border-color)' }}>
                      <Avatar className="h-full w-full">
                        <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
                        <AvatarFallback className="font-bold" style={{ backgroundColor: 'rgba(144, 56, 250, 0.1)', color: '#9038fa' }}>
                          {user?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation - Desktop */}
      <Sidebar 
        profileType={profileType} 
        currentPageName={currentPageName}
        isSubscribed={isSubscribed}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Content */}
      <main className={`pt-14 lg:pt-16 pb-mobile-safe lg:pb-6 min-h-screen transition-[margin-left] duration-200 ease-in-out ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`} style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="px-3 py-4 sm:p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav profileType={profileType} currentPageName={currentPageName} />
      </div>
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