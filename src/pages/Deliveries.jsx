import React, { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck, FileText, Loader2 } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../components/contexts/AuthContext';
import { useDeliveriesViewModel } from '../components/hooks/useDeliveriesViewModel';
import DeliveryCard from '../components/deliveries/DeliveryCard';
import DeliveriesFilters from '../components/deliveries/DeliveriesFilters';
import BrandReviewDialog from '../components/deliveries/BrandReviewDialog';
import CreatorSubmitDialog from '../components/deliveries/CreatorSubmitDialog';

export default function Deliveries() {
  const { profile: authProfile, profileType } = useAuth();

  const vm = useDeliveriesViewModel(profileType, authProfile?.id);

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

  if (vm.isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Pull to Refresh Indicator */}
      {vm.refreshing && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {profileType === 'brand' ? 'Entregas' : 'Minhas Entregas'}
        </h1>
        <p className="mt-1">{vm.filteredDeliveries.length} entregas encontradas</p>
      </div>

      {/* Filters */}
      <DeliveriesFilters
        profileType={profileType}
        searchTerm={vm.searchTerm}
        onSearchChange={vm.setSearchTerm}
        filterStatus={vm.filterStatus}
        onStatusChange={vm.setFilterStatus}
      />

      {/* Deliveries List */}
      {vm.filteredDeliveries.length > 0 ? (
        <div className="space-y-4">
          {vm.paginatedDeliveries.map((delivery, index) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              profileType={profileType}
              creator={vm.creators[delivery.creator_id]}
              campaign={vm.campaigns[delivery.campaign_id]}
              brand={vm.brands[delivery.brand_id]}
              index={index}
              onView={vm.setSelectedDelivery}
              onSubmit={vm.openSubmitDialog}
            />
          ))}

          {vm.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={vm.pagination.currentPage}
                totalPages={vm.totalPages}
                totalItems={vm.filteredDeliveries.length}
                pageSize={vm.pagination.pageSize}
                onPageChange={vm.pagination.goToPage}
                onPageSizeChange={(size) => {
                  vm.pagination.setPageSize(size);
                  vm.pagination.reset();
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={profileType === 'brand' ? FileCheck : FileText}
              title="Nenhuma entrega encontrada"
              description={
                vm.searchTerm || vm.filterStatus !== 'all'
                  ? 'Tente ajustar seus filtros'
                  : profileType === 'brand'
                    ? 'As entregas aparecerão aqui quando criadores submeterem seus trabalhos'
                    : 'Suas entregas aparecerão aqui quando suas candidaturas forem aceitas'
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Brand Review Dialog */}
      {profileType === 'brand' && (
        <BrandReviewDialog
          delivery={vm.selectedDelivery}
          campaign={vm.selectedDelivery ? vm.campaigns[vm.selectedDelivery.campaign_id] : null}
          creator={vm.selectedDelivery ? vm.creators[vm.selectedDelivery.creator_id] : null}
          processing={vm.processing}
          onClose={() => vm.setSelectedDelivery(null)}
          onApprove={vm.handleApprove}
          onContest={vm.handleContest}
        />
      )}

      {/* Creator Submit Dialog */}
      {profileType === 'creator' && (
        <CreatorSubmitDialog
          delivery={vm.selectedDelivery}
          campaign={vm.selectedDelivery ? vm.campaigns[vm.selectedDelivery.campaign_id] : null}
          brand={vm.selectedDelivery ? vm.brands[vm.selectedDelivery.brand_id] : null}
          proofUrls={vm.proofUrls}
          setProofUrls={vm.setProofUrls}
          contentUrls={vm.contentUrls}
          setContentUrls={vm.setContentUrls}
          proofNotes={vm.proofNotes}
          setProofNotes={vm.setProofNotes}
          submitting={vm.submitting}
          onClose={vm.closeSubmitDialog}
          onSubmit={vm.handleSubmitDelivery}
          onFileUpload={vm.handleFileUpload}
        />
      )}
    </div>
  );
}