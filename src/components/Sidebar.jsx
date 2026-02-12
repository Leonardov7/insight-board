import React, { useState, useEffect } from 'react';
import {
  X, History, Trash2, ExternalLink, RefreshCw,
  Database, ChevronDown, ChevronRight, MessageSquare, BarChart3,
  Zap, Loader2, Activity 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateTargetedProvocations } from '../services/aiService';

const STUDENT_COLOR_PALETTE = [
  "#34d399", // Esmeralda
  "#38bdf8", // Azul Cielo
  "#fb7185", // Rosa Suave
  "#fbbf24", // Ámbar
  "#a78bfa", // Violeta
  "#22d3ee", // Cian
  "#f472b6", // Fucsia
];

const Sidebar = ({ 
  isOpen, onClose, isAdmin, currentSessionId, 
  onSwitchSession, onNewDebate, 
  messages, sendMessage,
  setIsAnalyticsOpen 
}) => {
  
  const [sessions, setSessions] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Recupera todas las sesiones del docente desde Supabase
  const fetchSessions = async () => {
  setLoading(true);

  // 1. Obtenemos el usuario autenticado de Supabase
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 2. Filtramos la consulta usando el ID del usuario
    const { data, error } = await supabase
      .from('sesiones')
      .select(`*, intervenciones (id)`)
      .eq('owner_id', user.id) // <--- ESTE ES EL FILTRO DE PRIVACIDAD
      .order('created_at', { ascending: false });

    if (!error) {
      setSessions(data || []);
    }
  }
  
  setLoading(false);
};

  // Alterna el estado de la sinapsis entre activo e inactivo
  const handleToggleStatus = async (e, sessionId, currentStatus) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const { error } = await supabase
      .from('sesiones')
      .update({ status: newStatus })
      .eq('id', sessionId);

    if (!error) {
      fetchSessions(); 
    } else {
      console.error("Error al cambiar estado:", error.message);
    }
  };

  // Elimina una sesión permanentemente tras confirmación
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("¿Eliminar sesión permanentemente?")) return;

    const { error } = await supabase
      .from('sesiones')
      .delete()
      .eq('id', sessionId);

    if (error) {
      alert("No se pudo borrar: " + error.message);
    } else {
      if (sessionId === currentSessionId) {
        onNewDebate();
      } else {
        fetchSessions();
      }
    }
  };

  // Invoca al agente de IA para generar dudas socráticas en el debate
  const handleInvokeAI = async () => {
    if (!currentSessionId || isAiThinking) return;

    setIsAiThinking(true);
    try {
      const targets = await generateTargetedProvocations(messages);

      if (targets && targets.length > 0) {
        for (const item of targets) {
          const randomColor = STUDENT_COLOR_PALETTE[Math.floor(Math.random() * STUDENT_COLOR_PALETTE.length)];

          await sendMessage(
            item.provocation,
            item.alias,
            randomColor,
            item.targetId,
            currentSessionId,
            true
          );
        }
      }
    } catch (error) {
      console.error("Fallo en la invocación de IA:", error);
    } finally {
      setIsAiThinking(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchSessions();
  }, [isAdmin]);

  return (
    <div 
      className={`fixed top-[70px] bottom-0 right-0 w-80 bg-[#0e0e12]/95 backdrop-blur-2xl border-l border-white/10 z-50 shadow-2xl flex flex-col transition-transform duration-500 ease-in-out font-sans
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* BOTÓN INTERNO PARA OCULTAR */}
      <button
        onClick={onClose}
        className="absolute left-[-30px] top-1/2 -translate-y-1/2 bg-[#0e0e12]/95 p-1.5 rounded-l-xl border-l border-y border-white/10 text-slate-500 hover:text-white transition-all shadow-[-5px_0_15px_rgba(0,0,0,0.5)]"
      >
        <ChevronRight size={18} />
      </button>

      {/* HEADER */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
            <Database size={14} /> Panel de Control
          </h2>
          <span className="text-[7px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
            Design Interactive Hub v1.2.0 <br />Desarrollado por Ing. Leonardo Valderrama
          </span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

        {/* SECCIÓN: HISTORIAL DE SESIONES */}
        {isAdmin && (
          <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-all"
            >
              <div className="flex items-center gap-3">
                <History size={14} className={isHistoryOpen ? "text-indigo-400" : "text-slate-500"} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Historial de Sesiones
                </span>
              </div>
              {isHistoryOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
            </button>

            {isHistoryOpen && (
              <div className="px-2 pb-4 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
                  {sessions.length === 0 ? (
                    <p className="text-[9px] text-slate-600 text-center py-4 uppercase font-bold italic">No hay registros previos</p>
                  ) : (
                    sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => onSwitchSession(s)}
                        className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${s.id === currentSessionId
                            ? 'bg-indigo-500/10 border-indigo-500/40'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                          }`}
                      >
                        <div className="flex flex-col gap-1 pr-14">
                          <span className="text-[10px] font-bold text-slate-200 truncate uppercase">{s.tema || 'Sin tema'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono text-indigo-400 font-bold">{s.codigo}</span>
                            <span className={`text-[7px] px-1.5 rounded-full border ${s.status === 'active' ? 'border-emerald-500/30 text-emerald-500' : 'border-slate-500/30 text-slate-500'} uppercase font-black`}>
                              {s.status}
                            </span>
                          </div>
                        </div>

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleToggleStatus(e, s.id, s.status)}
                            className={`p-1.5 border rounded-lg transition-all ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/10'}`}
                            title={s.status === 'active' ? 'Inactivar Sinapsis' : 'Activar Sinapsis'}
                          >
                            <Activity size={10} className={s.status === 'active' ? 'animate-pulse' : ''} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onSwitchSession(s); }} className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500 transition-all"><ExternalLink size={10} /></button>
                          <button onClick={(e) => handleDeleteSession(e, s.id)} className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 transition-all"><Trash2 size={10} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* IA ESTRATÉGICA */}
        {isAdmin && currentSessionId && (
          <section className="p-5 border border-indigo-500/20 rounded-2xl bg-indigo-500/5 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] flex items-center gap-2">
              <Zap size={14} fill="currentColor" /> Comentario
            </h3>

            <button
              onClick={handleInvokeAI}
              disabled={isAiThinking}
              className={`w-full py-4 rounded-xl border transition-all flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest ${isAiThinking ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 cursor-wait' : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-100 hover:bg-indigo-600 hover:text-white shadow-[0_0_20px_rgba(99,102,241,0.15)]'}`}
            >
              {isAiThinking ? <><Loader2 size={14} className="animate-spin" /> Analizando...</> : <>Lanzar Comentario</>}
            </button>
          </section>
        )}

        {/* ANALÍTICA */}
        {isAdmin && currentSessionId && (
          <section className="mt-4 p-4 border border-white/5 rounded-2xl bg-white/[0.01]">
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all flex flex-col items-center gap-2 group"
            >
              <BarChart3 size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Abrir Monitor Semántico
              </span>
            </button>
          </section>
        )}
      </div>

      {/* FOOTER */}
      {isAdmin && (
        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          <button
            onClick={onNewDebate}
            className="w-full py-4 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-indigo-500/20 transition-all"
          >
            <RefreshCw size={14} /> Iniciar Nuevo Debate
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;