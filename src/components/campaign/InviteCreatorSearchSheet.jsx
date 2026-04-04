import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteCreatorSearchSheet({ campaign, onClose }) {
  const { user } = useAuth();
  const [creators, setCreators] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    base44.entities.Creator.filter({ account_state: 'ready' }, '-created_date', 100).then(data => {
      setCreators(data.filter(c => c.display_name?.trim()));
      setLoading(false);
    });
  }, []);

  const filtered = creators.filter(c => c.display_name?.toLowerCase().includes(search.toLowerCase()));

  const handleInvite = async (creator) => {
    setSending(creator.id);
    const content = `🎯 *Convite para campanha: "${campaign.title}"*\n\nOlá! Seu perfil chamou nossa atenção e gostaríamos de te convidar para participar desta campanha. Candidate-se pelo app!`;
    try {
      await base44.functions.invoke('sendMessage', {
        recipient_id: creator.user_id,
        content,
        application_id: null,
      });
      toast.success(`Convite enviado para ${creator.display_name?.split(' ')[0]}! ✨`);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Erro ao enviar convite. Tente novamente.');
    } finally {
      setSending(null);
    }
  };

  return (
    <Sheet open={true} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Buscar criadoras para "{campaign.title}"</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome..." className="pl-10" />
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={c.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{c.display_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.niche?.slice(0, 2).join(', ') || 'Criadora'}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={sending === c.id}
                    onClick={() => handleInvite(c)}
                    className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {sending === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Convidar'}
                  </Button>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma criadora encontrada</p>}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}