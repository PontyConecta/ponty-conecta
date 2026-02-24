import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, User, FileText } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const logsData = await base44.entities.AuditLog.list('-timestamp');
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

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Logs de Auditoria</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Histórico completo de ações administrativas • {filteredLogs.length} registros
        </p>
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
              <SelectTrigger className="w-full sm:w-56 hover:bg-indigo-50">
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
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <Shield className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                  {getActionBadge(log.action)}
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <Clock className="w-3 h-3" />
                    {formatDateTime(log.timestamp)}
                  </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <User className="w-4 h-4" />
                    <span className="font-medium">{log.admin_email}</span>
                  </div>

                  <div className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    {log.details}
                  </div>

                  {log.note && (
                    <div className="flex items-start gap-2 text-sm p-3 rounded-lg mt-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <FileText className="w-4 h-4 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Nota:</div>
                        <div style={{ color: 'var(--text-primary)' }}>{log.note}</div>
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
              <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum log encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}