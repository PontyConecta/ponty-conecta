import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { trackPageView } from '@/components/analytics/analyticsUtils';
import { AuthProvider, useAuth } from '@/components/contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from '@/components/contexts/SubscriptionContext';
import { ThemeProvider, useTheme } from '@/components/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { base44 } from '@/api/base44Client';
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
import ThemeSelector from '@/components/ThemeSelector';
import BetaFeedbackNudge from '@/components/feedback/BetaFeedbackNudge';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import BackButton from '@/components/BackButton';
import { LEAF_PAGES } from '@/hooks/useSmartBack';

function LayoutContent({ children, currentPageName }) {
  const { user, profile, profileType, loading, logout } = useAuth();
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const unreadCount = useUnreadCount(user?.id);

  const isAdmin = user?.role === 'admin';
  const noLayoutPages = ['Home', 'SelectProfile', 'OnboardingBrand', 'OnboardingCreator'];

  // Track page view
  useEffect(() => {
    trackPageView(currentPageName);
  }, [currentPageName]);

  // Track activity (1x per session, fire-and-forget)
  useEffect(() => {
    if (!user) return;
    const key = `ponty_activity_${user.id}`;
    const last = sessionStorage.getItem(key);
    if (last) return; // Already tracked this session
    sessionStorage.setItem(key, '1');
    base44.functions.invoke('trackActivity', {}).catch(() => {});
  }, [user]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  if (!loading && !user && !noLayoutPages.includes(currentPageName)) {
    navigate(createPageUrl('Home'));
    return null;
  }

  // Pages without full layout
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  // Redirect incomplete profiles to onboarding
  if (!loading && user && profile && profile.account_state !== 'ready') {
    const onboardingPage = profileType === 'brand' ? 'OnboardingBrand' : 'OnboardingCreator';
    if (currentPageName !== onboardingPage && currentPageName !== 'Subscription') {
      navigate(createPageUrl(onboardingPage));
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Toaster position="top-right" richColors closeButton />

      {/* ── Top Header ── fixed, always visible, z-50 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b h-14 lg:h-16">
        <div className="flex items-center justify-between px-4 lg:px-8 h-full">
          {/* Logo / Back */}
          <div className="flex items-center gap-2">
            {LEAF_PAGES.has(currentPageName) ? (
              <BackButton currentPage={currentPageName} />
            ) : (
              <Link
                to={createPageUrl(profileType === 'brand' ? 'BrandDashboard' : 'CreatorDashboard')}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform bg-primary">
                  <span className="text-primary-foreground font-bold text-base lg:text-lg">P</span>
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-base lg:text-lg font-bold leading-tight text-primary">Ponty</span>
                  <span className="text-[10px] lg:text-xs font-medium text-muted-foreground leading-tight">
                    {profileType === 'brand' ? 'Marcas' : 'Creators'}
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 h-full">
            {/* Support */}
            <AlertDialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full">
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Abrir WhatsApp?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você será redirecionado para o WhatsApp. Deseja continuar?
                </AlertDialogDescription>
                <div className="flex gap-3 justify-end">
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => window.open('https://wa.me/5561998591499?text=Estou%20utilizando%20o%20aplicativo%20e%20preciso%20de%20ajuda.', '_blank')}
                    className="bg-primary hover:bg-primary/80 text-primary-foreground"
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
                <button className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Shield className="w-5 h-5 text-primary" />
                </button>
              </Link>
            )}

            {/* Subscription Button */}
            {!isSubscribed && (
              <Button 
                onClick={() => navigate(createPageUrl('Subscription'))}
                className="h-10 px-4 font-bold rounded-lg shadow-sm bg-primary hover:bg-primary/80 text-primary-foreground min-h-[44px]"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Assinar</span>
              </Button>
            )}

            {/* User Avatar */}
            <Link to={createPageUrl('Settings')} className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full overflow-hidden border-2 border-border hover:opacity-80 transition-opacity duration-150">
              <Avatar className="h-full w-full">
                <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
                <AvatarFallback className="font-bold bg-primary/10 text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Sidebar ── Desktop only: hidden below lg */}
      <Sidebar 
        profileType={profileType} 
        currentPageName={currentPageName}
        isSubscribed={isSubscribed}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        unreadCount={unreadCount}
      />

      {/* ── Main Content ──
           Desktop: pt-16 (header-lg) + left margin for sidebar, no bottom padding
           Mobile: pt-14 (header) + pb for bottom nav safe area
      */}
      <main className={`pt-14 lg:pt-16 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+24px)] lg:pb-6 min-h-[100dvh] transition-[margin-left] duration-200 ease-in-out ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="px-3 py-4 sm:p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* ── Beta Feedback Nudge ── */}
      <BetaFeedbackNudge />

      {/* ── Bottom Nav ── Mobile only: hidden at lg+ */}
      <BottomNav profileType={profileType} currentPageName={currentPageName} unreadCount={unreadCount} />
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