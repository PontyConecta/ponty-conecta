import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FunnelChart({ funnel }) {
  if (!funnel) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Nenhum snapshot de funil disponível. Execute a agregação de métricas.
        </CardContent>
      </Card>
    );
  }

  const creatorFunnel = [
    { stage: 'Signup', value: funnel.creator_signup || 0 },
    { stage: 'Onboarding', value: funnel.creator_onboarding_completed || 0 },
    { stage: 'Candidatou', value: funnel.creators_applied || 0 },
    { stage: 'Aprovado', value: funnel.creators_approved || 0 },
    { stage: 'Entregou', value: funnel.deliveries_submitted || 0 },
    { stage: 'Aprovada', value: funnel.deliveries_approved || 0 },
  ];

  const brandFunnel = [
    { stage: 'Signup', value: funnel.brand_signup || 0 },
    { stage: 'Onboarding', value: funnel.brand_onboarding_completed || 0 },
    { stage: 'Campanha Criada', value: funnel.campaigns_created || 0 },
    { stage: 'Campanha Ativa', value: funnel.campaigns_activated || 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Funil Creator ({funnel.period?.replace(/_/g, ' ')})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={creatorFunnel} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" width={80} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(268 94% 58%)" radius={[0, 4, 4, 0]} name="Creators" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Funil Brand ({funnel.period?.replace(/_/g, ' ')})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={brandFunnel} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(197 37% 45%)" radius={[0, 4, 4, 0]} name="Brands" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}