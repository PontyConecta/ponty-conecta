import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { useSubscription } from '@/components/contexts/SubscriptionContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Send } from 'lucide-react';
import { toast } from '@/components/utils/toast';

export default function NewConversationSheet({ open, onClose }) {
  const { user, profile, profileType } = useAuth();
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Creator pitch state
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [pitchNiche, setPitchNiche] = useState('');
  const [pitchReach, setPitchReach] = useState('');
  const [pitchProposal, setPitchProposal] = useState('');
  const [sending, setSending] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  const isCreator = profileType === 'creator';
  const showPitchFlow = isCreator && isSubscribed;

  useEffect(() => {
    if (!open) { setSearch(''); setResults([]); setSelectedBrand(null); return; }
    setLoading(true);
    const load = async () => {
      const data = profileType === 'brand'
        ? await base44.entities.Creator.filter({ account_state: 'ready' }, '-created_date', 50)
        : await base44.entities.Brand.filter({ account_state: 'ready' }, '-created_date', 50);
      setResults(data);
      setLoading(false);
    };
    load();

    // Check daily pitch limit for creators
    if (showPitchFlow && user?.id) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      base44.entities.Message.filter({ sender_id: user.id }, '-created_date', 50).then(msgs => {
        const directToday = msgs.filter(m => {
          const isDirectThread = m.application_id?.includes('__direct__');
          const isToday = new Date(m.created_date) >= today;
          return isDirectThread && isToday;
        });
        // Count unique conversations started today
        const uniqueConvos = new Set(directToday.map(m => m.application_id));
        setDailyCount(uniqueConvos.size);
      });
    }
  }, [open, profileType, showPitchFlow, user?.id]);

  // Auto-fill pitch fields
  useEffect(() => {
    if (selectedBrand && isCreator && profile) {
      setPitchNiche(profile.niche?.[0] || '');
      const p0 = profile.platforms?.[0];
      setPitchReach(p0 ? `${Math.round((p0.followers || 0) / 1000)}k seguidores no ${p0.name}` : '');
      setPitchProposal('');
    }
  }, [selectedBrand, isCreator, profile]);

  const filtered = results.filter(r => {
    const name = profileType === 'brand' ? r.display_name : r.company_name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (item) => {
    if (showPitchFlow) {
      setSelectedBrand(item);
    } else {
      const name = profileType === 'brand' ? item.display_name : item.company_name;
      onClose();
      navigate(createPageUrl('InboxThread') + `?recipientId=${item.user_id}&recipientName=${encodeURIComponent(name || 'Usuário')}`);
    }
  };

  const handleSendPitch = async () => {
    if (!selectedBrand || !pitchProposal.trim()) return;
    setSending(true);
    try {
      const conversationId = [user.id, selectedBrand.user_id].sort().join('__direct__');
      const content = `🎯 Pitch de Parceria\nNicho: ${pitchNiche || 'Não informado'}\nAlcance: ${pitchReach || 'Não informado'}\nProposta: ${pitchProposal}`;
      await base44.entities.Message.create({
        application_id: conversationId,
        sender_id: user.id,
        sender_type: 'creator',
        recipient_id: selectedBrand.user_id,
        content,
      });
      toast.success('Pitch enviado com sucesso! ✨');
      onClose();
      navigate(createPageUrl('InboxThread') + `?recipientId=${selectedBrand.user_id}&recipientName=${encodeURIComponent(selectedBrand.company_name || 'Marca')}`);
    } catch (error) {
      console.error('Error sending pitch:', error);
      toast.error('Erro ao enviar pitch. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const pitchLimitReached = dailyCount >= 5;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{showPitchFlow && selectedBrand ? 'Enviar Pitch' : 'Nova conversa'}</SheetTitle>
        </SheetHeader>

        {/* Pitch form for creators */}
        {showPitchFlow && selectedBrand ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedBrand.logo_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">{selectedBrand.company_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{selectedBrand.company_name}</p>
                <p className="text-xs text-muted-foreground">{selectedBrand.industry || 'Marca'}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm">Nicho principal</Label>
              <Select value={pitchNiche} onValueChange={setPitchNiche}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(profile?.niche || []).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Alcance</Label>
              <Input value={pitchReach} onChange={(e) => setPitchReach(e.target.value)} className="mt-1" placeholder="Ex: 12k seguidores, 4% engajamento" />
            </div>

            <div>
              <Label className="text-sm">Proposta</Label>
              <Textarea
                value={pitchProposal}
                onChange={(e) => { if (e.target.value.length <= 280) setPitchProposal(e.target.value); }}
                className="mt-1 min-h-[100px]"
                placeholder="Por que você é a escolha certa para esta marca?"
              />
              <div className="flex justify-end">
                <span className={`text-xs tabular-nums ${pitchProposal.length > 250 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {280 - pitchProposal.length} restantes
                </span>
              </div>
            </div>

            {pitchLimitReached && (
              <p className="text-xs text-destructive font-medium">Limite de 5 pitches por dia atingido. Tente novamente amanhã.</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedBrand(null)}>Voltar</Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground"
                disabled={!pitchProposal.trim() || sending || pitchLimitReached}
                onClick={handleSendPitch}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" />Enviar Pitch</>}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={profileType === 'brand' ? 'Buscar criadoras...' : 'Buscar marcas...'}
                className="pl-10"
              />
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filtered.map(item => {
                  const name = profileType === 'brand' ? item.display_name : item.company_name;
                  const avatar = profileType === 'brand' ? item.avatar_url : item.logo_url;
                  const subtitle = profileType === 'brand' ? (item.niche?.slice(0, 2).join(', ') || 'Criadora') : (item.industry || 'Marca');
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-left min-h-[56px]"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{name || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum resultado encontrado</p>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}