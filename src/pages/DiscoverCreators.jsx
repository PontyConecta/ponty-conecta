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
import CreatorProfileModal from '@/components/modals/CreatorProfileModal';
import {
  Search, Loader2, Users, Filter, X
} from 'lucide-react';
import { BRAZIL_STATES } from '@/components/common/BrazilStateSelect';
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
  const isAdmin = user?.role === 'admin';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const allCreators = await base44.entities.Creator.filter({ account_state: 'ready' }, '-created_date');
    setCreators(allCreators.filter(c => c.display_name?.trim()));
    setLoading(false);
  };

  const visibleCreators = useMemo(() => {
    if (isAdmin) return creators;
    return creators.filter(c => !c.is_hidden);
  }, [creators, isAdmin]);

  const filteredCreators = useMemo(() => {
    const filtered = visibleCreators.filter(c => {
      const matchSearch = !searchTerm || c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchNiche = filterNiche === 'all' || c.niche?.includes(filterNiche);
      const matchSize = filterSize === 'all' || c.profile_size === filterSize;
      const matchState = filterState === 'all' || c.state === filterState;
      return matchSearch && matchNiche && matchSize && matchState;
    });
    // Rank creators with avatar_url before those without
    return filtered.sort((a, b) => {
      const avatarA = a.avatar_url ? 1 : 0;
      const avatarB = b.avatar_url ? 1 : 0;
      if (avatarB !== avatarA) return avatarB - avatarA;
      // Secondary: recency
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [visibleCreators, searchTerm, filterNiche, filterSize, filterState]);

  const featuredCreators = useMemo(() => visibleCreators.filter(c => c.featured), [visibleCreators]);
  const newCreators = useMemo(() => [...visibleCreators].sort((a, b) => {
    const avatarA = a.avatar_url ? 1 : 0;
    const avatarB = b.avatar_url ? 1 : 0;
    if (avatarB !== avatarA) return avatarB - avatarA;
    return new Date(b.created_date) - new Date(a.created_date);
  }).slice(0, 12), [visibleCreators]);

  const nicheCreators = useMemo(() => {
    if (filterNiche === 'all') return [];
    return visibleCreators.filter(c => c.niche?.includes(filterNiche)).slice(0, 10);
  }, [visibleCreators, filterNiche]);

  const showSections = filterNiche === 'all' && !searchTerm && filterSize === 'all' && filterState === 'all';

  const sectionIds = useMemo(() => {
    if (!showSections) return new Set();
    const ids = new Set();
    featuredCreators.forEach(c => ids.add(c.id));
    newCreators.forEach(c => ids.add(c.id));
    return ids;
  }, [showSections, featuredCreators, newCreators]);

  const gridCreators = useMemo(() => {
    if (!showSections) return filteredCreators;
    return filteredCreators.filter(c => !sectionIds.has(c.id));
  }, [filteredCreators, sectionIds, showSections]);

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
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Descobrir Creators</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Explore criadoras de conteúdo</p>
      </div>

      <CategoryChips categories={NICHES} value={filterNiche} onChange={setFilterNiche} />

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

      {showSections && (
        <div className="space-y-6">
          {featuredCreators.length > 0 && (
            <HorizontalSection title="Em destaque">
              {featuredCreators.map(c => (
                <div key={c.id} className="w-[160px] flex-shrink-0">
                  <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed}
                    onClick={() => setSelectedCreator(c)} />
                </div>
              ))}
            </HorizontalSection>
          )}
          {newCreators.length > 0 && (
            <HorizontalSection title="Novas criadoras">
              {newCreators.map(c => (
                <div key={c.id} className="w-[160px] flex-shrink-0">
                  <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed}
                    onClick={() => setSelectedCreator(c)} />
                </div>
              ))}
            </HorizontalSection>
          )}
        </div>
      )}

      {filterNiche !== 'all' && nicheCreators.length > 0 && showSections && (
        <HorizontalSection title={filterNiche}>
          {nicheCreators.map(c => (
            <div key={c.id} className="w-[160px] flex-shrink-0">
              <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed}
                onClick={() => setSelectedCreator(c)} />
            </div>
          ))}
        </HorizontalSection>
      )}

      {(() => {
        const displayCreators = showSections ? gridCreators : filteredCreators;
        if (showSections && displayCreators.length === 0 && visibleCreators.length > 0) return null;
        return (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">
              {showSections ? 'Todos os creators' : 'Resultados'}
            </h2>
            {displayCreators.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {displayCreators.map(c => (
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
        );
      })()}

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