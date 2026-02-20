import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, Download, Loader2, Building2, Star, Shield, 
  CheckCircle2, Crown, Gift, Calendar, Users, Eye, RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import UserManageDialog from '../components/admin/UserManageDialog';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [creators, setCreators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [usersData, brandsData, creatorsData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Brand.list(),
        base44.entities.Creator.list()
      ]);
      setUsers(usersData);
      setBrands(brandsData);
      setCreators(creatorsData);
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
    return {
      profile: brand || creator,
      type: brand ? 'brand' : creator ? 'creator' : 'unknown'
    };
  };

  const filteredUsers = users.filter(user => {
    const { profile, type } = getUserProfile(user.id);
    
    const matchesSearch = 
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

  // Stats
  const totalBrands = brands.length;
  const totalCreators = creators.length;
  const totalPremium = [...brands, ...creators].filter(p => p.subscription_status === 'premium').length;
  const totalVerified = [...brands, ...creators].filter(p => p.is_verified).length;

  const selectedUserProfile = selectedUser ? getUserProfile(selectedUser.id) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9038fa' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Gerenciamento de Usuários
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            {filteredUsers.length} de {users.length} usuários
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalBrands}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Marcas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalCreators}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Criadores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Crown className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPremium}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalVerified}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Verificados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <Input
                placeholder="Buscar por email, nome ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="brand">Marcas</SelectItem>
                <SelectItem value="creator">Criadores</SelectItem>
                <SelectItem value="unknown">Sem Perfil</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="legacy">Legacy</SelectItem>
                <SelectItem value="verified">Verificados</SelectItem>
                <SelectItem value="ready">Conta Pronta</SelectItem>
                <SelectItem value="incomplete">Conta Incompleta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-2">
        {filteredUsers.map((user) => {
          const { profile, type } = getUserProfile(user.id);
          
          return (
            <Card 
              key={user.id} 
              className="hover:shadow-md transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
                    <AvatarFallback className={type === 'brand' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}>
                      {type === 'brand' ? <Building2 className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {type === 'brand' ? profile?.company_name : profile?.display_name || user.full_name || 'Sem nome'}
                      </h3>
                      {user.role === 'admin' && (
                        <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-1.5 py-0">
                          <Shield className="w-2.5 h-2.5 mr-0.5" /> Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                        {type === 'brand' ? 'Marca' : type === 'creator' ? 'Criador' : '?'}
                      </Badge>
                      {profile?.is_verified && (
                        <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 py-0">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Verificado
                        </Badge>
                      )}
                      {profile?.subscription_status === 'premium' && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 py-0">
                          <Crown className="w-2.5 h-2.5 mr-0.5" /> Premium
                        </Badge>
                      )}
                      {profile?.subscription_status === 'trial' && (
                        <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 py-0">
                          <Gift className="w-2.5 h-2.5 mr-0.5" /> Trial
                        </Badge>
                      )}
                      {profile?.subscription_status === 'legacy' && (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] px-1.5 py-0">Legacy</Badge>
                      )}
                      {profile?.subscription_status === 'starter' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Starter</Badge>
                      )}
                      {profile?.account_state === 'incomplete' && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px] px-1.5 py-0">Incompleta</Badge>
                      )}
                      <span className="text-[10px] hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(user.created_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Gerenciar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredUsers.length === 0 && (
          <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

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