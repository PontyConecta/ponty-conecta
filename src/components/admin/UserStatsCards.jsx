import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Star, Crown, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function TrendIndicator({ current, previous }) {
  if (!previous || previous === 0) return null;
  const diff = current - previous;
  const pct = ((diff / previous) * 100).toFixed(0);
  
  if (diff > 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
      <TrendingUp className="w-3 h-3" /> +{pct}%
    </span>
  );
  if (diff < 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-red-500">
      <TrendingDown className="w-3 h-3" /> {pct}%
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
}

export default function UserStatsCards({ brands, creators, onStatClick }) {
  const totalPremium = [...brands, ...creators].filter(p => p.subscription_status === 'premium').length;
  const totalVerified = [...brands, ...creators].filter(p => p.is_verified).length;
  const totalTrial = [...brands, ...creators].filter(p => p.subscription_status === 'trial').length;
  const totalIncomplete = [...brands, ...creators].filter(p => p.account_state === 'incomplete').length;

  // Calculate 7-day trends
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentBrands = brands.filter(b => new Date(b.created_date) >= sevenDaysAgo).length;
  const recentCreators = creators.filter(c => new Date(c.created_date) >= sevenDaysAgo).length;

  const stats = [
    { 
      label: 'Marcas', value: brands.length, icon: Building2, 
      iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
      sub: recentBrands > 0 ? `+${recentBrands} esta semana` : null,
      filter: { role: 'brand', status: 'all' }
    },
    { 
      label: 'Criadores', value: creators.length, icon: Star, 
      iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
      sub: recentCreators > 0 ? `+${recentCreators} esta semana` : null,
      filter: { role: 'creator', status: 'all' }
    },
    { 
      label: 'Premium', value: totalPremium, icon: Crown, 
      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
      sub: `${totalTrial} em trial`,
      filter: { role: 'all', status: 'premium' }
    },
    { 
      label: 'Verificados', value: totalVerified, icon: CheckCircle2, 
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
      sub: totalIncomplete > 0 ? `${totalIncomplete} incompletas` : 'Todos completos',
      filter: { role: 'all', status: 'verified' }
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card 
          key={stat.label}
          className="cursor-pointer hover:shadow-md transition-all"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          onClick={() => onStatClick?.(stat.filter)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                {stat.sub && (
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{stat.sub}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}