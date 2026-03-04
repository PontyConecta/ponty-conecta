import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Clock, AlertTriangle, FileX, Users, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function TimeAgo({ date }) {
  if (!date) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className="text-xs text-muted-foreground">
      {formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })}
    </span>
  );
}

function ListCard({ title, icon: Icon, items, renderItem, emptyText }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
          <Badge variant="secondary" className="ml-auto">{items?.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyText}</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {items.map(renderItem)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OperationalLists() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [activeTab, setActiveTab] = useState('stale_apps');

  const loadList = useCallback(async (queryType, params = {}) => {
    setLoading(prev => ({ ...prev, [queryType]: true }));
    try {
      const res = await base44.functions.invoke('adminMetrics', { query_type: queryType, ...params });
      setData(prev => ({ ...prev, [queryType]: res.data }));
    } catch (e) {
      toast.error('Erro ao carregar lista');
    } finally {
      setLoading(prev => ({ ...prev, [queryType]: false }));
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const queryMap = {
      stale_apps: ['stale_applications', { threshold_hours: 48 }],
      stale_deliveries: ['stale_deliveries', { threshold_hours: 72 }],
      no_apps: ['campaigns_no_applications'],
      disputes: ['open_disputes'],
      incomplete: ['incomplete_onboarding'],
    };
    const [queryType, params] = queryMap[tab] || [];
    if (queryType && !data[queryType]) loadList(queryType, params);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="stale_apps" className="text-xs">Candidaturas Pendentes</TabsTrigger>
        <TabsTrigger value="stale_deliveries" className="text-xs">Entregas Paradas</TabsTrigger>
        <TabsTrigger value="no_apps" className="text-xs">Sem Candidaturas</TabsTrigger>
        <TabsTrigger value="disputes" className="text-xs">Disputas Abertas</TabsTrigger>
        <TabsTrigger value="incomplete" className="text-xs">Onboarding Incompleto</TabsTrigger>
      </TabsList>

      <TabsContent value="stale_apps">
        {loading.stale_applications ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <ListCard
            title="Candidaturas pendentes há +48h"
            icon={Clock}
            items={data.stale_applications?.stale_applications}
            emptyText="Nenhuma candidatura pendente antiga"
            renderItem={(app) => (
              <div key={app.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Application #{app.id?.slice(0, 8)}</p>
                  <TimeAgo date={app.created_date} />
                </div>
                <Badge variant="outline">pending</Badge>
              </div>
            )}
          />
        )}
      </TabsContent>

      <TabsContent value="stale_deliveries">
        {loading.stale_deliveries ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <ListCard
            title="Entregas submetidas há +72h sem revisão"
            icon={FileX}
            items={data.stale_deliveries?.stale_deliveries}
            emptyText="Nenhuma entrega parada"
            renderItem={(del) => (
              <div key={del.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Delivery #{del.id?.slice(0, 8)}</p>
                  <TimeAgo date={del.submitted_at} />
                </div>
                <Badge variant="outline">submitted</Badge>
              </div>
            )}
          />
        )}
      </TabsContent>

      <TabsContent value="no_apps">
        {loading.campaigns_no_applications ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <ListCard
            title="Campanhas ativas sem candidaturas"
            icon={AlertTriangle}
            items={data.campaigns_no_applications?.campaigns_no_applications}
            emptyText="Todas as campanhas têm candidaturas"
            renderItem={(camp) => (
              <div key={camp.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{camp.title || `Campaign #${camp.id?.slice(0, 8)}`}</p>
                  <TimeAgo date={camp.created_date} />
                </div>
                <Badge variant="outline">active</Badge>
              </div>
            )}
          />
        )}
      </TabsContent>

      <TabsContent value="disputes">
        {loading.open_disputes ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <ListCard
            title="Disputas abertas"
            icon={AlertTriangle}
            items={data.open_disputes?.open_disputes}
            emptyText="Nenhuma disputa aberta"
            renderItem={(disp) => (
              <div key={disp.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Dispute #{disp.id?.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{disp.reason}</p>
                </div>
                <Badge variant={disp.status === 'open' ? 'destructive' : 'outline'}>{disp.status}</Badge>
              </div>
            )}
          />
        )}
      </TabsContent>

      <TabsContent value="incomplete">
        {loading.incomplete_onboarding ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ListCard
              title="Creators com onboarding incompleto"
              icon={Users}
              items={data.incomplete_onboarding?.incomplete_creators}
              emptyText="Nenhum creator com onboarding pendente"
              renderItem={(c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{c.display_name || c.id?.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">Step {c.onboarding_step || 1}</p>
                  </div>
                  <TimeAgo date={c.created_date} />
                </div>
              )}
            />
            <ListCard
              title="Brands com onboarding incompleto"
              icon={Users}
              items={data.incomplete_onboarding?.incomplete_brands}
              emptyText="Nenhuma brand com onboarding pendente"
              renderItem={(b) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{b.company_name || b.id?.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">Step {b.onboarding_step || 1}</p>
                  </div>
                  <TimeAgo date={b.created_date} />
                </div>
              )}
            />
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}