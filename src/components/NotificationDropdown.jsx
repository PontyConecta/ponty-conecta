import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, MessageSquare, Megaphone, Clock } from 'lucide-react';
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
  }, [user, profile]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notificationsList = [];

      if (profileType === 'brand') {
        const [applications, deliveries, campaigns] = await Promise.all([
          base44.entities.Application.filter({ brand_id: profile.id, status: 'pending' }),
          base44.entities.Delivery.filter({ brand_id: profile.id, status: 'submitted' }),
          base44.entities.Campaign.filter({ brand_id: profile.id })
        ]);

        applications.slice(0, 5).forEach(app => {
          notificationsList.push({
            id: `app-${app.id}`, type: 'application', title: 'Nova Candidatura',
            message: `Um criador se candidatou para sua campanha`, icon: MessageSquare,
            color: 'text-blue-600', timestamp: app.created_date, read: false,
            actionUrl: createPageUrl('Applications'), relatedEntityId: app.id
          });
        });

        deliveries.slice(0, 5).forEach(del => {
          notificationsList.push({
            id: `delivery-${del.id}`, type: 'delivery', title: 'Entrega Pendente',
            message: `Criador enviou conteúdo para revisão`, icon: CheckCircle2,
            color: 'text-green-600', timestamp: del.submitted_at, read: false,
            actionUrl: createPageUrl('Deliveries'), relatedEntityId: del.id
          });
        });

        campaigns.forEach(camp => {
          if (camp.deadline && new Date(camp.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
            const daysLeft = Math.ceil((new Date(camp.deadline) - new Date()) / (24 * 60 * 60 * 1000));
            if (daysLeft > 0) {
              notificationsList.push({
                id: `campaign-${camp.id}`, type: 'campaign', title: 'Campanha Próxima do Prazo',
                message: `${camp.title} vence em ${daysLeft} dias`, icon: Clock,
                color: 'text-orange-600', timestamp: camp.created_date, read: false,
                actionUrl: createPageUrl('CampaignManager'), relatedEntityId: camp.id
              });
            }
          }
        });

      } else if (profileType === 'creator') {
        const [applications, deliveries, campaigns] = await Promise.all([
          base44.entities.Application.filter({ creator_id: profile.id }),
          base44.entities.Delivery.filter({ creator_id: profile.id }),
          base44.entities.Campaign.filter({ status: 'active' })
        ]);

        const campaignIds = campaigns.slice(0, 3).map(c => c.brand_id);
        const brands = campaignIds.length > 0 ? await base44.entities.Brand.list() : [];
        const brandMap = {};
        brands.forEach(b => { brandMap[b.id] = b; });

        campaigns.slice(0, 3).forEach(opp => {
          const brand = brandMap[opp.brand_id];
          notificationsList.push({
            id: `opp-${opp.id}`, type: 'opportunity', title: 'Nova Oportunidade',
            message: `${brand?.company_name || 'Uma marca'} lançou uma nova campanha`, icon: Megaphone,
            color: 'text-purple-600', timestamp: opp.created_date, read: false,
            actionUrl: createPageUrl('OpportunityFeed'), relatedEntityId: opp.id
          });
        });

        applications.filter(app => app.status === 'accepted').slice(0, 3).forEach(app => {
          notificationsList.push({
            id: `app-accepted-${app.id}`, type: 'application_accepted', title: 'Candidatura Aceita! 🎉',
            message: `Sua candidatura foi aceita para uma campanha`, icon: CheckCircle2,
            color: 'text-green-600', timestamp: app.accepted_at || app.created_date, read: false,
            actionUrl: createPageUrl('Applications'), relatedEntityId: app.id
          });
        });

        deliveries.filter(del => del.status === 'approved').slice(0, 3).forEach(del => {
          notificationsList.push({
            id: `delivery-approved-${del.id}`, type: 'delivery_approved', title: 'Entrega Aprovada',
            message: `Sua entrega foi aprovada pela marca`, icon: CheckCircle2,
            color: 'text-green-600', timestamp: del.approved_at || del.created_date, read: false,
            actionUrl: createPageUrl('Deliveries'), relatedEntityId: del.id
          });
        });

        deliveries.filter(del => del.status === 'contested').slice(0, 3).forEach(del => {
          notificationsList.push({
            id: `delivery-contested-${del.id}`, type: 'delivery_contested', title: 'Entrega Contestada',
            message: `A marca contestou sua entrega. Revise os comentários.`, icon: AlertCircle,
            color: 'text-red-600', timestamp: del.contested_at || del.created_date, read: false,
            actionUrl: createPageUrl('Deliveries'), relatedEntityId: del.id
          });
        });
      }

      const existingNotifications = await base44.entities.Notification.filter({ user_id: user.id });
      const readMap = {};
      const dismissedSet = new Set();
      existingNotifications.forEach(n => {
        if (n.read_at) readMap[n.notification_key] = true;
        if (n.dismissed_at) dismissedSet.add(n.notification_key);
      });

      const filteredNotifications = notificationsList
        .filter(n => !dismissedSet.has(n.id))
        .map(n => ({ ...n, read: readMap[n.id] || false }));
      filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setNotifications(filteredNotifications);
      setUnreadCount(filteredNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast?.error?.('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const existing = await base44.entities.Notification.filter({ user_id: user.id, notification_key: notificationId });
      if (existing.length > 0) {
        await base44.entities.Notification.update(existing[0].id, { read_at: new Date().toISOString() });
      } else {
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
          await base44.entities.Notification.create({
            user_id: user.id, notification_key: notificationId, type: notification.type,
            title: notification.title, message: notification.message,
            action_url: notification.actionUrl, related_entity_id: notification.relatedEntityId,
            read_at: new Date().toISOString()
          });
        }
      }
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = notifications.filter(n => !n.read).map(async (notification) => {
        const existing = await base44.entities.Notification.filter({ user_id: user.id, notification_key: notification.id });
        if (existing.length > 0) {
          return base44.entities.Notification.update(existing[0].id, { read_at: new Date().toISOString() });
        } else {
          return base44.entities.Notification.create({
            user_id: user.id, notification_key: notification.id, type: notification.type,
            title: notification.title, message: notification.message,
            action_url: notification.actionUrl, related_entity_id: notification.relatedEntityId,
            read_at: new Date().toISOString()
          });
        }
      });
      await Promise.all(promises);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      const existing = await base44.entities.Notification.filter({ user_id: user.id, notification_key: notificationId });
      if (existing.length > 0) {
        await base44.entities.Notification.update(existing[0].id, { dismissed_at: new Date().toISOString() });
      } else {
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
          await base44.entities.Notification.create({
            user_id: user.id, notification_key: notificationId, type: notification.type,
            title: notification.title, message: notification.message,
            action_url: notification.actionUrl, related_entity_id: notification.relatedEntityId,
            dismissed_at: new Date().toISOString()
          });
        }
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#9038fa] rounded-full ring-2 ring-card"></span>
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