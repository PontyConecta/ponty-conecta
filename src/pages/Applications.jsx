import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../components/contexts/AuthContext';
import { useApplicationsViewModel } from '../components/hooks/useApplicationsViewModel';
import ApplicationCard from '../components/applications/ApplicationCard';
import ApplicationsFilters from '../components/applications/ApplicationsFilters';
import ApplicationDetailDialog from '../components/applications/ApplicationDetailDialog';
import BrandDecisionDialog from '../components/applications/BrandDecisionDialog';
import CreatorProfileModal from '../components/modals/CreatorProfileModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Applications({ embedded = false }) {
  const { profile: authProfile, profileType, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const vm = useApplicationsViewModel(profileType, authProfile);
  const [viewingCreator, setViewingCreator] = useState(null);

  // Block creators from accessing standalone (non-embedded) Applications page
  useEffect(() => {
    if (!authLoading && !embedded && profileType === 'creator') {
      navigate(createPageUrl('MyApplications'));
    }
  }, [authLoading, embedded, profileType, navigate]);

  if (vm.isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      {!embedded && (
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {profileType === 'brand' ? 'Candidaturas' : 'Minhas Candidaturas'}
          </h1>
          <p className="mt-1">{vm.filteredApplications.length} candidaturas encontradas</p>
        </div>
      )}

      {/* Filters */}
      <ApplicationsFilters
        profileType={profileType}
        searchTerm={vm.searchTerm}
        onSearchChange={vm.setSearchTerm}
        filterStatus={vm.filterStatus}
        onStatusChange={vm.setFilterStatus}
        filterCampaign={vm.filterCampaign}
        onCampaignChange={vm.setFilterCampaign}
        campaignList={vm.campaignList}
      />

      {/* Applications List */}
      {vm.filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {vm.paginatedApplications.map((application, index) => (
            <ApplicationCard
              key={application.id}
              application={application}
              creator={vm.creators[application.creator_id]}
              campaign={vm.campaigns[application.campaign_id]}
              brand={vm.brands[application.brand_id]}
              profileType={profileType}
              index={index}
              onView={vm.openView}
              onAccept={vm.openDecision}
              onWithdraw={vm.handleWithdraw}
              onViewCreatorProfile={(creator) => setViewingCreator(creator)}
            />
          ))}

          {vm.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={vm.pagination.currentPage}
                totalPages={vm.totalPages}
                totalItems={vm.filteredApplications.length}
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
          <CardContent className="p-12 text-center">
            {profileType === 'brand' ? (
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            ) : (
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma candidatura encontrada
            </h3>
            <p>
              {vm.searchTerm || vm.filterStatus !== 'all'
                ? 'Tente ajustar seus filtros'
                : profileType === 'brand'
                  ? 'As candidaturas aparecerão aqui quando criadores se aplicarem às suas campanhas'
                  : 'Suas candidaturas aparecerão aqui'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog (view only — both brand non-pending + creator) */}
      <ApplicationDetailDialog
        open={vm.dialogMode === 'view' && !!vm.selectedApplication}
        onClose={vm.closeDialog}
        application={vm.selectedApplication}
        profileType={profileType}
        creator={vm.selectedApplication ? vm.creators[vm.selectedApplication.creator_id] : null}
        campaign={vm.selectedApplication ? vm.campaigns[vm.selectedApplication.campaign_id] : null}
        brand={vm.selectedApplication ? vm.brands[vm.selectedApplication.brand_id] : null}
        onViewCreatorProfile={(creator) => setViewingCreator(creator)}
      />

      {/* Brand Decision Dialog (accept/reject for pending) */}
      <BrandDecisionDialog
        open={vm.dialogMode === 'decide' && !!vm.selectedApplication}
        onClose={vm.closeDialog}
        application={vm.selectedApplication}
        creator={vm.selectedApplication ? vm.creators[vm.selectedApplication.creator_id] : null}
        campaign={vm.selectedApplication ? vm.campaigns[vm.selectedApplication.campaign_id] : null}
        agreedRate={vm.agreedRate}
        setAgreedRate={vm.setAgreedRate}
        rejectionReason={vm.rejectionReason}
        setRejectionReason={vm.setRejectionReason}
        processing={vm.processing}
        onAccept={vm.handleAccept}
        onReject={vm.handleReject}
        onViewCreatorProfile={(creator) => setViewingCreator(creator)}
      />

      {/* Creator Profile Modal */}
      {viewingCreator && (
        <Dialog open={!!viewingCreator} onOpenChange={(open) => { if (!open) setViewingCreator(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Perfil da Criadora</DialogTitle></DialogHeader>
            <CreatorProfileModal
              creator={viewingCreator}
              isSubscribed={true}
              formatFollowers={(n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n || 0)}
              getTotalFollowers={(c) => (c?.platforms || []).reduce((s, p) => s + (p.followers || 0), 0)}
              onPaywall={() => {}}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}