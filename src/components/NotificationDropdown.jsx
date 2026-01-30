import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Sparkles, Info } from 'lucide-react';

export default function NotificationDropdown() {
  const [notifications] = useState([
    {
      id: 1,
      type: 'welcome',
      title: 'Bem-vindo ao Ponty Conecta!',
      description: 'Complete seu perfil para começar',
      icon: Sparkles,
      color: 'text-indigo-600',
      unread: true
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-slate-100 transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className="px-4 py-3 cursor-pointer focus:bg-slate-50"
              >
                <div className="flex gap-3 w-full">
                  <div className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0`}>
                    <notification.icon className={`w-5 h-5 ${notification.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {notification.description}
                    </p>
                  </div>
                  {notification.unread && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhuma notificação</p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="px-4 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs text-slate-600 hover:text-slate-900">
            Marcar todas como lidas
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}