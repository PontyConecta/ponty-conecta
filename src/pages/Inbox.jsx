import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/contexts/AuthContext';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MessageCircle, Loader2 } from 'lucide-react';
import InboxThreadItem from '@/components/inbox/InboxThreadItem';

export default function Inbox() {
  const { user, profile, profileType } = useAuth();
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState({});
  const [campaigns, setCampaigns] = useState({});
  const [brands, setBrands] = useState({});
  const [creators, setCreators] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadMessages();

    const unsub = base44.entities.Message.subscribe(() => {
      loadMessages();
    });
    return () => unsub?.();
  }, [user?.id]);

  const loadMessages = async () => {
    const allMsgs = await base44.entities.Message.filter({}, '-created_date', 500);
    const myMsgs = allMsgs.filter(m => m.sender_id === user.id || m.recipient_id === user.id);
    setMessages(myMsgs);

    // Get unique application IDs
    const appIds = [...new Set(myMsgs.map(m => m.application_id))];
    
    if (appIds.length > 0) {
      const appMap = {};
      const campaignIds = new Set();
      const brandIds = new Set();
      const creatorIds = new Set();

      for (const id of appIds) {
        const app = await base44.entities.Application.filter({ id });
        if (app.length > 0) {
          appMap[id] = app[0];
          if (app[0].campaign_id) campaignIds.add(app[0].campaign_id);
          if (app[0].brand_id) brandIds.add(app[0].brand_id);
          if (app[0].creator_id) creatorIds.add(app[0].creator_id);
        }
      }
      setApplications(appMap);

      // Load campaigns
      const campMap = {};
      for (const cid of campaignIds) {
        const c = await base44.entities.Campaign.filter({ id: cid });
        if (c.length > 0) campMap[cid] = c[0];
      }
      setCampaigns(campMap);

      // Load brands
      const brandMap = {};
      for (const bid of brandIds) {
        const b = await base44.entities.Brand.filter({ id: bid });
        if (b.length > 0) brandMap[bid] = b[0];
      }
      setBrands(brandMap);

      // Load creators
      const creatorMap = {};
      for (const cid of creatorIds) {
        const c = await base44.entities.Creator.filter({ id: cid });
        if (c.length > 0) creatorMap[cid] = c[0];
      }
      setCreators(creatorMap);
    }

    setLoading(false);
  };

  // Group messages by application_id into threads
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
        const app = applications[appId];
        const campaign = app ? campaigns[app.campaign_id] : null;
        
        let otherName = '';
        if (profileType === 'brand') {
          const creator = app ? creators[app.creator_id] : null;
          otherName = creator?.display_name || 'Criador';
        } else {
          const brand = app ? brands[app.brand_id] : null;
          otherName = brand?.company_name || 'Marca';
        }

        return {
          applicationId: appId,
          lastMessage: lastMsg,
          unreadCount: unread,
          campaignTitle: campaign?.title || 'Campanha',
          otherName,
        };
      })
      .sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
  }, [messages, applications, campaigns, brands, creators, user?.id, profileType]);

  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

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
      <div className="flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Mensagens</h1>
        {totalUnread > 0 && (
          <Badge className="bg-primary text-primary-foreground border-0">
            {totalUnread}
          </Badge>
        )}
      </div>

      {/* Thread list */}
      {threads.length === 0 ? (
        <Card className="p-8 text-center bg-card border">
          <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma conversa ainda</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            As conversas aparecem quando você se candidata ou recebe candidaturas em campanhas.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map(thread => (
            <InboxThreadItem key={thread.applicationId} thread={thread} userId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}