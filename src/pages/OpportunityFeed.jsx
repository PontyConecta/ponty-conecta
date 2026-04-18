import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BrandProfileModal from '../components/modals/BrandProfileModal';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Megaphone, Crown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPageTitle, getEmptyMessage } from '@/components/utils/creatorTypeConfig';
import PaywallModal from '@/components/PaywallModal';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/components/contexts/AuthContext';
import { useOpportunityFeedViewModel } from '@/components/hooks/useOpportunityFeedViewModel';
import { useInfiniteScroll } from '@/components/hooks/useInfiniteScroll';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import OpportunityFilters from '@/components/opportunities/OpportunityFilters';
import OpportunityDetailDialog from '@/components/opportunities/OpportunityDetailDialog';
import ApplyToCampaignDialog from '@/components/opportunities/ApplyToCampaignDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Applications from './Applications';

export default function OpportunityFeed() {
  const { profile: authProfile, profileType } = useAuth();
  const navigate = useNavigate();
  const [viewingBrand, setViewingBrand] = useState(null);
  const vm = useOpportunityFeedViewModel(authProfile, profileType);
  const { loadMoreRef } = useInfiniteScroll(vm.handleLoadMore, vm.hasNextPage);

  // Deep-link: open campaign from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const campaignId = params.get('campaignId');
    if (campaignId && vm.filteredCampaigns.length > 0) {
      const target = vm.filteredCampaigns.find(c => c.id === campaignId);
      if (target) vm.openCampaignDetails(target);
    }
  }, [vm.filteredCampaigns.length]);

  // Pull to refresh (touch)
  useEffect(() => {
    let activeMoveHandler = null;
    const handleTouchStart = (e) => {
      const startY = e.touches[0].clientY;
      const handleMove = (e2) => {
        if (e2.touches[0].clientY - startY > 100 && window.scrollY === 0) {
          vm.handleRefresh();
          document.removeEventListener('touchmove', handleMove);
          activeMoveHandler = null;
        }
      };
      activeMoveHandler = handleMove;
      document.addEventListener('touchmove', handleMove);
      const handleEnd = () => {
        document.removeEventListener('touchmove', handleMove);
        activeMoveHandler = null;
      };
      document.addEventListener('touchend', handleEnd, { once: true });
    };
    document.addEventListener('touchstart', handleTouchStart);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      if (activeMoveHandler) document.removeEventListener('touchmove', activeMoveHandler);
    };
  }, [vm.handleRefresh]);

  const creatorType = authProfile?.creator_type;
  const pageTitle = getPageTitle(creatorType);

  if (vm.isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Pull to Refresh Indicator */}
      {vm.refreshing && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg bg-card">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
            {pageTitle}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {vm.filteredCampaigns.length} campanhas disponíveis
          </p>
        </div>
      </div>

      {/* Profile Incomplete Alert */}
      {!vm.profileValidation.isComplete && (
        <ProfileIncompleteAlert missingFields={vm.profileValidation.missingFields} profileType="creator" />
      )}

      <Tabs defaultValue="feed" className="space-y-5">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="feed" className="flex-1">Campanhas</TabsTrigger>
          <TabsTrigger value="applications" className="flex-1">Minhas Candidaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-5">
          {/* Subscription Banner */}
          {!vm.isSubscribed && vm.profileValidation.isComplete && (
            <Card className="border bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      Sua próxima parceria está aqui
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Assine e candidate-se a campanhas com orçamentos reais — sem intermediários.
                    </p>
                  </div>
                  <Button
                    className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-sm min-h-[44px]"
                    onClick={() => vm.setShowPaywall(true)}
                  >
                    Assinar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <OpportunityFilters
            searchTerm={vm.searchTerm}
            onSearchChange={vm.setSearchTerm}
            filterPlatform={vm.filterPlatform}
            onPlatformChange={vm.setFilterPlatform}
            filterRemuneration={vm.filterRemuneration}
            onRemunerationChange={vm.setFilterRemuneration}
          />

          {/* Campaigns Grid */}
          {vm.filteredCampaigns.length > 0 ? (
            <>
              <motion.div
                className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-5"
                initial="hidden" animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
              >
                {vm.filteredCampaigns.map((campaign, index) => (
                  <motion.div key={campaign.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}>
                    <OpportunityCard
                      campaign={campaign}
                      brand={vm.brands[campaign.brand_id]}
                      applied={vm.hasApplied(campaign.id)}
                      index={index}
                      onView={vm.openCampaignDetails}
                      onViewBrand={(brand) => setViewingBrand(brand)}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Infinite scroll sentinel */}
              <div ref={loadMoreRef} className="flex justify-center py-6">
                {vm.isFetchingNextPage && (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                )}
              </div>
            </>
          ) : (
            <Card className="border bg-card shadow-sm">
              <CardContent className="p-12">
                <EmptyState
                  icon={Megaphone}
                  title="Nenhuma campanha encontrada"
                  description={
                    vm.searchTerm || vm.filterPlatform !== 'all' || vm.filterRemuneration !== 'all'
                      ? 'Tente ajustar seus filtros'
                      : getEmptyMessage(creatorType)
                  }
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applications">
          <Applications embedded />
        </TabsContent>
      </Tabs>

      {/* Campaign Details / Application Dialog */}
      <Dialog open={!!vm.selectedCampaign} onOpenChange={vm.closeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pb-safe">
          <DialogHeader>
            <DialogTitle>
              {vm.viewingDetails ? 'Detalhes da Campanha' : 'Candidatar-se à Campanha'}
            </DialogTitle>
          </DialogHeader>
          {vm.selectedCampaign && (
            <div className="space-y-6 py-4">
              {vm.viewingDetails ? (
                <OpportunityDetailDialog
                  campaign={vm.selectedCampaign}
                  brand={vm.brands[vm.selectedCampaign.brand_id]}
                  applied={vm.hasApplied(vm.selectedCampaign.id)}
                  onStartApplication={vm.startApplication}
                  onClose={vm.closeDialog}
                  onViewBrand={(brand) => setViewingBrand(brand)}
                />
              ) : (
                <ApplyToCampaignDialog
                  campaign={vm.selectedCampaign}
                  brandName={vm.brands[vm.selectedCampaign.brand_id]?.company_name}
                  applicationMessage={vm.applicationMessage}
                  setApplicationMessage={vm.setApplicationMessage}
                  proposedRate={vm.proposedRate}
                  setProposedRate={vm.setProposedRate}
                  applying={vm.applying}
                  onBack={() => vm.setViewingDetails(true)}
                  onSubmit={vm.handleApply}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Brand Profile Modal */}
      {viewingBrand && (
        <Dialog open={!!viewingBrand} onOpenChange={(open) => { if (!open) setViewingBrand(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Perfil da Marca</DialogTitle></DialogHeader>
            <BrandProfileModal
              brand={viewingBrand}
              isSubscribed={true}
              onPaywall={() => {}}
              onMessage={(b) => {
                setViewingBrand(null);
                navigate(createPageUrl('InboxThread') + `?recipientId=${b.user_id}&recipientName=${encodeURIComponent(b.company_name || 'Marca')}`);
              }}
              onViewCampaign={(campaign) => {
                setViewingBrand(null);
                vm.openCampaignDetails(campaign);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={vm.showPaywall}
        onClose={() => vm.setShowPaywall(false)}
        title="Recurso Premium"
        description="Você precisa de uma assinatura ativa para se candidatar a campanhas."
        feature="Candidaturas ilimitadas"
        isAuthenticated={true}
      />
    </div>
  );
}