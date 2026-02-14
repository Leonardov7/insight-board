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

  // 2. Suscripción en Tiempo Real: Maneja INSERT, UPDATE y DELETE
  const subscribeToMessages = useCallback((sessionId) => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`realtime_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha todos los eventos
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
          else if (payload.eventType === 'DELETE') {
            // Se usa payload.old.id porque en DELETE el objeto 'new' viene vacío
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

  // 3. Envío de mensajes: Mantiene todos los parámetros originales
  const sendMessage = useCallback(async (content, alias, color, parentId, sessionId, isAi = false) => {
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
  }, []);

  // 4. Actualización/Edición: Crucial para corregir o hacer borrado lógico sin romper el árbol
  const updateMessage = useCallback(async (messageId, newContent) => {
    const { data, error } = await supabase
      .from('intervenciones')
      .update({ content: newContent })
      .eq('id', messageId)
      .select(); // Esto es vital para ver si se hizo el cambio

    if (error) throw error;

    // Si data está vacío, es que el RLS bloqueó el cambio
    if (data.length === 0) {
      console.error("⚠️ [ERROR DE PERMISOS] El servidor recibió la orden pero no cambió nada. Revisa las políticas RLS.");
      alert("Error de seguridad: No tienes permisos para modificar esta neurona.");
      return false;
    }
    return true;
  }, []);

  // 5. Borrado físico: Elimina el registro por completo
  const deleteMessage = useCallback(async (messageId) => {
    const { error, status } = await supabase
      .from('intervenciones')
      .delete()
      .eq('id', messageId);

    if (error) throw error;

    // En delete, verificamos el código de estado. Si es 204 y no hubo error, fue bien.
    // Pero si el mensaje sigue ahí, es RLS.
    console.log("🛰️ Respuesta del servidor al borrar:", status);
  }, []);

  return {
    messages,
    sendMessage,
    fetchMessagesBySession,
    subscribeToMessages,
    updateMessage,
    deleteMessage
  };
};