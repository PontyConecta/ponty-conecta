import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/contexts/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Send, Loader2, ExternalLink } from 'lucide-react';
import MessageBubble from '@/components/inbox/MessageBubble';
import CreatorProfileModal from '@/components/modals/CreatorProfileModal';
import BrandProfileModal from '@/components/modals/BrandProfileModal';
import { TYPE_LABELS } from '@/components/utils/creatorTypeConfig';
import { toast } from 'sonner';
import moment from 'moment';

export default function InboxThread() {
  const { user, profileType } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const applicationId = urlParams.get('applicationId');
  const recipientIdParam = urlParams.get('recipientId');
  const recipientNameParam = urlParams.get('recipientName');

  // Direct conversation: derive a stable key from sorted user IDs
  const isDirect = !applicationId && !!recipientIdParam;
  const conversationKey = isDirect && user
    ? [user.id, recipientIdParam].sort().join('__direct__')
    : applicationId;

  if (!conversationKey) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Conversa não encontrada.</p>
        <Link to={createPageUrl('Inbox')} className="text-primary text-sm mt-2 inline-block">Voltar</Link>
      </div>
    );
  }

  const [application, setApplication] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [otherName, setOtherName] = useState(isDirect ? (recipientNameParam || 'Usuário') : '');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOtherProfile, setShowOtherProfile] = useState(false);
  const [otherCreator, setOtherCreator] = useState(null);
  const [otherBrand, setOtherBrand] = useState(null);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversationKey || !user) return;
    let isMounted = true;

    const loadThread = async () => {
      try {
      if (!isDirect) {
        // Application-based thread
        const apps = await base44.entities.Application.filter({ id: conversationKey });
        if (!isMounted) return;
        if (apps.length === 0) { setLoading(false); return; }
        const app = apps[0];
        setApplication(app);

        const camps = await base44.entities.Campaign.filter({ id: app.campaign_id });
        if (!isMounted) return;
        if (camps.length > 0) setCampaign(camps[0]);

        if (profileType === 'brand') {
          const creators = await base44.entities.Creator.filter({ id: app.creator_id });
          if (!isMounted) return;
          if (creators[0]) setOtherCreator(creators[0]);
          setOtherName(creators[0]?.display_name || 'Criador');
        } else {
          const brands = await base44.entities.Brand.filter({ id: app.brand_id });
          if (!isMounted) return;
          if (brands[0]) setOtherBrand(brands[0]);
          setOtherName(brands[0]?.company_name || 'Marca');
        }
      } else {
        // Direct conversation: resolve partner profile
        if (profileType === 'brand') {
          const creators = await base44.entities.Creator.filter({ user_id: recipientIdParam });
          if (!isMounted) return;
          if (creators[0]) { setOtherCreator(creators[0]); setOtherName(creators[0].display_name || recipientNameParam || 'Usuário'); }
        } else {
          const brands = await base44.entities.Brand.filter({ user_id: recipientIdParam });
          if (!isMounted) return;
          if (brands[0]) { setOtherBrand(brands[0]); setOtherName(brands[0].company_name || recipientNameParam || 'Usuário'); }
        }
      }

      // Load messages
      const msgs = await base44.entities.Message.filter({ application_id: conversationKey }, 'created_date', 200);
      if (!isMounted) return;
      setMessages(msgs);

      // Mark unread as read
      const unread = msgs.filter(m => m.recipient_id === user.id && !m.read_at);
      if (unread.length > 0) {
        Promise.all(
          unread.map(m => base44.entities.Message.update(m.id, { read_at: new Date().toISOString() }))
        ).catch(() => {});
      }
      } catch (err) {
        console.error('Erro ao carregar thread:', err);
        if (isMounted) setError('Não foi possível carregar a conversa. Tente novamente.');
      }

      if (isMounted) setLoading(false);
    };

    loadThread();

    const unsub = base44.entities.Message.subscribe((event) => {
      if (!isMounted) return;
      if (event.type === 'create' && event.data?.application_id === conversationKey) {
        setMessages(prev => {
          if (prev.some(m => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
        if (event.data.recipient_id === user.id && !event.data.read_at) {
          base44.entities.Message.update(event.data.id, { read_at: new Date().toISOString() }).catch(() => {});
        }
      }
    });

    return () => { isMounted = false; unsub?.(); };
  }, [conversationKey, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);

    let recipientUserId;

    if (isDirect) {
      recipientUserId = recipientIdParam;
    } else {
      // Resolve from application profile entities
      if (profileType === 'brand') {
        const creators = await base44.entities.Creator.filter({ id: application.creator_id });
        recipientUserId = creators[0]?.user_id || application.creator_id;
      } else {
        const brands = await base44.entities.Brand.filter({ id: application.brand_id });
        recipientUserId = brands[0]?.user_id || application.brand_id;
      }
    }

    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      application_id: conversationKey,
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
        application_id: conversationKey,
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

  if (!isDirect && !application) {
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
          <Button variant="ghost" size="icon" className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <button
          onClick={() => setShowOtherProfile(true)}
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity min-h-[44px] text-left flex-1"
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={otherCreator?.avatar_url || otherBrand?.logo_url} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {otherName?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{otherName}</p>
            {isDirect && otherCreator?.creator_type ? (
              <p className="text-xs text-muted-foreground">{TYPE_LABELS[otherCreator.creator_type] || 'Creator'}</p>
            ) : (
              <p className="text-xs text-muted-foreground truncate">{isDirect ? 'Conversa direta' : (campaign?.title || 'Campanha')}</p>
            )}
          </div>
        </button>
        {!isDirect && application && (
          <Link to={createPageUrl(profileType === 'brand' ? 'ApplicationsManager' : 'MyApplications')} className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0">
            Ver candidatura <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          {error}
          <button onClick={() => { setError(null); setLoading(true); }} className="ml-2 text-primary underline">Tentar novamente</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            {isDirect
              ? `Inicie a conversa com ${otherName}`
              : 'Envie a primeira mensagem para iniciar a conversa.'}
          </p>
        )}
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const msgDate = moment(msg.created_date).startOf('day');
          const prevDate = prev ? moment(prev.created_date).startOf('day') : null;
          const showDateSep = !prevDate || !msgDate.isSame(prevDate);
          const today = moment().startOf('day');
          const yesterday = moment().subtract(1, 'day').startOf('day');
          let dateLabel = '';
          if (showDateSep) {
            if (msgDate.isSame(today)) dateLabel = 'Hoje';
            else if (msgDate.isSame(yesterday)) dateLabel = 'Ontem';
            else dateLabel = msgDate.format('D [de] MMMM');
          }
          return (
            <React.Fragment key={msg.id}>
              {showDateSep && (
                <div className="flex justify-center py-2">
                  <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">{dateLabel}</span>
                </div>
              )}
              <MessageBubble message={msg} isOwn={msg.sender_id === user.id} profileType={profileType} />
            </React.Fragment>
          );
        })}
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

      {showOtherProfile && profileType === 'brand' && otherCreator && (
        <CreatorProfileModal
          creator={otherCreator}
          isOpen={showOtherProfile}
          onClose={() => setShowOtherProfile(false)}
        />
      )}
      {showOtherProfile && profileType === 'creator' && otherBrand && (
        <BrandProfileModal
          brand={otherBrand}
          isOpen={showOtherProfile}
          onClose={() => setShowOtherProfile(false)}
        />
      )}
    </div>
  );
}