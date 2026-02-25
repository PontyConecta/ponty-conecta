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
// BackButton removed
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

              // Rastrear página visualizada
              useEffect(() => {
                trackPageView(currentPageName);
              }, [currentPageName]);

  // Pages que não precisam de layout completo
        const noLayoutPages = ['Home', 'SelectProfile', 'OnboardingBrand', 'OnboardingCreator'];

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


                          <style>{`
                  [data-theme="light"] {
                    --bg-primary: #f6f6f6;
                    --bg-secondary: #ffffff;
                    --text-primary: #0f172a;
                    --text-secondary: #64748b;
                    --border-color: #ffffff;
                    --accent-primary: #9038fa;
                    --accent-light: #b77aff;
                  }

                  [data-theme="dark"] {
                    --bg-primary: #0f1419;
                    --bg-secondary: #1a2332;
                    --text-primary: #e8ecf1;
                    --text-secondary: #9ba8b8;
                    --border-color: #2a3a52;
                    --accent-primary: #b77aff;
                    --accent-light: #9038fa;
                    --card-bg: #1a2332;
                  }

                  [data-theme="musk"] {
                    --bg-primary: #17101e;
                    --bg-secondary: #2a1c38;
                    --text-primary: #f3eef8;
                    --text-secondary: #94a3b8;
                    --border-color: #5a3a75;
                    --accent-primary: #b77aff;
                    --accent-light: #9038fa;
                    --card-bg: #2a1c38;
                  }

                  :root {
                  --primary: 144 56 250;
                  --primary-foreground: 255 255 255;
                  --accent: 183 122 255;
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
            if (!loading && user && profile && profile.account_state !== 'ready') {
              const onboardingPage = profileType === 'brand' ? 'OnboardingBrand' : 'OnboardingCreator';
              if (currentPageName !== onboardingPage && currentPageName !== 'Subscription') {
                navigate(createPageUrl(onboardingPage));
                return null;
              }
            }

  const isAdmin = user?.role === 'admin';

  // Pages that don't need back button
  const noBackButtonPages = ['BrandDashboard', 'CreatorDashboard'];

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Toaster position="top-right" richColors closeButton />
      <style>{`
      :root {
      --primary: 144 56 250;
      --primary-foreground: 255 255 255;
      --accent: 183 122 255;
      --bg-primary: #f6f6f6;
      --bg-secondary: #ffffff;
      --text-primary: #0f172a;
      --text-secondary: #64748b;
      --text-input: #0f172a;
      --border-color: #e2e8f0;
      --accent-primary: #9038fa;
      --accent-light: #b77aff;
      }

      [data-theme="light"] {
      --bg-primary: #f6f6f6;
      --bg-secondary: #ffffff;
      --text-primary: #0f172a;
      --text-secondary: #64748b;
      --text-input: #0f172a;
      --border-color: #e2e8f0;
      --accent-primary: #9038fa;
      --accent-light: #b77aff;
      }

      [data-theme="dark"] {
      --bg-primary: #0a0e27;
      --bg-secondary: #1a1f3a;
      --text-primary: #f0f4f8;
      --text-secondary: #8a96aa;
      --text-input: #f0f4f8;
      --border-color: #2a3a52;
      --accent-primary: #b77aff;
      --accent-light: #9038fa;
      }

      [data-theme="musk"] {
      --bg-primary: #1a1624;
      --bg-secondary: #2d1f3a;
      --text-primary: #f5f1f8;
      --text-secondary: #94a3b8;
      --text-input: #f5f1f8;
      --border-color: #5a4577;
      --accent-primary: #b77aff;
      --accent-light: #9038fa;
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
          {/* Back Button + Logo */}
          <div className="flex items-center gap-2">
            {/* BackButton removed */}
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
      />

      {/* Main Content */}
      <main className="pt-14 lg:pt-16 lg:pl-64 pb-20 lg:pb-6 min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
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