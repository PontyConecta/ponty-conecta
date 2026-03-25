import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2 } from 'lucide-react';

export default function NewConversationSheet({ open, onClose }) {
  const { profileType } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) { setSearch(''); setResults([]); return; }
    setLoading(true);
    const load = async () => {
      const data = profileType === 'brand'
        ? await base44.entities.Creator.filter({}, '-created_date', 50)
        : await base44.entities.Brand.filter({}, '-created_date', 50);
      setResults(data);
      setLoading(false);
    };
    load();
  }, [open, profileType]);

  const filtered = results.filter(r => {
    const name = profileType === 'brand' ? r.display_name : r.company_name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (item) => {
    const name = profileType === 'brand' ? item.display_name : item.company_name;
    onClose();
    navigate(createPageUrl('InboxThread') + `?recipientId=${item.user_id}&recipientName=${encodeURIComponent(name || 'Usuário')}`);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nova conversa</SheetTitle>
        </SheetHeader>
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
      </SheetContent>
    </Sheet>
  );
}