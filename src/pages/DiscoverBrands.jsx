import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PaywallModal from '@/components/PaywallModal';
import DiscoverBrandCard from '@/components/cards/DiscoverBrandCard';
import CategoryChips from '@/components/discover/CategoryChips';
import HorizontalSection from '@/components/discover/HorizontalSection';
import BrandProfileModal from '@/components/modals/BrandProfileModal';
import { useHidden } from '@/components/hooks/useHidden';
import {
  Search, Loader2, Building2, Filter, X
} from 'lucide-react';
import { BRAZIL_STATES } from '@/components/common/BrazilStateSelect';

const INDUSTRIES = [
  { value: 'fashion', label: 'Moda' },
  { value: 'beauty', label: 'Beleza' },
  { value: 'tech', label: 'Tecnologia' },
  { value: 'food_beverage', label: 'Alimentos' },
  { value: 'health_wellness', label: 'Saúde' },
  { value: 'travel', label: 'Viagens' },
  { value: 'entertainment', label: 'Entretenimento' },
  { value: 'sports', label: 'Esportes' },
];

export default function DiscoverBrands() {
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const userData = await base44.auth.me();
    const creators = await base44.entities.Creator.filter({ user_id: userData.id });
    if (creators.length > 0) {
      const c = creators[0];
      setCreatorProfile(c);
      setIsSubscribed(c.subscription_status === 'premium' || c.subscription_status === 'legacy' || (c.subscription_status === 'trial' && c.trial_end_date && new Date(c.trial_end_date) > new Date()));
    }
    const allBrands = await base44.entities.Brand.filter({ account_state: 'ready' }, '-created_date');
    setBrands(allBrands);
    setLoading(false);
  };

  const { hiddenIds, loaded: hiddenLoaded, toggleHide, isHidden } = useHidden('HiddenBrand', creatorProfile?.id);

  // All visible brands (hidden filtered out)
  const visibleBrands = useMemo(() => {
    return brands.filter(b => !hiddenIds.has(b.id));
  }, [brands, hiddenIds]);

  const filteredBrands = useMemo(() => {
    return visibleBrands.filter(b => {
      const matchSearch = !searchTerm || b.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchIndustry = filterIndustry === 'all' || b.industry === filterIndustry;
      const matchState = filterState === 'all' || b.state === filterState;
      return matchSearch && matchIndustry && matchState;
    });
  }, [visibleBrands, searchTerm, filterIndustry, filterState]);

  const activeBrands = useMemo(() => visibleBrands.filter(b => b.active_campaigns > 0).slice(0, 10), [visibleBrands]);
  const newBrands = useMemo(() => [...visibleBrands].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10), [visibleBrands]);

  const showSections = filterIndustry === 'all' && !searchTerm && filterState === 'all';

  const sectionIds = useMemo(() => {
    if (!showSections) return new Set();
    const ids = new Set();
    activeBrands.forEach(b => ids.add(b.id));
    newBrands.forEach(b => ids.add(b.id));
    return ids;
  }, [showSections, activeBrands, newBrands]);

  const gridBrands = useMemo(() => {
    if (!showSections) return filteredBrands;
    return filteredBrands.filter(b => !sectionIds.has(b.id));
  }, [filteredBrands, sectionIds, showSections]);

  const handleToggleHide = async (brandId) => {
    await toggleHide(brandId);
    if (selectedBrand?.id === brandId) setSelectedBrand(null);
  };

  if (loading || !hiddenLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+24px)] lg:pb-0">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Descobrir Marcas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Explore marcas parceiras</p>
      </div>

      <CategoryChips categories={INDUSTRIES} value={filterIndustry} onChange={setFilterIndustry} />

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou descrição..." className="pl-9 h-9 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1" onClick={() => setShowAdvanced(!showAdvanced)}>
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50 border">
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {BRAZIL_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {filterState !== 'all' && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFilterState('all')}>
              <X className="w-3 h-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
      )}

      {showSections && (
        <div className="space-y-6">
          {activeBrands.length > 0 && (
            <HorizontalSection title="Com campanhas ativas">
              {activeBrands.map(b => (
                <div key={b.id} className="w-[160px] flex-shrink-0">
                  <DiscoverBrandCard brand={b} isSubscribed={isSubscribed}
                    onClick={() => setSelectedBrand(b)}
                    onHide={() => handleToggleHide(b.id)} />
                </div>
              ))}
            </HorizontalSection>
          )}
          {newBrands.length > 0 && (
            <HorizontalSection title="Novas marcas">
              {newBrands.map(b => (
                <div key={b.id} className="w-[160px] flex-shrink-0">
                  <DiscoverBrandCard brand={b} isSubscribed={isSubscribed}
                    onClick={() => setSelectedBrand(b)}
                    onHide={() => handleToggleHide(b.id)} />
                </div>
              ))}
            </HorizontalSection>
          )}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {showSections ? 'Todas as marcas' : 'Resultados'}
        </h2>
        {(showSections ? gridBrands : filteredBrands).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(showSections ? gridBrands : filteredBrands).map(b => (
              <DiscoverBrandCard key={b.id} brand={b} isSubscribed={isSubscribed}
                onClick={() => setSelectedBrand(b)}
                onHide={() => handleToggleHide(b.id)} />
            ))}
          </div>
        ) : (
          <Card className="border bg-card">
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Nenhuma marca encontrada</h3>
              <p className="text-sm text-muted-foreground">Tente ajustar seus filtros</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedBrand} onOpenChange={() => setSelectedBrand(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Perfil da Marca</DialogTitle></DialogHeader>
          {selectedBrand && (
            <BrandProfileModal brand={selectedBrand} isSubscribed={isSubscribed}
              onPaywall={() => setShowPaywall(true)}
              onHide={() => handleToggleHide(selectedBrand.id)}
              isHidden={false} />
          )}
        </DialogContent>
      </Dialog>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)}
        title="Contato Premium" description="Assine para entrar em contato direto com marcas."
        feature="Ver email e telefone da marca" isAuthenticated={true} />
    </div>
  );
}