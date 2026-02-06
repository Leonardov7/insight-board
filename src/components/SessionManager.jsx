import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FolderOpen, Trash2, Calendar, Play, X } from 'lucide-react';

const SessionManager = ({ onSelectSession, onClose }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { data } = await supabase.from('sesiones').select('*').order('created_at', { ascending: false });
    setSessions(data || []);
  };

  const deleteSession = async (id) => {
    if (confirm("¿Seguro que deseas eliminar esta sesión y todos sus comentarios?")) {
      await supabase.from('sesiones').delete().eq('id', id);
      fetchSessions();
    }
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-96 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-indigo-500/10">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
          <FolderOpen size={14} /> Sesiones Guardadas
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16}/></button>
      </div>
      <div className="p-2 space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
        {sessions.map(s => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white uppercase truncate max-w-[180px]">{s.tema}</span>
              <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                <Calendar size={10} /> {new Date(s.created_at).toLocaleDateString()}
                <span className="text-indigo-500 font-bold">[{s.codigo}]</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onSelectSession(s)} className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg" title="Abrir">
                <Play size={14} />
              </button>
              <button onClick={() => deleteSession(s.id)} className="p-2 text-rose-500 hover:bg-rose-500/20 rounded-lg" title="Eliminar">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionManager;