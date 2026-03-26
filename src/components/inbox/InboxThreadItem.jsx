import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function relativeTime(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) {
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    return days[d.getDay()];
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function InboxThreadItem({ thread, userId }) {
  const { applicationId, lastMessage, unreadCount, campaignTitle, otherName, threadLink } = thread;
  const isMyMessage = lastMessage.sender_id === userId;
  const isDirect = applicationId?.includes('__direct__');
  const isInvite = lastMessage.content?.startsWith('🎯');
  const hasUnread = unreadCount > 0;

  const preview = isInvite
    ? '🎯 Convite recebido'
    : (lastMessage.content?.length > 70 ? lastMessage.content.substring(0, 70) + '...' : lastMessage.content);

  return (
    <Link
      to={createPageUrl('InboxThread') + (threadLink || ('?applicationId=' + applicationId))}
      state={{ from: 'Inbox', fromLabel: 'Mensagens' }}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl min-h-[72px] transition-colors cursor-pointer hover:bg-muted/50 ${hasUnread ? 'bg-primary/5' : ''}`}>
        {/* Avatar with unread dot */}
        <div className="relative flex-shrink-0">
          <Avatar className="w-12 h-12">
            <AvatarImage src={thread.avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {otherName?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm truncate ${hasUnread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
              {otherName}
            </p>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 flex-shrink-0 ${isDirect ? 'text-muted-foreground' : 'text-primary border-primary/30'}`}>
              {isDirect ? 'Direto' : 'Campanha'}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground truncate mb-0.5">{campaignTitle}</p>
          <p className={`text-xs truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground italic'}`}>
            {isMyMessage && !isInvite ? 'Você: ' : ''}{preview}
          </p>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground">
            {relativeTime(lastMessage.created_date)}
          </span>
          {hasUnread && (
            <Badge className="bg-primary text-primary-foreground border-0 text-[10px] h-5 min-w-[20px] flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}