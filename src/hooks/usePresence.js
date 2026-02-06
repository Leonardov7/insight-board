import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const usePresence = (sessionId, user) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!sessionId || !user) return;

    const channel = supabase.channel(`presence:${sessionId}`, {
      config: { presence: { key: user.name } }
    });

    channel
  .on('presence', { event: 'sync' }, () => {
    const newState = channel.presenceState();
    // Transformamos el objeto complejo en una lista simple de usuarios
    const users = Object.values(newState).flat();
    setOnlineUsers(users);
  })
  .on('presence', { event: 'join' }, ({ newPresences }) => {
    console.log('Alguien entró:', newPresences);
  })
  .on('presence', { event: 'leave' }, ({ leftPresences }) => {
    console.log('Alguien se fue:', leftPresences);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user.id,
        name: user.name,
        color: user.color,
        online_at: new Date().toISOString(),
      });
    }
  });

    return () => { channel.unsubscribe(); };
  }, [sessionId, user]);

  return onlineUsers;
};