import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Send, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteCreatorModal({ open, onClose, creator, campaigns }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const activeCampaigns = (campaigns || []).filter(c => c.status === 'active' || c.status === 'draft');
  const firstName = creator?.display_name?.split(' ')[0] || 'Criadora';

  const handleSend = async () => {
    if (!selectedCampaign || !creator?.user_id || !user) return;
    setSending(true);

    const campaign = activeCampaigns.find(c => c.id === selectedCampaign);
    const conversationId = [user.id, creator.user_id].sort().join('__direct__');
    const defaultMsg = `Olá! Seu perfil chamou nossa atenção e gostaríamos de te convidar para participar desta campanha. Candidate-se pelo app!`;
    const content = `🎯 *Convite para campanha: "${campaign?.title || 'Campanha'}"*\n\n${message.trim() || defaultMsg}`;

    try {
      await base44.functions.invoke('sendMessage', {
        recipient_id: creator.user_id,
        content,
        application_id: conversationId,
      });
      toast.success(`Convite enviado para ${firstName}! ✨`);
      onClose();
      navigate(createPageUrl('InboxThread') + `?recipientId=${creator.user_id}&recipientName=${encodeURIComponent(creator.display_name || 'Criadora')}`);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Erro ao enviar convite');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={creator?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">{creator?.display_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-semibold">{creator?.display_name || 'Criadora'}</p>
              <p className="text-xs text-muted-foreground font-normal">Convidar para campanha</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {activeCampaigns.length === 0 ? (
            <div className="text-center py-6">
              <UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Você não tem campanhas ativas para convidar.</p>
              <Button size="sm" className="mt-3" onClick={() => { onClose(); navigate(createPageUrl('CampaignManager')); }}>
                Criar Campanha
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-sm font-medium mb-3 block">Selecione a campanha</Label>
                <RadioGroup value={selectedCampaign} onValueChange={setSelectedCampaign} className="space-y-2">
                  {activeCampaigns.map(c => (
                    <label key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedCampaign === c.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                      <RadioGroupItem value={c.id} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{(c.slots_total || 1) - (c.slots_filled || 0)} vagas abertas</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Mensagem pessoal (opcional)</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Olá ${firstName}! Seu perfil chamou nossa atenção...`}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={onClose} className="flex-1 min-h-[44px]">Cancelar</Button>
                <Button
                  onClick={handleSend}
                  disabled={!selectedCampaign || sending}
                  className="flex-1 min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Enviar Convite</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}