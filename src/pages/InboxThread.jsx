import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/contexts/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Send, Loader2 } from 'lucide-react';
import MessageBubble from '@/components/inbox/MessageBubble';
import { toast } from 'sonner';
import moment from 'moment';

export default function InboxThread() {
  const { user, profileType } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const applicationId = urlParams.get('applicationId');

  if (!applicationId) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Conversa não encontrada.</p>
        <Link to={createPageUrl('Inbox')} className="text-primary text-sm mt-2 inline-block">Voltar</Link>
      </div>
    );
  }

  const [application, setApplication] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [otherName, setOtherName] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (!applicationId || !user) return;
    loadThread();

    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data?.application_id === applicationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
        // Mark as read if it's for me
        if (event.data.recipient_id === user.id && !event.data.read_at) {
          base44.entities.Message.update(event.data.id, { read_at: new Date().toISOString() });
        }
      }
    });

    return () => unsub?.();
  }, [applicationId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadThread = async () => {
    // Load application
    const apps = await base44.entities.Application.filter({ id: applicationId });
    if (apps.length === 0) { setLoading(false); return; }
    const app = apps[0];
    setApplication(app);

    // Load campaign
    const camps = await base44.entities.Campaign.filter({ id: app.campaign_id });
    if (camps.length > 0) setCampaign(camps[0]);

    // Load other participant name
    if (profileType === 'brand') {
      const creators = await base44.entities.Creator.filter({ id: app.creator_id });
      setOtherName(creators[0]?.display_name || 'Criador');
    } else {
      const brands = await base44.entities.Brand.filter({ id: app.brand_id });
      setOtherName(brands[0]?.company_name || 'Marca');
    }

    // Load messages
    const msgs = await base44.entities.Message.filter({ application_id: applicationId }, 'created_date', 100);
    setMessages(msgs);

    // Mark unread as read
    const unread = msgs.filter(m => m.recipient_id === user.id && !m.read_at);
    for (const m of unread) {
      base44.entities.Message.update(m.id, { read_at: new Date().toISOString() });
    }

    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);

    const recipientId = profileType === 'brand' 
      ? application.creator_id 
      : application.brand_id;

    // Resolve recipient user_id from profile id
    let recipientUserId = recipientId;
    if (profileType === 'brand') {
      const creators = await base44.entities.Creator.filter({ id: application.creator_id });
      if (creators.length > 0) recipientUserId = creators[0].user_id;
    } else {
      const brands = await base44.entities.Brand.filter({ id: application.brand_id });
      if (brands.length > 0) recipientUserId = brands[0].user_id;
    }

    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      application_id: applicationId,
      sender_id: user.id,
      sender_type: profileType,
      recipient_id: recipientUserId,
      content: newMessage.trim(),
      created_date: new Date().toISOString(),
      read_at: null,
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    try {

      await base44.entities.Message.create({
        application_id: applicationId,
        sender_id: user.id,
        sender_type: profileType,
        recipient_id: recipientUserId,
        content: tempMsg.content,
      });
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Falha ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Conversa não encontrada.</p>
        <Link to={createPageUrl('Inbox')} className="text-primary text-sm mt-2 inline-block">
          Voltar para Mensagens
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - var(--header-height, 56px) - var(--bottom-nav-height, 72px) - 2rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b mb-3 flex-shrink-0">
        <Link to={createPageUrl('Inbox')}>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{otherName}</p>
          <p className="text-xs text-muted-foreground truncate">{campaign?.title || 'Campanha'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            Envie a primeira mensagem para iniciar a conversa.
          </p>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 pt-3 border-t flex-shrink-0">
        <Textarea
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 min-h-[44px] max-h-32 resize-none"
        />
        <Button 
          onClick={handleSend} 
          disabled={!newMessage.trim() || sending}
          size="icon"
          className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}