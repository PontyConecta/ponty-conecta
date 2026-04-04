import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, MessageSquare, Megaphone, Clock, MessageSquarePlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function NotificationDropdown({ triggerClassName }) {
  const { user, profile, profileType } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && profile) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id, profile?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notificationsList = [];

      // Fetch persisted notification state first (read/dismissed)
      const existingNotifications = await base44.entities.Notification.filter({ user_id: user.id });
      const readMap = {};
      const dismissedSet = new Set();
      existingNotifications.forEach(n => {
        if (n.read_at) readMap[n.notification_key] = true;
        if (n.dismissed_at) dismissedSet.add(n.notification_key);
      });

      if (profileType === 'brand') {
        const [applications, deliveries, campaigns] = await Promise.all([
          base44.entities.Application.filter({ brand_id: profile.id, status: 'pending' }),
          base44.entities.Delivery.filter({ brand_id: profile.id, status: 'submitted' }),
          base44.entities.Campaign.filter({ brand_id: profile.id })
        ]);

        applications.slice(0, 5).forEach(app => {
          const key = `app-${app.id}`;
          if (!dismissedSet.has(key)) {
            notificationsList.push({
              id: key, type: 'application', title: 'Nova Candidatura',
              message: 'Um criador se candidatou para sua campanha', icon: MessageSquare,
              color: 'text-blue-600', timestamp: app.created_date, read: !!readMap[key],
              actionUrl: createPageUrl('Applications') + '?applicationId=' + app.id, relatedEntityId: app.id
            });
          }
        });

        deliveries.slice(0, 5).forEach(del => {
          const key = `delivery-${del.id}`;
          if (!dismissedSet.has(key)) {
            notificationsList.push({
              id: key, type: 'delivery', title: 'Entrega Pendente',
              message: 'Criador enviou conteúdo para revisão', icon: CheckCircle2,
              color: 'text-green-600', timestamp: del.submitted_at || del.created_date, read: !!readMap[key],
              actionUrl: createPageUrl('Deliveries') + '?deliveryId=' + del.id, relatedEntityId: del.id
            });
          }
        });

        campaigns.forEach(camp => {
          if (camp.deadline && new Date(camp.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
            const daysLeft = Math.ceil((new Date(camp.deadline) - new Date()) / (24 * 60 * 60 * 1000));
            if (daysLeft > 0) {
              const key = `campaign-${camp.id}`;
              if (!dismissedSet.has(key)) {
                notificationsList.push({
                  id: key, type: 'campaign', title: 'Campanha Próxima do Prazo',
                  message: `${camp.title} vence em ${daysLeft} dias`, icon: Clock,
                  color: 'text-orange-600', timestamp: camp.created_date, read: !!readMap[key],
                  actionUrl: createPageUrl('CampaignManager'), relatedEntityId: camp.id
                });
              }
            }
          }
        });

      } else if (profileType === 'creator') {
        const [applications, deliveries] = await Promise.all([
          base44.entities.Application.filter({ creator_id: profile.id }),
          base44.entities.Delivery.filter({ creator_id: profile.id }),
        ]);

        // Recent opportunities — only show campaigns created in last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const recentCampaigns = await base44.entities.Campaign.filter({ status: 'active' }, '-created_date', 5);
        const recentOpps = recentCampaigns.filter(c => c.created_date >= sevenDaysAgo);

        recentOpps.forEach(opp => {
          const key = `opp-${opp.id}`;
          if (!dismissedSet.has(key)) {
            notificationsList.push({
              id: key, type: 'opportunity', title: 'Nova Oportunidade',
              message: 'Uma marca lançou uma nova campanha', icon: Megaphone,
              color: 'text-primary', timestamp: opp.created_date, read: !!readMap[key],
              actionUrl: createPageUrl('OpportunityFeed'), relatedEntityId: opp.id
            });
          }
        });

        applications.filter(app => app.status === 'accepted').slice(0, 5).forEach(app => {
          const key = `app-accepted-${app.id}`;
          if (!dismissedSet.has(key)) {
            notificationsList.push({
              id: key, type: 'application_accepted', title: 'Candidatura Aceita! 🎉',
              message: 'Sua candidatura foi aceita para uma campanha', icon: CheckCircle2,
              color: 'text-green-600', timestamp: app.accepted_at || app.created_date, read: !!readMap[key],
              actionUrl: createPageUrl('MyApplications') + '?applicationId=' + app.id, relatedEntityId: app.id
            });
          }
        });

        applications.filter(app => app.status === 'rejected').slice(0, 3).forEach(app => {
          const key = `app-rejected-${app.id}`;
          if (!dismissedSet.has(key)) {
            notificationsList.push({
              id: key, type: 'application_rejected', title: 'Candidatura Recusada',
              message: app.rejection_reason || 'Sua candidatura não foi aceita desta vez.', icon: AlertCircle,
              color: 'text-red-600', timestamp: app.rejected_at || app.created_date, read: !!readMap[key],
              actionUrl: createPageUrl('MyApplications'), relatedEntityId: app.id
            });
          }
        });

        deliveries.filter(del => del.status === 'approved').slice(0, 5).forEach(del => {
          const key = `delivery-approved-${del.id}`;
          if (!dismissedSet.has(key)) {
            notificationsList.push({
              id: key, type: 'delivery_approved', title: 'Entrega Aprovada',
              message: 'Sua entrega foi aprovada pela marca', icon: CheckCircle2,
              color: 'text-green-600', timestamp: del.approved_at || del.created_date, read: !!readMap[key],
              actionUrl: createPageUrl('MyDeliveries'), relatedEntityId: del.id
            });
          }
        });

        deliveries.filter(del => del.status === 'contested').slice(0, 3).forEach(del => {
          const key = `delivery-contested-${del.id}`;
          if (!dismissedSet.has(key)) {
            notificationsList.push({
              id: key, type: 'delivery_contested', title: 'Entrega Contestada',
              message: 'A marca contestou sua entrega. Revise os comentários.', icon: AlertCircle,
              color: 'text-red-600', timestamp: del.contested_at || del.created_date, read: !!readMap[key],
              actionUrl: createPageUrl('MyDeliveries'), relatedEntityId: del.id
            });
          }
        });
      }

      // ── Feedback experience survey notification (all profile types) ──
      if (user.feedback_status === 'invited' || user.feedback_status === 'eligible') {
        const fbKey = `feedback-invite-${user.id}`;
        if (!dismissedSet.has(fbKey)) {
          notificationsList.push({
            id: fbKey,
            type: 'feedback',
            title: 'Sua opinião é importante',
            message: 'Estamos melhorando continuamente a experiência da plataforma. Leva menos de 2 minutos para compartilhar sua percepção.',
            icon: MessageSquarePlus,
            color: 'text-foreground',
            timestamp: user.feedback_invited_at || user.created_date,
            read: false,
            actionUrl: createPageUrl('Feedback'),
            relatedEntityId: user.id,
          });
        }
      }

      notificationsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      await base44.functions.invoke('manageNotification', {
        action: 'mark_read',
        notification_key: notificationId,
        notification_data: notification ? {
          type: notification.type, title: notification.title,
          message: notification.message, action_url: notification.actionUrl,
          related_entity_id: notification.relatedEntityId,
        } : null,
      });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await base44.functions.invoke('manageNotification', {
        action: 'mark_all_read',
        notification_keys: unread.map(n => n.id),
        notification_data: unread.map(n => ({
          type: n.type, title: n.title, message: n.message,
          action_url: n.actionUrl, related_entity_id: n.relatedEntityId,
        })),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      await base44.functions.invoke('manageNotification', {
        action: 'dismiss',
        notification_key: notificationId,
        notification_data: notification ? {
          type: notification.type, title: notification.title,
          message: notification.message, action_url: notification.actionUrl,
          related_entity_id: notification.relatedEntityId,
        } : null,
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card"></span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-primary">
                Marcar tudo como lido
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação no momento</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <Link
                  key={notification.id}
                  to={notification.actionUrl}
                  className={`block p-4 hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 ${notification.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 w-2 h-2 rounded-full inline-block bg-primary"></span>
                            )}
                          </p>
                          <p className="text-sm mt-1 text-muted-foreground">{notification.message}</p>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissNotification(notification.id); }}
                          className="text-muted-foreground hover:text-foreground transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs mt-2 text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}