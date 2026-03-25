import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CampaignsForYou({ creatorNiches = [] }) {
  const [campaigns, setCampaigns] = useState([]);
  const [brands, setBrands] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.Campaign.filter({ status: 'active' }, '-created_date', 20);
      // Filter by niche overlap
      let filtered = all;
      if (creatorNiches.length > 0) {
        const nicheSet = new Set(creatorNiches.map(n => n.toLowerCase()));
        filtered = all.filter(c =>
          (c.niche_required || []).some(n => nicheSet.has(n.toLowerCase()))
        );
        if (filtered.length < 3) filtered = all;
      }
      const top = filtered.slice(0, 4);

      // Fetch brand names
      const brandIds = [...new Set(top.map(c => c.brand_id).filter(Boolean))];
      if (brandIds.length > 0) {
        const brandData = await base44.entities.Brand.filter({ id: { $in: brandIds } });
        const map = {};
        brandData.forEach(b => { map[b.id] = b; });
        setBrands(map);
      }

      setCampaigns(top);
      setLoading(false);
    };
    load();
  }, []);

  if (loading || campaigns.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base lg:text-lg font-semibold">Marcas buscando o seu perfil</CardTitle>
        <Link to={createPageUrl('OpportunityFeed')}>
          <Button variant="ghost" size="sm" className="text-primary">
            Ver todas <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {campaigns.map(c => (
          <Link
            key={c.id}
            to={createPageUrl('OpportunityFeed') + '?campaignId=' + c.id}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group min-h-[56px]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {brands[c.brand_id]?.company_name || ''}
                {c.remuneration_type === 'cash' && c.budget_max ? ` · R$ ${c.budget_max}` : ''}
                {c.remuneration_type === 'barter' ? ' · Permuta' : ''}
                {c.remuneration_type === 'mixed' ? ' · Misto' : ''}
                {c.slots_total ? ` · ${(c.slots_total - (c.slots_filled || 0))} vaga${(c.slots_total - (c.slots_filled || 0)) !== 1 ? 's' : ''}` : ''}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}