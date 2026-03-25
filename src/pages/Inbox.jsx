import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/contexts/AuthContext';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2, Plus } from 'lucide-react';
import InboxThreadItem from '@/components/inbox/InboxThreadItem';
import NewConversationSheet from '@/components/inbox/NewConversationSheet';

export default function Inbox() {
  const { user, profile, profileType } = useAuth();
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState({});
  const [campaigns, setCampaigns] = useState({});
  const [brands, setBrands] = useState({});
  const [creators, setCreators] = useState({});
  const [loading, setLoading] = useState(true);
  const [directPartners, setDirectPartners] = useState({});
  const [showNewConvo, setShowNewConvo] = useState(false);

  useEffect(() => {
    if (!user) return;
    let aborted = false;

    const load = async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Message.filter({ sender_id: user.id }, '-created_date', 200),
        base44.entities.Message.filter({ recipient_id: user.id }, '-created_date', 200),
      ]);
      if (aborted) return;
      const myMsgs = [...sent, ...received].filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
      setMessages(myMsgs);

      const appIds = [...new Set(myMsgs.map(m => m.application_id))];
      const realAppIds = appIds.filter(id => !id.includes('__direct__'));
      const directKeys = appIds.filter(id => id.includes('__direct__'));

      const directPartnerMap = {};
      for (const key of directKeys) {
        const parts = key.split('__direct__');
        const partnerId = parts[0] === user.id ? parts[1] : parts[0];
        const [crs, brs] = await Promise.all([
          base44.entities.Creator.filter({ user_id: partnerId }),
          base44.entities.Brand.filter({ user_id: partnerId }),
        ]);
        if (aborted) return;
        directPartnerMap[key] = crs[0]?.display_name || brs[0]?.company_name || 'Usuário';
      }
      
      if (realAppIds.length > 0) {
        const apps = await Promise.all(realAppIds.map(id => base44.entities.Application.filter({ id }).then(r => r[0])));
        if (aborted) return;
        const appMap = {};
        const campaignIds = new Set();
        const brandIds = new Set();
        const creatorIds = new Set();
        apps.filter(Boolean).forEach(app => {
          appMap[app.id] = app;
          if (app.campaign_id) campaignIds.add(app.campaign_id);
          if (app.brand_id) brandIds.add(app.brand_id);
          if (app.creator_id) creatorIds.add(app.creator_id);
        });
        setApplications(appMap);

        const [campsArr, brandsArr, creatorsArr] = await Promise.all([
          Promise.all([...campaignIds].map(id => base44.entities.Campaign.filter({ id }).then(r => r[0]))),
          Promise.all([...brandIds].map(id => base44.entities.Brand.filter({ id }).then(r => r[0]))),
          Promise.all([...creatorIds].map(id => base44.entities.Creator.filter({ id }).then(r => r[0]))),
        ]);
        if (aborted) return;

        const campMap = {};
        campsArr.filter(Boolean).forEach(c => { campMap[c.id] = c; });
        setCampaigns(campMap);
        const brandMap = {};
        brandsArr.filter(Boolean).forEach(b => { brandMap[b.id] = b; });
        setBrands(brandMap);
        const creatorMap = {};
        creatorsArr.filter(Boolean).forEach(c => { creatorMap[c.id] = c; });
        setCreators(creatorMap);
      }

      setDirectPartners(directPartnerMap);
      setLoading(false);
    };

    load();
    const unsub = base44.entities.Message.subscribe((event) => {
      if (!aborted && (event.data?.sender_id === user.id || event.data?.recipient_id === user.id)) {
        load();
      }
    });

    return () => { aborted = true; unsub?.(); };
  }, [user?.id]);

  const threads = useMemo(() => {
    const grouped = {};
    messages.forEach(msg => {
      if (!grouped[msg.application_id]) grouped[msg.application_id] = [];
      grouped[msg.application_id].push(msg);
    });

    return Object.entries(grouped)
      .map(([appId, msgs]) => {
        const sorted = msgs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        const lastMsg = sorted[0];
        const unread = msgs.filter(m => m.recipient_id === user.id && !m.read_at).length;
        const isDirect = appId.includes('__direct__');

        let otherName = '';
        let campaignTitle = '';
        let threadLink = '';

        if (isDirect) {
          otherName = directPartners[appId] || 'Usuário';
          campaignTitle = 'Conversa direta';
          const parts = appId.split('__direct__');
          const partnerId = parts[0] === user.id ? parts[1] : parts[0];
          threadLink = `?recipientId=${partnerId}&recipientName=${encodeURIComponent(otherName)}`;
        } else {
          const app = applications[appId];
          const campaign = app ? campaigns[app.campaign_id] : null;
          if (profileType === 'brand') {
            const creator = app ? creators[app.creator_id] : null;
            otherName = creator?.display_name || 'Criadora';
          } else {
            const brand = app ? brands[app.brand_id] : null;
            otherName = brand?.company_name || 'Marca';
          }
          campaignTitle = campaign?.title || 'Campanha';
          threadLink = `?applicationId=${appId}`;
        }

        return { applicationId: appId, lastMessage: lastMsg, unreadCount: unread, campaignTitle, otherName, threadLink };
      })
      .sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
  }, [messages, applications, campaigns, brands, creators, directPartners, user?.id, profileType]);

  const totalUnread = useMemo(() => threads.reduce((acc, t) => acc + t.unreadCount, 0), [threads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Mensagens</h1>
          {totalUnread > 0 && (
            <Badge className="bg-primary text-primary-foreground border-0">{totalUnread}</Badge>
          )}
        </div>
        <Button variant="outline" size="icon" className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full" onClick={() => setShowNewConvo(true)}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="py-16 text-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma conversa ainda</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {profileType === 'brand'
              ? 'Convide criadoras para suas campanhas'
              : 'Suas conversas com marcas aparecem aqui 💜'}
          </p>
          {profileType === 'brand' ? (
            <Link to={createPageUrl('DiscoverCreators')}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]">Descobrir Criadoras</Button>
            </Link>
          ) : (
            <Link to={createPageUrl('OpportunityFeed')}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]">Ver Campanhas</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {threads.map(thread => (
            <InboxThreadItem key={thread.applicationId} thread={thread} userId={user.id} />
          ))}
        </div>
      )}

      <NewConversationSheet open={showNewConvo} onClose={() => setShowNewConvo(false)} />
    </div>
  );
}