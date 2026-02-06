import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);

  // 1. Carga inicial: Descarga el historial al entrar o refrescar
  const fetchMessagesBySession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    
    const { data, error } = await supabase
      .from('intervenciones')
      .select('*')
      .eq('session_id', sessionId) // <-- UNIFICADO A session_id
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  }, []);

  // 2. Suscripción en Tiempo Real: El corazón de la Red Neuronal
  const subscribeToMessages = useCallback((sessionId) => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`realtime_session_${sessionId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', // Escucha INSERT (nuevos) y UPDATE (movimientos del admin)
          schema: 'public', 
          table: 'intervenciones',
          filter: `session_id=eq.${sessionId}` // <-- UNIFICADO A session_id
        },
        (payload) => {
          console.log("Sinapsis detectada:", payload);

          if (payload.eventType === 'INSERT') {
            // Se añade la nueva idea al mapa al instante
            setMessages((prev) => [...prev, payload.new]);
          } 
          else if (payload.eventType === 'UPDATE') {
            // Se actualiza la posición o el contenido si el admin lo cambia
            setMessages((prev) => 
              prev.map((msg) => msg.id === payload.new.id ? payload.new : msg)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Conexión con Sesión ${sessionId}:`, status);
      });

    // Limpieza al desmontar para evitar duplicidad de conexiones
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Función para enviar mensajes: Crea la conexión en la DB
  const sendMessage = async (content, alias, color, parentId, sessionId) => {
    if (!sessionId) return;

    const { error } = await supabase.from('intervenciones').insert([{
      content,
      alias,
      color_theme: color,
      parent_id: parentId,
      session_id: sessionId // <-- CORREGIDO: de 'sesion_id' a 'session_id'
    }]);

    if (error) {
      console.error("❌ Fallo en la sinapsis:", error.message);
    }
  };

  return { messages, sendMessage, fetchMessagesBySession, subscribeToMessages };
};