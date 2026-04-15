import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { downloadBlob } from '@/lib/platform';

import AdminHeader from '../components/admin/AdminHeader';
import UserQuickFilters from '../components/admin/UserQuickFilters';
import UserFilters from '../components/admin/UserFilters';
import UserBulkActions from '../components/admin/UserBulkActions';
import UserTable from '../components/admin/UserTable';
import UserPagination from '../components/admin/UserPagination';
import UserManageDialog from '../components/admin/UserManageDialog';
import SelectAllFilteredBanner from '../components/admin/SelectAllFilteredBanner';

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [creators, setCreators] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [nicheFilter, setNicheFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [excludeFinancialsFilter, setExcludeFinancialsFilter] = useState('all');

  // Date-key filters
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [firstActiveFrom, setFirstActiveFrom] = useState('');
  const [firstActiveTo, setFirstActiveTo] = useState('');
  const [noFirstActive, setNoFirstActive] = useState(false);
  const [lastActiveFrom, setLastActiveFrom] = useState('');
  const [lastActiveTo, setLastActiveTo] = useState('');
  const [noLastActive, setNoLastActive] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  // Table state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionScope, setSelectionScope] = useState('page'); // 'page' | 'filtered'
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [density, setDensity] = useState('default');
  const [quickFilter, setQuickFilter] = useState('all');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('adminAnalyticsV2', {
        mode: 'lists', list_type: 'list_users', range: '30d'
      });
      const { users: u, brands: b, creators: c } = response.data;
      setUsers(u || []);
      setBrands(b || []);
      setCreators(c || []);
    } catch (error) {
      console.error('Error loading users via v2, trying v1 fallback:', error);
      try {
        const fallback = await base44.functions.invoke('adminAnalytics', { type: 'list_users' });
        const { users: u, brands: b, creators: c } = fallback.data;
        setUsers(u || []);
        setBrands(b || []);
        setCreators(c || []);
        toast.warning('Usando fallback v1 para lista de usuários');
      } catch (err2) {
        console.error('V1 fallback also failed:', err2);
        toast.error('Erro ao carregar usuários');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Exportando dados...');
      const response = await base44.functions.invoke('adminExportData', { exportType: 'users' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      downloadBlob(blob, 'users_export.csv');
      toast.success('Exportado com sucesso');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar');
    }
  };

  const getUserProfile = (userId) => {
    const brand = brands.find(b => b.user_id === userId);
    const creator = creators.find(c => c.user_id === userId);
    return { profile: brand || creator, type: brand ? 'brand' : creator ? 'creator' : 'unknown' };
  };

  // Filtering
  const filteredUsers = useMemo(() => {
    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    return users.filter(user => {
      const { profile, type } = getUserProfile(user.id);

      // Quick filter
      if (quickFilter !== 'all') {
        const lastActive = user.last_active ? new Date(user.last_active).getTime() : 0;
        const created = user.created_date ? new Date(user.created_date).getTime() : 0;
        if (quickFilter === 'new' && (!created || (now.getTime() - created) >= 7 * DAY_MS)) return false;
        if (quickFilter === 'never_active' && user.first_active) return false;
        if (quickFilter === 'inactive' && lastActive && (now.getTime() - lastActive) <= 30 * DAY_MS) return false;
        if (quickFilter === 'hidden' && !profile?.is_hidden) return false;
        if (quickFilter === 'free') {
          if (profile?.subscription_status !== 'free') return false;
        }
        if (quickFilter === 'premium') {
          if (profile?.subscription_status !== 'premium') return false;
        }
        if (quickFilter === 'trial') {
          if (profile?.subscription_status !== 'premium' || !profile?.trial_end_date || new Date(profile.trial_end_date) <= new Date()) return false;
        }
        if (quickFilter === 'feedback_beta') {
          if (!user.feedback_status || user.feedback_status === 'none') return false;
        }
      }
      
      // Search (name, email, company, display name, handles)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchFields = [
          user.email, user.full_name, 
          profile?.company_name, profile?.display_name,
          profile?.contact_email, profile?.contact_whatsapp,
          ...(profile?.platforms?.map(p => p.handle) || []),
        ].filter(Boolean);
        if (!searchFields.some(f => f.toLowerCase().includes(term))) return false;
      }
      
      // Role filter
      if (roleFilter === 'admin') {
        if (user.role !== 'admin') return false;
      } else if (roleFilter !== 'all' && type !== roleFilter) return false;
      
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'premium') {
          if (profile?.subscription_status !== 'premium') return false;
          // Exclude active trials from "premium" filter
          if (profile?.trial_end_date && new Date(profile.trial_end_date) > new Date()) return false;
        }
        if (statusFilter === 'free' && profile?.subscription_status !== 'free') return false;
        if (statusFilter === 'starter' && profile?.subscription_status !== 'starter') return false;
        if (statusFilter === 'trial') {
          if (profile?.subscription_status !== 'premium' || !profile?.trial_end_date || new Date(profile.trial_end_date) <= new Date()) return false;
        }
      }

      // State filter
      if (stateFilter && stateFilter !== 'all') {
        if (profile?.state !== stateFilter) return false;
      }

      // Niche filter (creators only)
      if (nicheFilter && nicheFilter !== 'all') {
        if (type !== 'creator') return false;
        const niches = profile?.niche || [];
        if (!niches.some(n => n.toLowerCase().includes(nicheFilter.toLowerCase()))) return false;
      }

      // Verified filter
      if (verifiedFilter && verifiedFilter !== 'all') {
        if (verifiedFilter === 'verified' && !profile?.is_verified) return false;
        if (verifiedFilter === 'not_verified' && profile?.is_verified) return false;
      }

      // Tag filter
      if (tagFilter && tagFilter !== 'all') {
        const userTags = user.tags || [];
        if (tagFilter === 'no_tags') {
          if (userTags.length > 0) return false;
        } else {
          if (!userTags.includes(tagFilter)) return false;
        }
      }

      // Exclude from financials filter
      if (excludeFinancialsFilter && excludeFinancialsFilter !== 'all') {
        if (excludeFinancialsFilter === 'excluded' && !user.exclude_from_financials) return false;
        if (excludeFinancialsFilter === 'included' && user.exclude_from_financials) return false;
      }

      // Date filter
      if (dateFilter && dateFilter !== 'all') {
        const created = new Date(user.created_date);
        const dayMs = 24 * 60 * 60 * 1000;
        if (dateFilter === 'today' && (now - created) > dayMs) return false;
        if (dateFilter === 'week' && (now - created) > 7 * dayMs) return false;
        if (dateFilter === 'month' && (now - created) > 30 * dayMs) return false;
        if (dateFilter === 'quarter' && (now - created) > 90 * dayMs) return false;
      }

      // Date-key filters
      if (createdFrom && user.created_date && new Date(user.created_date) < new Date(createdFrom)) return false;
      if (createdTo && user.created_date && new Date(user.created_date) > new Date(createdTo + 'T23:59:59')) return false;

      if (noFirstActive) {
        if (user.first_active) return false;
      } else {
        if (firstActiveFrom && (!user.first_active || new Date(user.first_active) < new Date(firstActiveFrom))) return false;
        if (firstActiveTo && (!user.first_active || new Date(user.first_active) > new Date(firstActiveTo + 'T23:59:59'))) return false;
      }

      if (noLastActive) {
        if (user.last_active) return false;
      } else {
        if (lastActiveFrom && (!user.last_active || new Date(user.last_active) < new Date(lastActiveFrom))) return false;
        if (lastActiveTo && (!user.last_active || new Date(user.last_active) > new Date(lastActiveTo + 'T23:59:59'))) return false;
      }

      if (visibilityFilter && visibilityFilter !== 'all') {
        if (visibilityFilter === 'hidden' && !profile?.is_hidden) return false;
        if (visibilityFilter === 'visible' && profile?.is_hidden) return false;
      }
      
      return true;
    });
  }, [users, brands, creators, searchTerm, roleFilter, statusFilter, stateFilter, nicheFilter, dateFilter, verifiedFilter, tagFilter, excludeFinancialsFilter, quickFilter, createdFrom, createdTo, firstActiveFrom, firstActiveTo, noFirstActive, lastActiveFrom, lastActiveTo, noLastActive, visibilityFilter]);

  // Sorting
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      const pA = getUserProfile(a.id);
      const pB = getUserProfile(b.id);
      let cmp = 0;

      switch (sortField) {
        case 'name': {
          const nameA = (pA.type === 'brand' ? pA.profile?.company_name : pA.profile?.display_name || a.full_name) || '';
          const nameB = (pB.type === 'brand' ? pB.profile?.company_name : pB.profile?.display_name || b.full_name) || '';
          cmp = nameA.localeCompare(nameB, 'pt-BR');
          break;
        }
        case 'type': cmp = (pA.type || '').localeCompare(pB.type || ''); break;
        case 'subscription': cmp = (pA.profile?.subscription_status || '').localeCompare(pB.profile?.subscription_status || ''); break;
        case 'state': cmp = (pA.profile?.account_state || '').localeCompare(pB.profile?.account_state || ''); break;
        case 'location': cmp = (pA.profile?.state || '').localeCompare(pB.profile?.state || ''); break;
        case 'date':
        default: cmp = new Date(a.created_date) - new Date(b.created_date); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredUsers, sortField, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page and selection on filter change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectionScope('page');
  }, [searchTerm, roleFilter, statusFilter, stateFilter, nicheFilter, dateFilter, verifiedFilter, tagFilter, excludeFinancialsFilter, quickFilter, createdFrom, createdTo, firstActiveFrom, firstActiveTo, noFirstActive, lastActiveFrom, lastActiveTo, noLastActive, visibilityFilter, sortField, sortDir]);

  // Collect all unique tags from users
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    users.forEach(u => (u.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [users]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const selectedUserProfile = selectedUser ? getUserProfile(selectedUser.id) : null;

  if (!authUser || authUser.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Acesso negado</p></div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Navigation Header */}
      <AdminHeader currentPageName="AdminUsers" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Gerenciamento de Usuários</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              {filteredUsers.length} de {users.length} usuários
            </p>
            {filteredUsers.length !== users.length && (
              <Badge variant="outline" className="text-[10px] border-primary text-primary">
                filtrado
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Density toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted">
            <Button 
              variant="ghost" size="icon" className={`h-8 w-8 ${density === 'default' ? 'shadow-sm bg-card' : 'opacity-50'}`}
              onClick={() => setDensity('default')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" size="icon" className={`h-8 w-8 ${density === 'compact' ? 'shadow-sm bg-card' : 'opacity-50'}`}
              onClick={() => setDensity('compact')}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> Exportar
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <UserQuickFilters value={quickFilter} onChange={setQuickFilter} />

      {/* Filters */}
      <UserFilters
        searchTerm={searchTerm} onSearchChange={setSearchTerm}
        roleFilter={roleFilter} onRoleChange={setRoleFilter}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
        stateFilter={stateFilter} onStateChange={setStateFilter}
        nicheFilter={nicheFilter} onNicheChange={setNicheFilter}
        dateFilter={dateFilter} onDateChange={setDateFilter}
        verifiedFilter={verifiedFilter} onVerifiedChange={setVerifiedFilter}
        tagFilter={tagFilter} onTagChange={setTagFilter}
        excludeFinancialsFilter={excludeFinancialsFilter} onExcludeFinancialsChange={setExcludeFinancialsFilter}
        availableTags={availableTags}
        createdFrom={createdFrom} onCreatedFromChange={setCreatedFrom}
        createdTo={createdTo} onCreatedToChange={setCreatedTo}
        firstActiveFrom={firstActiveFrom} onFirstActiveFromChange={setFirstActiveFrom}
        firstActiveTo={firstActiveTo} onFirstActiveToChange={setFirstActiveTo}
        noFirstActive={noFirstActive} onNoFirstActiveChange={setNoFirstActive}
        lastActiveFrom={lastActiveFrom} onLastActiveFromChange={setLastActiveFrom}
        lastActiveTo={lastActiveTo} onLastActiveToChange={setLastActiveTo}
        noLastActive={noLastActive} onNoLastActiveChange={setNoLastActive}
        visibilityFilter={visibilityFilter} onVisibilityChange={setVisibilityFilter}
      />

      {/* Bulk Actions */}
      <UserBulkActions
        selectedIds={selectedIds} users={users} brands={brands} creators={creators}
        onClear={() => { setSelectedIds([]); setSelectionScope('page'); }} onComplete={loadUsers}
        selectionScope={selectionScope}
      />

      {/* Select All Filtered Banner */}
      <SelectAllFilteredBanner
        pageSelectedCount={paginatedUsers.filter(u => selectedIds.includes(u.id)).length}
        pageTotal={paginatedUsers.length}
        filteredTotal={sortedUsers.length}
        selectionScope={selectionScope}
        onSelectAllFiltered={() => {
          setSelectedIds(sortedUsers.map(u => u.id));
          setSelectionScope('filtered');
        }}
        onClearToPage={() => {
          setSelectedIds(paginatedUsers.map(u => u.id));
          setSelectionScope('page');
        }}
      />

      {/* Table */}
      <UserTable
        users={paginatedUsers} brands={brands} creators={creators}
        selectedIds={selectedIds} onSelectIds={(ids) => { setSelectedIds(ids); setSelectionScope('page'); }}
        onUserClick={setSelectedUser}
        sortField={sortField} sortDir={sortDir} onSort={handleSort}
        density={density}
        onActionComplete={loadUsers}
      />

      {/* Pagination */}
      <UserPagination
        currentPage={currentPage} totalPages={totalPages}
        totalItems={sortedUsers.length} pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {/* Manage Dialog */}
      {selectedUser && selectedUserProfile && (
        <UserManageDialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          user={selectedUser}
          profile={selectedUserProfile.profile}
          profileType={selectedUserProfile.type}
          onActionComplete={() => { loadUsers(); setSelectedUser(null); }}
        />
      )}
    </div>
  );
}