import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);

  // 1. Carga inicial: Mantiene el select('*') para no perder campos como 'is_ai' o 'color_theme'
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

  // 2. Suscripción en Tiempo Real: AHORA ESCUCHA EL BORRADO
  const subscribeToMessages = useCallback((sessionId) => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`realtime_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha INSERT, UPDATE y DELETE
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
          // --- NUEVA LÓGICA DE BORRADO EN TIEMPO REAL ---
          else if (payload.eventType === 'DELETE') {
            setMessages((prev) => 
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Envío de mensajes: Mantiene todos los parámetros originales, incluyendo isAi
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
        is_ai: isAi
      }]);

    if (error) {
      console.error("❌ Fallo en la sinapsis:", error.message);
    }
  };

  const deleteMessage = async (messageId) => {
    const { error } = await supabase
      .from('intervenciones')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  };

  return { messages, sendMessage, fetchMessagesBySession, subscribeToMessages, deleteMessage };
};