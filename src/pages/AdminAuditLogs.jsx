import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Loader2,
  Shield,
  Clock,
  User,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const actionConfig = {
      role_switch: { label: 'Troca de Perfil', className: 'bg-violet-100 text-violet-700' },
      user_activated: { label: 'Usuário Ativado', className: 'bg-emerald-100 text-emerald-700' },
      user_deactivated: { label: 'Usuário Desativado', className: 'bg-orange-100 text-orange-700' },
      subscription_override: { label: 'Assinatura Alterada', className: 'bg-blue-100 text-blue-700' },
      user_flagged: { label: 'Usuário Marcado', className: 'bg-yellow-100 text-yellow-700' },
      data_export: { label: 'Exportação de Dados', className: 'bg-indigo-100 text-indigo-700' },
      campaign_status_change: { label: 'Status de Campanha', className: 'bg-purple-100 text-purple-700' },
      dispute_resolved: { label: 'Disputa Resolvida', className: 'bg-emerald-100 text-emerald-700' }
    };
    
    const config = actionConfig[action] || { label: action, className: 'bg-slate-100 text-slate-700' };
    return <Badge className={`${config.className} border-0`}>{config.label}</Badge>;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Logs de Auditoria</h1>
        <p className="text-slate-600 mt-1">
          Histórico completo de ações administrativas • {filteredLogs.length} registros
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por admin ou detalhes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="role_switch">Troca de Perfil</SelectItem>
                <SelectItem value="user_activated">Usuário Ativado</SelectItem>
                <SelectItem value="user_deactivated">Usuário Desativado</SelectItem>
                <SelectItem value="subscription_override">Assinatura Alterada</SelectItem>
                <SelectItem value="user_flagged">Usuário Marcado</SelectItem>
                <SelectItem value="data_export">Exportação de Dados</SelectItem>
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
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-slate-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getActionBadge(log.action)}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{log.admin_email}</span>
                  </div>

                  <div className="text-sm text-slate-700 mb-2">
                    {log.details}
                  </div>

                  {log.note && (
                    <div className="flex items-start gap-2 text-sm bg-slate-50 p-3 rounded-lg mt-2">
                      <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Nota:</div>
                        <div className="text-slate-700">{log.note}</div>
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
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Nenhum log encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}