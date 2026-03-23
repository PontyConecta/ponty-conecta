import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useUnreadCount(userId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const msgs = await base44.entities.Message.filter({ recipient_id: userId, read_at: null }, '-created_date', 200);
      setCount(msgs.length);
    };

    load();

    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        load();
      }
    });

    return () => unsub?.();
  }, [userId]);

  return count;
}