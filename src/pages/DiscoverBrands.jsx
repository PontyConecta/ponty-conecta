import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Search, Loader2, Building2, CheckCircle2, Globe, Mail, Phone, MapPin, Megaphone, Filter, X, Instagram, Linkedin
} from 'lucide-react';
import { BRAZIL_STATES, getStateLabel } from '@/components/common/BrazilStateSelect';
import { getPresenceUrl, getPresenceLabel } from '@/components/utils/phoneFormatter';

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

const INDUSTRY_LABELS = {
  fashion: 'Moda', beauty: 'Beleza', tech: 'Tecnologia', food_beverage: 'Alimentos',
  health_wellness: 'Saúde', travel: 'Viagens', entertainment: 'Entretenimento',
  sports: 'Esportes', finance: 'Finanças', education: 'Educação',
  retail: 'Varejo', automotive: 'Automotivo', other: 'Outros',
};

export default function DiscoverBrands() {
  const [user, setUser] = useState(null);
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
    setUser(userData);
    const creators = await base44.entities.Creator.filter({ user_id: userData.id });
    if (creators.length > 0) {
      const c = creators[0];
      setIsSubscribed(c.subscription_status === 'premium' || c.subscription_status === 'legacy' || (c.subscription_status === 'trial' && c.trial_end_date && new Date(c.trial_end_date) > new Date()));
    }
    const allBrands = await base44.entities.Brand.filter({ account_state: 'ready' }, '-created_date');
    const valid = allBrands.filter(b => b.logo_url && b.description && b.industry && b.contact_email);
    setBrands(valid);
    setLoading(false);
  };

  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      const matchSearch = !searchTerm || b.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchIndustry = filterIndustry === 'all' || b.industry === filterIndustry;
      const matchState = filterState === 'all' || b.state === filterState;
      return matchSearch && matchIndustry && matchState;
    });
  }, [brands, searchTerm, filterIndustry, filterState]);

  const activeBrands = useMemo(() => brands.filter(b => b.active_campaigns > 0).slice(0, 10), [brands]);
  const newBrands = useMemo(() => [...brands].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10), [brands]);

  const showSections = filterIndustry === 'all' && !searchTerm && filterState === 'all';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+24px)] lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Descobrir Marcas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {filteredBrands.length} {filteredBrands.length === 1 ? 'marca' : 'marcas'}
        </p>
      </div>

      {/* Category chips */}
      <CategoryChips categories={INDUSTRIES} value={filterIndustry} onChange={setFilterIndustry} />

      {/* Search + filters */}
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

      {/* Horizontal sections */}
      {showSections && (
        <div className="space-y-6">
          {activeBrands.length > 0 && (
            <HorizontalSection title="Com campanhas ativas">
              {activeBrands.map(b => (
                <div key={b.id} className="w-[160px] flex-shrink-0">
                  <DiscoverBrandCard brand={b} isSubscribed={isSubscribed} onClick={() => setSelectedBrand(b)} />
                </div>
              ))}
            </HorizontalSection>
          )}
          {newBrands.length > 0 && (
            <HorizontalSection title="Novas marcas">
              {newBrands.map(b => (
                <div key={b.id} className="w-[160px] flex-shrink-0">
                  <DiscoverBrandCard brand={b} isSubscribed={isSubscribed} onClick={() => setSelectedBrand(b)} />
                </div>
              ))}
            </HorizontalSection>
          )}
        </div>
      )}

      {/* Grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {showSections ? 'Todas as marcas' : `Resultados (${filteredBrands.length})`}
        </h2>
        {filteredBrands.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredBrands.map(b => (
              <DiscoverBrandCard key={b.id} brand={b} isSubscribed={isSubscribed}
                onClick={() => setSelectedBrand(b)} />
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

      {/* Brand Profile Modal */}
      <Dialog open={!!selectedBrand} onOpenChange={() => setSelectedBrand(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Perfil da Marca</DialogTitle></DialogHeader>
          {selectedBrand && (
            <BrandProfileModal brand={selectedBrand} isSubscribed={isSubscribed}
              onPaywall={() => setShowPaywall(true)} />
          )}
        </DialogContent>
      </Dialog>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)}
        title="Contato Premium" description="Assine para entrar em contato direto com marcas."
        feature="Ver email e telefone da marca" isAuthenticated={true} />
    </div>
  );
}

function BrandProfileModal({ brand, isSubscribed, onPaywall }) {
  return (
    <div className="space-y-6 py-4">
      <div className="relative">
        <div className="h-32 rounded-xl overflow-hidden bg-gradient-to-r from-[#9038fa] to-[#b77aff]">
          {brand.cover_image_url && <img src={brand.cover_image_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="absolute -bottom-12 left-6">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.company_name} className="w-24 h-24 rounded-xl border-4 border-card shadow-lg object-cover bg-card" />
          ) : (
            <div className="w-24 h-24 rounded-xl border-4 border-card shadow-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
          )}
        </div>
      </div>

      <div className="pt-10 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{brand.company_name}</h2>
            {brand.is_verified && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {brand.industry && <Badge variant="outline">{INDUSTRY_LABELS[brand.industry] || brand.industry}</Badge>}
            {brand.state && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {brand.city ? `${brand.city}, ` : ''}{getStateLabel(brand.state)}
              </Badge>
            )}
          </div>
        </div>

        {brand.description && <p className="text-muted-foreground">{brand.description}</p>}

        <div className="flex items-center gap-6">
          <div><div className="text-2xl font-bold">{brand.total_campaigns || 0}</div><div className="text-sm text-muted-foreground">Campanhas</div></div>
          <div><div className="text-2xl font-bold text-emerald-600">{brand.active_campaigns || 0}</div><div className="text-sm text-muted-foreground">Ativas</div></div>
        </div>

        {brand.target_audience && <div><h4 className="font-medium mb-2">Público-Alvo</h4><p className="text-muted-foreground">{brand.target_audience}</p></div>}
        {brand.content_guidelines && <div><h4 className="font-medium mb-2">Diretrizes de Conteúdo</h4><p className="text-muted-foreground">{brand.content_guidelines}</p></div>}

        {/* Contact — premium gated */}
        {isSubscribed ? (
          <div className="p-4 bg-primary/5 rounded-xl space-y-3">
            <h4 className="font-medium text-primary">Contato</h4>
            {brand.contact_email && <a href={`mailto:${brand.contact_email}`} className="flex items-center gap-2 text-primary hover:underline"><Mail className="w-4 h-4" />{brand.contact_email}</a>}
            {brand.contact_phone && <a href={`tel:${brand.contact_phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-primary hover:underline"><Phone className="w-4 h-4" />{brand.contact_phone}</a>}
            {brand.online_presences?.length > 0 ? (
              brand.online_presences.map((p, i) => (
                <a key={i} href={getPresenceUrl(p)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe className="w-4 h-4" />{getPresenceLabel(p)}</a>
              ))
            ) : (
              <>
                {brand.website && <a href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe className="w-4 h-4" />Website</a>}
                {brand.social_instagram && <a href={`https://instagram.com/${brand.social_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Instagram className="w-4 h-4" />{brand.social_instagram.replace('@', '')}</a>}
                {brand.social_linkedin && <a href={brand.social_linkedin.startsWith('http') ? brand.social_linkedin : `https://${brand.social_linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Linkedin className="w-4 h-4" />LinkedIn</a>}
              </>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl text-center bg-muted relative overflow-hidden">
            <div className="blur-sm select-none mb-2">
              <p>email@exemplo.com</p>
              <p>+55 (11) 9xxxx-xxxx</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80">
              <p className="text-xs text-muted-foreground mb-2">Dados completos disponíveis no plano premium</p>
              <Button size="sm" onClick={onPaywall}>Desbloquear</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}