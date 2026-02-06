// src/hooks/useSessions.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSessions = () => {
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('sesiones')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setSessions(data);
  };

  const deleteSession = async (id) => {
    // Esto borrará la sesión. Si configuraste "Cascade" en la DB, 
    // también borrará todas sus intervenciones automáticamente.
    const { error } = await supabase.from('sesiones').delete().eq('id', id);
    if (!error) fetchSessions(); // Refrescamos la lista
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return { sessions, fetchSessions, deleteSession };
};