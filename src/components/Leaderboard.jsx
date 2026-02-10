import React, { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, Info, Star } from 'lucide-react';

const Leaderboard = ({ ranking }) => {
  const [expandedIdx, setExpandedIdx] = useState(null);

  // Si no hay nadie que haya superado el umbral de rigor, el cuadro no se muestra
  if (!ranking || ranking.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-white/5 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* TÍTULO DE SECCIÓN */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <Trophy className="text-amber-400" size={14} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Cuadro de Honor</h3>
          <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">Excelencia Académica</span>
        </div>
      </div>
      
      {/* LISTA DE MERITOCRACIA */}
      <div className="space-y-3">
        {ranking.map((player, idx) => {
          const isExpanded = expandedIdx === idx;
          const medals = ["🥇", "🥈", "🥉"];

          return (
            <div 
              key={idx} 
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              className={`group cursor-pointer overflow-hidden transition-all duration-500 border rounded-[1.5rem] 
                ${isExpanded 
                  ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.05)]' 
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
            >
              {/* CABECERA: ALIAS Y BADGE */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                    {medals[idx]}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate w-28">
                      {player.alias}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star size={8} className="text-indigo-400 fill-indigo-400" />
                      <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">
                        {player.badge}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown size={14} className="text-slate-600 group-hover:text-slate-400" />
                </div>
              </div>

              {/* PANEL DE ARGUMENTACIÓN (ACORDEÓN) */}
              {isExpanded && (
                <div className="px-4 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  {/* DEFINICIÓN DEL ROL */}
                  <div className="p-3 bg-[#0a0a0c]/50 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                      <Info size={10} className="text-indigo-500" /> Perfil {player.badge}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight italic font-medium">
                      "{player.definition}"
                    </p>
                  </div>
                  
                  {/* RAZÓN DEL PUESTO */}
                  <div className="px-1">
                    <p className="text-[8px] font-black text-indigo-400/70 uppercase mb-2 tracking-widest">Análisis de Mérito:</p>
                    <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                      {player.reason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* NOTA DE RIGOR AL PIE */}
      <p className="mt-6 text-center text-[7px] text-slate-600 font-bold uppercase tracking-[0.2em] px-4 leading-normal">
        Evaluación basada en la Verdad Académica del Docente e Interacciones Reales
      </p>
    </div>
  );
};

export default Leaderboard;