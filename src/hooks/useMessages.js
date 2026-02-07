import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);

  // 1. Carga inicial: Ahora traerá 'is_ai' automáticamente por el select('*')
  const fetchMessagesBySession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    
    const { data, error } = await supabase
      .from('intervenciones')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  }, []);

  // 2. Suscripción en Tiempo Real: El payload incluirá 'is_ai' en payload.new
  const subscribeToMessages = useCallback((sessionId) => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`realtime_session_${sessionId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'intervenciones',
          filter: `session_id=eq.${sessionId}` 
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new]);
          } 
          else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => 
              prev.map((msg) => msg.id === payload.new.id ? payload.new : msg)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Función para enviar mensajes: Agregamos is_ai: false por seguridad
  const sendMessage = async (content, alias, color, parentId, sessionId, isAi = false) => {
  if (!sessionId) return;

  const { error } = await supabase
    .from('intervenciones')
    .insert([{
      content,
      alias,
      color_theme: color,
      parent_id: parentId,
      session_id: sessionId,
      is_ai: isAi // Ahora acepta el valor que le pasemos
    }]);

  if (error) {
    console.error("❌ Fallo en la sinapsis:", error.message);
  }
};

  return { messages, sendMessage, fetchMessagesBySession, subscribeToMessages };
};