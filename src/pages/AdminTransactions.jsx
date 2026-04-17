import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
import { base44 } from '@/api/base44Client';
import { AlertCircle, RefreshCw, EyeOff, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import AdminHeader from '@/components/admin/AdminHeader';
import { toast } from 'sonner';

const STATUS_COLORS = {
  ativa: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-800',
  pendente: 'bg-amber-100 text-amber-800',
};

export default function AdminTransactions() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExcluded, setShowExcluded] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('adminTransactions', {});
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const toggleExclude = async (userId, currentExcluded) => {
    setTogglingId(userId);
    try {
      await base44.functions.invoke('adminTransactions', {
        action: 'toggle_exclude',
        user_id: userId,
        exclude: !currentExcluded,
      });
      toast.success(currentExcluded ? 'Incluído nos financeiros' : 'Excluído dos financeiros');
      await loadData();
    } catch (err) {
      toast.error('Erro ao atualizar');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!showExcluded && t.is_excluded) return false;
      return true;
    });
  }, [data, statusFilter, showExcluded]);

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader currentPageName="AdminTransactions" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
          <p className="text-xs text-muted-foreground mt-1">Todos os registros financeiros do Stripe</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ativa">Ativas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={showExcluded ? 'outline' : 'secondary'}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setShowExcluded(!showExcluded)}
        >
          {showExcluded ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {showExcluded ? 'Mostrando excluídos' : 'Ocultando excluídos'}
        </Button>
        {data && (
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} de {data.transactions.length} registros
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <>
          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Usuário</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Plano</th>
                    <th className="text-right p-3 font-medium">Valor</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-center p-3 font-medium">Excluído</th>
                    <th className="text-center p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={t.email + i} className={`border-b last:border-0 hover:bg-muted/30 ${t.is_excluded ? 'opacity-50' : ''}`}>
                      <td className="p-3 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3 max-w-[200px] truncate" title={t.email}>
                        {t.email}
                      </td>
                      <td className="p-3 capitalize">{t.profile_type}</td>
                      <td className="p-3 capitalize">{t.plan_type}</td>
                      <td className="p-3 text-right font-medium whitespace-nowrap">
                        R$ {t.amount.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[t.status] || ''}`}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {t.is_excluded ? (
                          <Badge variant="destructive" className="text-[10px]">Sim</Badge>
                        ) : (
                          <span className="text-muted-foreground">Não</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {t.user_id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] px-2"
                            disabled={togglingId === t.user_id}
                            onClick={() => toggleExclude(t.user_id, t.is_excluded)}
                          >
                            {t.is_excluded ? (
                              <><Eye className="w-3 h-3 mr-1" />Incluir</>
                            ) : (
                              <><EyeOff className="w-3 h-3 mr-1" />Excluir</>
                            )}
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Nenhuma transação encontrada com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Footer Totals */}
          {data?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Receita Real (MRR)</p>
                  <p className="text-lg font-bold text-foreground">R$ {data.summary.real_revenue.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{data.summary.active_real_count} assinatura(s)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Receita Bruta</p>
                  <p className="text-lg font-bold text-foreground">R$ {data.summary.gross_revenue.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{data.summary.active_count} assinatura(s)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Registros</p>
                  <p className="text-lg font-bold text-foreground">{data.summary.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Excluídos</p>
                  <p className="text-lg font-bold text-foreground">{data.summary.excluded_count}</p>
                  <p className="text-[10px] text-muted-foreground">usuário(s) marcados</p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}