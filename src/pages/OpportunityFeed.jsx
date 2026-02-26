import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Megaphone, Crown } from 'lucide-react';
import PaywallModal from '@/components/PaywallModal';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/components/contexts/AuthContext';
import { useOpportunityFeedViewModel } from '@/components/hooks/useOpportunityFeedViewModel';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import OpportunityFilters from '@/components/opportunities/OpportunityFilters';
import OpportunityDetailDialog from '@/components/opportunities/OpportunityDetailDialog';
import ApplyToCampaignDialog from '@/components/opportunities/ApplyToCampaignDialog';

export default function OpportunityFeed() {
  const { profile: authProfile, profileType } = useAuth();
  const vm = useOpportunityFeedViewModel(authProfile, profileType);

  // Pull to refresh (touch)
  useEffect(() => {
    const handleTouchStart = (e) => {
      const startY = e.touches[0].clientY;
      const handleMove = (e2) => {
        if (e2.touches[0].clientY - startY > 100 && window.scrollY === 0) {
          vm.handleRefresh();
          document.removeEventListener('touchmove', handleMove);
        }
      };
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', () => document.removeEventListener('touchmove', handleMove), { once: true });
    };
    document.addEventListener('touchstart', handleTouchStart);
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, [vm.handleRefresh]);

  if (vm.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            Campanhas
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

      {/* Subscription Banner */}
      {!vm.isSubscribed && vm.profileValidation.isComplete && (
        <Card className="border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Modo Exploração</h3>
                <p className="text-sm text-muted-foreground">
                  Você pode ver as campanhas, mas precisa assinar para se candidatar.
                </p>
              </div>
              <Button
                className="bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm min-h-[44px]"
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
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-5">
          {vm.filteredCampaigns.map((campaign, index) => (
            <OpportunityCard
              key={campaign.id}
              campaign={campaign}
              brand={vm.brands[campaign.brand_id]}
              applied={vm.hasApplied(campaign.id)}
              index={index}
              onView={vm.openCampaignDetails}
            />
          ))}
        </div>
      ) : (
        <Card className="border bg-card shadow-sm">
          <CardContent className="p-12">
            <EmptyState
              icon={Megaphone}
              title="Nenhuma campanha encontrada"
              description={
                vm.searchTerm || vm.filterPlatform !== 'all' || vm.filterRemuneration !== 'all'
                  ? 'Tente ajustar seus filtros'
                  : 'Novas campanhas serão adicionadas em breve'
              }
            />
          </CardContent>
        </Card>
      )}

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