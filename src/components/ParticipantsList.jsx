import React from 'react';
import { Users, Activity, Eye } from 'lucide-react'; // Añadimos Eye

const ParticipantsList = ({ participants = [] }) => {
  return (
    <div className="h-full flex flex-col p-6 font-sans">
      {/* HEADER EXISTENTE */}
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <Activity size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">En Vivo</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
          <Users size={12} className="text-indigo-400" />
          <span className="text-xs font-mono font-black text-white">{participants.length}</span>
        </div>
      </div>



      {/* LISTA DE ESTUDIANTES (Tu lógica original intacta) */}
      <h3 className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-3">
        Mentes Conectadas
      </h3>
      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
        {participants.map((p) => (
          <div key={p.presence_ref || p.id || p.name} className="flex items-center gap-3 group animate-in fade-in slide-in-from-right-2">
            <div
              className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentcolor]"
              style={{ backgroundColor: p.color, color: p.color }}
            />
            <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight truncate max-w-[150px]">
              {p.name}
            </span>
          </div>
        ))}

        {participants.length === 0 && (
          <p className="text-[10px] text-slate-600 italic text-center py-4">Esperando conexiones...</p>
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;