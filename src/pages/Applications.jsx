import React from 'react';
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

export default function Applications() {
  const { profile: authProfile, profileType } = useAuth();
  const vm = useApplicationsViewModel(profileType, authProfile);

  if (vm.isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {profileType === 'brand' ? 'Candidaturas' : 'Minhas Candidaturas'}
        </h1>
        <p className="mt-1">{vm.filteredApplications.length} candidaturas encontradas</p>
      </div>

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
      />
    </div>
  );
}