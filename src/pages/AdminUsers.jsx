import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import UserStatsCards from '../components/admin/UserStatsCards';
import UserGrowthChart from '../components/admin/UserGrowthChart';
import UserFilters from '../components/admin/UserFilters';
import UserBulkActions from '../components/admin/UserBulkActions';
import UserTable from '../components/admin/UserTable';
import UserPagination from '../components/admin/UserPagination';
import UserManageDialog from '../components/admin/UserManageDialog';

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [creators, setCreators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('adminAnalytics', { type: 'list_users' });
      const { users: usersData, brands: brandsData, creators: creatorsData } = response.data;
      setUsers(usersData || []);
      setBrands(brandsData || []);
      setCreators(creatorsData || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Exportando dados...');
      const response = await base44.functions.invoke('adminExportData', { exportType: 'users' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  const getUserProfile = (userId) => {
    const brand = brands.find(b => b.user_id === userId);
    const creator = creators.find(c => c.user_id === userId);
    return { profile: brand || creator, type: brand ? 'brand' : creator ? 'creator' : 'unknown' };
  };

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const { profile, type } = getUserProfile(user.id);
      
      const matchesSearch = !searchTerm || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || type === roleFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'premium') matchesStatus = profile?.subscription_status === 'premium';
      else if (statusFilter === 'starter') matchesStatus = profile?.subscription_status === 'starter';
      else if (statusFilter === 'trial') matchesStatus = profile?.subscription_status === 'trial';
      else if (statusFilter === 'legacy') matchesStatus = profile?.subscription_status === 'legacy';
      else if (statusFilter === 'verified') matchesStatus = profile?.is_verified === true;
      else if (statusFilter === 'incomplete') matchesStatus = profile?.account_state === 'incomplete';
      else if (statusFilter === 'ready') matchesStatus = profile?.account_state === 'ready';
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, brands, creators, searchTerm, roleFilter, statusFilter]);

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
        case 'type': {
          cmp = (pA.type || '').localeCompare(pB.type || '');
          break;
        }
        case 'subscription': {
          cmp = (pA.profile?.subscription_status || '').localeCompare(pB.profile?.subscription_status || '');
          break;
        }
        case 'state': {
          cmp = (pA.profile?.account_state || '').localeCompare(pB.profile?.account_state || '');
          break;
        }
        case 'date':
        default: {
          cmp = new Date(a.created_date) - new Date(b.created_date);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredUsers, sortField, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleStatClick = (filter) => {
    setRoleFilter(filter.role);
    setStatusFilter(filter.status);
  };

  const selectedUserProfile = selectedUser ? getUserProfile(selectedUser.id) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9038fa' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Gerenciamento de Usuários
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {filteredUsers.length} de {users.length} usuários
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCharts(v => !v)} variant="outline" size="sm">
            {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
          </Button>
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStatsCards brands={brands} creators={creators} onStatClick={handleStatClick} />

      {/* Charts */}
      {showCharts && <UserGrowthChart brands={brands} creators={creators} />}

      {/* Filters */}
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Bulk Actions */}
      <UserBulkActions
        selectedIds={selectedIds}
        users={users}
        brands={brands}
        creators={creators}
        onClear={() => setSelectedIds([])}
        onComplete={loadUsers}
      />

      {/* Table */}
      <UserTable
        users={paginatedUsers}
        brands={brands}
        creators={creators}
        selectedIds={selectedIds}
        onSelectIds={setSelectedIds}
        onUserClick={setSelectedUser}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
      />

      {/* Pagination */}
      <UserPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedUsers.length}
        pageSize={PAGE_SIZE}
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
          onActionComplete={() => {
            loadUsers();
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}