import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Loader2,
  Building2,
  Star,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Shield,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [creators, setCreators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [switchRoleDialog, setSwitchRoleDialog] = useState(null);
  const [auditNote, setAuditNote] = useState('');
  const [userFlags, setUserFlags] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [usersData, brandsData, creatorsData, auditLogsData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Brand.list(),
        base44.entities.Creator.list(),
        base44.entities.AuditLog.list()
      ]);
      setUsers(usersData);
      setBrands(brandsData);
      setCreators(creatorsData);
      
      // Build a map of flagged users
      const flags = {};
      auditLogsData.forEach(log => {
        if (log.action === 'user_flagged' && log.target_user_id) {
          flags[log.target_user_id] = true;
        }
      });
      setUserFlags(flags);
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

  const handleSwitchRole = async (userId, currentRole) => {
    setSwitchRoleDialog({ userId, currentRole });
  };

  const confirmSwitchRole = async () => {
    if (!switchRoleDialog) return;
    
    const { userId, currentRole } = switchRoleDialog;
    const newRole = currentRole === 'brand' ? 'creator' : 'brand';
    
    setActionLoading(userId);
    try {
      await base44.functions.invoke('adminSwitchRole', { 
        userId, 
        newRole,
        auditNote 
      });
      toast.success(`Perfil alterado de ${currentRole} para ${newRole}`);
      await loadUsers();
      setSwitchRoleDialog(null);
      setAuditNote('');
    } catch (error) {
      console.error('Error switching role:', error);
      toast.error('Erro ao alterar perfil');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserAction = async (userId, action, data = {}) => {
    setActionLoading(userId);
    try {
      await base44.functions.invoke('adminManageUser', { userId, action, data });
      
      const actions = {
        activate: 'Usuário ativado',
        deactivate: 'Usuário desativado',
        override_subscription: 'Assinatura alterada',
        flag_review: 'Usuário marcado para revisão',
        unflag_review: 'Usuário desmarcado de revisão',
        toggle_verified: 'Status de verificação alterado'
      };
      
      toast.success(actions[action] || 'Ação realizada');
      await loadUsers();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao realizar ação');
    } finally {
      setActionLoading(null);
    }
  };

  const getUserProfile = (userId) => {
    const brand = brands.find(b => b.user_id === userId);
    const creator = creators.find(c => c.user_id === userId);
    return {
      profile: brand || creator,
      role: brand ? 'brand' : creator ? 'creator' : 'unknown'
    };
  };

  const filteredUsers = users.filter(user => {
    const { profile, role } = getUserProfile(user.id);
    
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || role === roleFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && profile?.subscription_status === 'Premium') ||
      (statusFilter === 'exploring' && profile?.account_state === 'Incomplete');
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gerenciamento de Usuários</h1>
          <p className="text-slate-600 mt-1">{filteredUsers.length} usuários encontrados</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="exploring">Explorando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <div className="space-y-3">
        {filteredUsers.map((user) => {
          const { profile, role } = getUserProfile(user.id);
          const isActive = profile?.subscription_status === 'active';
          
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role === 'brand' ? 'bg-indigo-100' : 'bg-orange-100'
                    }`}>
                      {role === 'brand' ? (
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      ) : (
                        <Star className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {user.full_name || 'Sem nome'}
                        </h3>
                        {user.role === 'admin' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {role === 'brand' ? 'Marca' : 'Criador'}
                        </Badge>
                        {profile?.is_verified && (
                          <Badge className="bg-blue-100 text-blue-700 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                        {profile?.subscription_status === 'Premium' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0">
                            Premium
                          </Badge>
                        ) : profile?.subscription_status === 'Explorer' ? (
                          <Badge className="bg-amber-100 text-amber-700 border-0">
                            Explorer
                          </Badge>
                        ) : (
                          <Badge variant="outline">Guest</Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          Desde {new Date(user.created_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={actionLoading === user.id}>
                        {actionLoading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'toggle_verified')}>
                        {profile?.is_verified ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Remover Verificação
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Verificar Perfil
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSwitchRole(user.id, role)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Trocar Perfil ({role === 'brand' ? 'para Criador' : 'para Marca'})
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {isActive ? (
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'deactivate')}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Desativar Usuário
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'activate')}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Ativar Usuário
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'override_subscription', { subscription_status: 'Premium' })}>
                        <Shield className="w-4 h-4 mr-2" />
                        Forçar Assinatura Premium
                      </DropdownMenuItem>
                      {userFlags[user.id] ? (
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'unflag_review')}>
                          Desmarcar para Revisão
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'flag_review')}>
                          Marcar para Revisão
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Switch Role Dialog */}
      <Dialog open={!!switchRoleDialog} onOpenChange={(open) => !open && setSwitchRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Troca de Perfil</DialogTitle>
            <DialogDescription>
              Esta ação irá deletar o perfil atual e criar um novo perfil. O histórico será perdido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-slate-600">
              <strong>De:</strong> {switchRoleDialog?.currentRole === 'brand' ? 'Marca' : 'Criador'}
              <br />
              <strong>Para:</strong> {switchRoleDialog?.currentRole === 'brand' ? 'Criador' : 'Marca'}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Nota de Auditoria (opcional)
              </label>
              <Textarea
                placeholder="Por que esta troca está sendo feita?"
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchRoleDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmSwitchRole} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar Troca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}