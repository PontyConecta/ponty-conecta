import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Clock, User, FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminHeader from '../components/admin/AdminHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { formatDateTime } from '../components/utils/formatters';
import { auditLogActionConfig } from '../components/utils/statusConfigs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SearchFilter from '../components/common/SearchFilter';

export default function AdminAuditLogs() {
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [targetUserFilter, setTargetUserFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const logsData = await base44.entities.AuditLog.list('-timestamp', 500);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const config = auditLogActionConfig[action] || { 
      label: action, 
      color: 'bg-slate-100 text-slate-700' 
    };
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
  };

  const filteredLogs = useMemo(() => logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    if (dateFrom) {
      const logDate = log.timestamp ? new Date(log.timestamp) : null;
      if (!logDate || logDate < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const logDate = log.timestamp ? new Date(log.timestamp) : null;
      if (!logDate || logDate > new Date(dateTo + 'T23:59:59')) return false;
    }
    if (targetUserFilter.trim()) {
      if (!log.target_user_id?.toLowerCase().includes(targetUserFilter.toLowerCase())) return false;
    }
    
    return matchesSearch && matchesAction;
  }), [logs, searchTerm, actionFilter, dateFrom, dateTo, targetUserFilter]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, actionFilter, dateFrom, dateTo, targetUserFilter]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExportCSV = () => {
    const headers = ['Data', 'Admin', 'Ação', 'Detalhes', 'Nota', 'Target User ID'];
    const rows = filteredLogs.map(log => [
      log.timestamp || '', log.admin_email || '', log.action || '',
      (log.details || '').replace(/[\n,]/g, ' '), (log.note || '').replace(/[\n,]/g, ' '),
      log.target_user_id || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit_logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (!authUser || authUser.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Acesso negado</p></div>;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Admin Navigation Header */}
      <AdminHeader currentPageName="AdminAuditLogs" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Logs de Auditoria</h1>
          <p className="mt-1 text-muted-foreground">
            Histórico completo de ações administrativas • {filteredLogs.length} registros
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por admin ou detalhes..."
              className="flex-1"
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="role_switch">Troca de Perfil</SelectItem>
                <SelectItem value="user_role_change">Papel Alterado</SelectItem>
                <SelectItem value="user_activated">Usuário Ativado</SelectItem>
                <SelectItem value="user_deactivated">Usuário Desativado</SelectItem>
                <SelectItem value="subscription_override">Assinatura Alterada</SelectItem>
                <SelectItem value="user_flagged">Usuário Marcado</SelectItem>
                <SelectItem value="data_export">Exportação de Dados</SelectItem>
                <SelectItem value="campaign_status_change">Status de Campanha</SelectItem>
                <SelectItem value="dispute_resolved">Disputa Resolvida</SelectItem>
              </SelectContent>
            </Select>
            {/* Date range + target user filters */}
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">De:</span>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Até:</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm" />
              </div>
              <Input
                placeholder="Filtrar por Target User ID..."
                value={targetUserFilter}
                onChange={(e) => setTargetUserFilter(e.target.value)}
                className="sm:w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-3">
        {paginatedLogs.map((log) => (
          <Card key={log.id} className="bg-card border hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                  {getActionBadge(log.action)}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(log.timestamp)}
                  </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm mb-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{log.admin_email}</span>
                  </div>

                  <div className="text-sm mb-2 text-foreground">
                    {log.details}
                  </div>

                  {log.note && (
                    <div className="flex items-start gap-2 text-sm p-3 rounded-lg mt-2 bg-muted">
                      <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-xs mb-1 text-muted-foreground">Nota:</div>
                        <div className="text-foreground">{log.note}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum log encontrado</p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} ({filteredLogs.length} registros)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}