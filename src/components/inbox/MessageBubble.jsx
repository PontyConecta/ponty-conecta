import React from 'react';
import moment from 'moment';

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
        isOwn 
          ? 'bg-primary text-primary-foreground rounded-br-md' 
          : 'bg-muted text-foreground rounded-bl-md'
      }`}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          {moment(message.created_date).format('HH:mm')}
        </p>
      </div>
    </div>
  );
}