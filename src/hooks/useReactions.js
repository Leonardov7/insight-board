import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useReactions = (intervencionId, userAlias) => {
  const [counts, setCounts] = useState({ aporte: 0, duda: 0, interesante: 0 });
  const [userReactions, setUserReactions] = useState([]);

  const fetchReactions = useCallback(async () => {
    if (!intervencionId) return;
    const { data, error } = await supabase
      .from('reacciones')
      .select('tipo_reaccion, usuario_alias')
      .eq('intervencion_id', intervencionId);
    
    if (!error && data) {
      const newCounts = data.reduce((acc, curr) => {
        acc[curr.tipo_reaccion] = (acc[curr.tipo_reaccion] || 0) + 1;
        return acc;
      }, { aporte: 0, duda: 0, interesante: 0 });
      
      setCounts(newCounts);
      setUserReactions(data.filter(r => r.usuario_alias === userAlias).map(r => r.tipo_reaccion));
    }
  }, [intervencionId, userAlias]);

  useEffect(() => {
    fetchReactions();
    const channel = supabase.channel(`rx_global_${intervencionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reacciones' }, (payload) => {
        const mid = payload.new?.intervencion_id || payload.old?.intervencion_id;
        if (mid === intervencionId) fetchReactions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [intervencionId, fetchReactions]);

  const toggleReaction = async (tipo) => {
    if (!userAlias || !intervencionId) return;
    const isRemoving = userReactions.includes(tipo);

    // Actualización optimista
    setUserReactions(prev => isRemoving ? prev.filter(r => r !== tipo) : [...prev, tipo]);
    setCounts(prev => ({
      ...prev,
      [tipo]: isRemoving ? Math.max(0, prev[tipo] - 1) : prev[tipo] + 1
    }));

    if (isRemoving) {
      await supabase.from('reacciones').delete().match({ 
        intervencion_id: intervencionId, 
        usuario_alias: userAlias, 
        tipo_reaccion: tipo 
      });
    } else {
      await supabase.from('reacciones').insert([{ 
        intervencion_id: intervencionId, 
        usuario_alias: userAlias, 
        tipo_reaccion: tipo 
      }]);
    }
  };

  return { counts, userReactions, toggleReaction };
};