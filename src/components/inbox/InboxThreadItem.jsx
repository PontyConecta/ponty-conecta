import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import moment from 'moment';

export default function InboxThreadItem({ thread, userId }) {
  const { applicationId, lastMessage, unreadCount, campaignTitle, otherName } = thread;
  const isMyMessage = lastMessage.sender_id === userId;
  const preview = lastMessage.content?.length > 80 
    ? lastMessage.content.substring(0, 80) + '...' 
    : lastMessage.content;

  return (
    <Link to={createPageUrl('InboxThread') + '?applicationId=' + applicationId}>
      <Card className={`px-4 py-3 bg-card border hover:shadow-md transition-shadow cursor-pointer ${unreadCount > 0 ? 'border-primary/30' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-foreground truncate">{otherName}</p>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground border-0 text-[10px] h-5 min-w-[20px] flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mb-1">{campaignTitle}</p>
            <p className={`text-xs truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {isMyMessage ? 'Você: ' : ''}{preview}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
            {moment(lastMessage.created_date).fromNow()}
          </span>
        </div>
      </Card>
    </Link>
  );
}