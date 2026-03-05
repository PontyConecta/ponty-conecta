import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PaywallModal from '@/components/PaywallModal';
import DiscoverCreatorCard from '@/components/cards/DiscoverCreatorCard';
import CategoryChips from '@/components/discover/CategoryChips';
import HorizontalSection from '@/components/discover/HorizontalSection';
import {
  Search, Loader2, MapPin, Users, CheckCircle2, Mail, Phone, ExternalLink, Filter, X
} from 'lucide-react';
import { BRAZIL_STATES, getStateLabel } from '@/components/common/BrazilStateSelect';
import { isProfileSubscribed } from '@/components/utils/subscriptionUtils';
import { useAuth } from '@/components/contexts/AuthContext';

const NICHES = [
  { value: 'Moda', label: 'Moda' },
  { value: 'Beleza', label: 'Beleza' },
  { value: 'Lifestyle', label: 'Lifestyle' },
  { value: 'Tecnologia', label: 'Tecnologia' },
  { value: 'Fitness', label: 'Fitness' },
  { value: 'Gastronomia', label: 'Gastronomia' },
  { value: 'Games', label: 'Games' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Viagens', label: 'Viagens' },
];

export default function DiscoverCreators() {
  const { user, profile: authProfile, profileType } = useAuth();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNiche, setFilterNiche] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const isSubscribed = authProfile ? isProfileSubscribed(authProfile) : false;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const allCreators = await base44.entities.Creator.filter({ account_state: 'ready' }, '-created_date');
    const valid = allCreators.filter(c => c.avatar_url && c.bio && c.niche?.length > 0 && c.platforms?.length > 0);
    setCreators(valid);
    setLoading(false);
  };

  const filteredCreators = useMemo(() => {
    return creators.filter(c => {
      const matchSearch = !searchTerm || c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchNiche = filterNiche === 'all' || c.niche?.includes(filterNiche);
      const matchSize = filterSize === 'all' || c.profile_size === filterSize;
      const matchState = filterState === 'all' || c.state === filterState;
      return matchSearch && matchNiche && matchSize && matchState;
    });
  }, [creators, searchTerm, filterNiche, filterSize, filterState]);

  const featuredCreators = useMemo(() => creators.filter(c => c.featured), [creators]);
  const newCreators = useMemo(() => [...creators].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10), [creators]);

  const nicheCreators = useMemo(() => {
    if (filterNiche === 'all') return [];
    return creators.filter(c => c.niche?.includes(filterNiche)).slice(0, 10);
  }, [creators, filterNiche]);

  const showSections = filterNiche === 'all' && !searchTerm && filterSize === 'all' && filterState === 'all';

  const formatFollowers = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const getTotalFollowers = (creator) => (creator.platforms || []).reduce((s, p) => s + (p.followers || 0), 0);

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
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Descobrir Creators</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {filteredCreators.length} {filteredCreators.length === 1 ? 'creator' : 'creators'}
        </p>
      </div>

      {/* Category chips */}
      <CategoryChips categories={NICHES} value={filterNiche} onChange={setFilterNiche} />

      {/* Search + filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou bio..." className="pl-9 h-9 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1" onClick={() => setShowAdvanced(!showAdvanced)}>
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50 border">
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {BRAZIL_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSize} onValueChange={setFilterSize}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Tamanho" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="nano">Nano</SelectItem>
              <SelectItem value="micro">Micro</SelectItem>
              <SelectItem value="mid">Mid</SelectItem>
              <SelectItem value="macro">Macro</SelectItem>
              <SelectItem value="mega">Mega</SelectItem>
            </SelectContent>
          </Select>
          {(filterState !== 'all' || filterSize !== 'all') && (
            <Button variant="ghost" size="sm" className="h-8 text-xs"
              onClick={() => { setFilterState('all'); setFilterSize('all'); }}>
              <X className="w-3 h-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
      )}

      {/* Horizontal sections when no active filter */}
      {showSections && (
        <div className="space-y-6">
          {featuredCreators.length > 0 && (
            <HorizontalSection title="Em destaque">
              {featuredCreators.map(c => (
                <div key={c.id} className="w-[160px] flex-shrink-0">
                  <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed} onClick={() => setSelectedCreator(c)} />
                </div>
              ))}
            </HorizontalSection>
          )}
          {newCreators.length > 0 && (
            <HorizontalSection title="Novas criadoras">
              {newCreators.map(c => (
                <div key={c.id} className="w-[160px] flex-shrink-0">
                  <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed} onClick={() => setSelectedCreator(c)} />
                </div>
              ))}
            </HorizontalSection>
          )}
        </div>
      )}

      {/* Niche section */}
      {filterNiche !== 'all' && nicheCreators.length > 0 && showSections && (
        <HorizontalSection title={filterNiche}>
          {nicheCreators.map(c => (
            <div key={c.id} className="w-[160px] flex-shrink-0">
              <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed} onClick={() => setSelectedCreator(c)} />
            </div>
          ))}
        </HorizontalSection>
      )}

      {/* Grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {showSections ? 'Todos os creators' : `Resultados (${filteredCreators.length})`}
        </h2>
        {filteredCreators.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCreators.map(c => (
              <DiscoverCreatorCard key={c.id} creator={c} isSubscribed={isSubscribed}
                onClick={() => setSelectedCreator(c)} />
            ))}
          </div>
        ) : (
          <Card className="border bg-card">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Nenhum creator encontrado</h3>
              <p className="text-sm text-muted-foreground">Tente ajustar seus filtros</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Creator Profile Modal */}
      <Dialog open={!!selectedCreator} onOpenChange={() => setSelectedCreator(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Perfil do Creator</DialogTitle></DialogHeader>
          {selectedCreator && (
            <CreatorProfileModal
              creator={selectedCreator}
              isSubscribed={isSubscribed}
              formatFollowers={formatFollowers}
              getTotalFollowers={getTotalFollowers}
              onPaywall={() => setShowPaywall(true)}
            />
          )}
        </DialogContent>
      </Dialog>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)}
        title="Contato Premium" description="Assine para entrar em contato direto com criadores."
        feature="Ver email e WhatsApp do criador" isAuthenticated={true} />
    </div>
  );
}

function CreatorProfileModal({ creator, isSubscribed, formatFollowers, getTotalFollowers, onPaywall }) {
  return (
    <div className="space-y-6 py-4">
      <div className="relative">
        <div className="h-32 rounded-xl overflow-hidden bg-gradient-to-r from-[#9038fa] to-[#b77aff]">
          {creator.cover_image_url && <img src={creator.cover_image_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <Avatar className="w-24 h-24 absolute -bottom-12 left-6 border-4 border-background shadow-lg">
          <AvatarImage src={creator.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">{creator.display_name?.[0]}</AvatarFallback>
        </Avatar>
      </div>

      <div className="pt-10 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{creator.display_name}</h2>
            {creator.is_verified && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
          </div>
          {(creator.state || creator.location) && (
            <p className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {creator.city ? `${creator.city}, ` : ''}{getStateLabel(creator.state) || creator.location}
            </p>
          )}
        </div>

        {creator.bio && <p className="text-muted-foreground">{creator.bio}</p>}

        <div className="flex items-center gap-6">
          <div><div className="text-2xl font-bold">{formatFollowers(getTotalFollowers(creator))}</div><div className="text-sm text-muted-foreground">Seguidores</div></div>
          <div><div className="text-2xl font-bold">{creator.completed_campaigns || 0}</div><div className="text-sm text-muted-foreground">Campanhas</div></div>
          <div><div className="text-2xl font-bold">{creator.on_time_rate || 100}%</div><div className="text-sm text-muted-foreground">No Prazo</div></div>
        </div>

        {creator.niche?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Nichos</h4>
            <div className="flex flex-wrap gap-2">{creator.niche.map((n, i) => <Badge key={i} variant="outline">{n}</Badge>)}</div>
          </div>
        )}

        {creator.platforms?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Plataformas</h4>
            <div className="space-y-2">
              {creator.platforms.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-primary">@{p.handle}</span>
                  </div>
                  <Badge variant="outline">{formatFollowers(p.followers || 0)}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {creator.portfolio_images?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Portfólio</h4>
            <div className="grid grid-cols-3 gap-2">
              {creator.portfolio_images.slice(0, 6).map((url, i) => (
                <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
          </div>
        )}

        {/* Rates — premium gated */}
        {(creator.rate_cash_min || creator.rate_cash_max) && (
          isSubscribed ? (
            <div className="p-4 rounded-xl bg-emerald-500/10">
              <h4 className="font-medium text-emerald-600 mb-1">Faixa de Valores</h4>
              <p className="text-emerald-500">R$ {creator.rate_cash_min || 0} - R$ {creator.rate_cash_max || 0}</p>
              {creator.accepts_barter && <Badge className="mt-2 bg-emerald-500/15 text-emerald-600 border-0">Aceita permutas</Badge>}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted relative overflow-hidden">
              <div className="blur-sm select-none">
                <h4 className="font-medium mb-1">Faixa de Valores</h4>
                <p>R$ ••• - R$ •••</p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80">
                <p className="text-xs text-muted-foreground mb-2">Dados completos disponíveis no plano premium</p>
                <Button size="sm" onClick={onPaywall}>Desbloquear</Button>
              </div>
            </div>
          )
        )}

        {/* Contact — premium gated */}
        {isSubscribed ? (
          <div className="p-4 rounded-xl space-y-3 bg-primary/5">
            <h4 className="font-medium text-primary">Contato</h4>
            {creator.contact_email && <a href={`mailto:${creator.contact_email}`} className="flex items-center gap-2 text-primary hover:underline"><Mail className="w-4 h-4" />{creator.contact_email}</a>}
            {creator.contact_whatsapp && <a href={`https://wa.me/${creator.contact_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Phone className="w-4 h-4" />{creator.contact_whatsapp}</a>}
            {creator.portfolio_url && <a href={creator.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-4 h-4" />Ver Media Kit</a>}
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