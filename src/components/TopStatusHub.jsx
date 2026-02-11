import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Radio, Trophy } from 'lucide-react';
import Leaderboard from './Leaderboard';

const TopStatusHub = ({ connectedUsers = [], ranking = [], sessionStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    // CAMBIO: Alineado a la derecha (right-20) y ancho reducido (w-72)
    <div className="fixed top-[75px] right-20 z-40 w-72 transition-all duration-500 ease-in-out">
      {/* BARRA COMPACTA */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between px-4 py-2 bg-[#0e0e12]/90 backdrop-blur-xl border border-white/10 shadow-2xl cursor-pointer transition-all duration-300
          ${isExpanded ? 'rounded-t-2xl border-b-0' : 'rounded-xl hover:border-indigo-500/50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${sessionStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
            {connectedUsers.length} Mentes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {ranking.length > 0 && !isExpanded && <Trophy size={12} className="text-amber-400" />}
          {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </div>

      {/* PANEL DESPLEGABLE VERTICAL */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out bg-[#0e0e12]/95 backdrop-blur-2xl border-x border-b border-white/10 rounded-b-2xl shadow-2xl
          ${isExpanded ? 'max-h-[60vh] opacity-100 p-4' : 'max-h-0 opacity-0 p-0 border-none'}`}
      >
        <div className="space-y-6">
          {/* Usuarios Conectados */}
          <section>
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Conexiones Activas</p>
            <div className="flex flex-wrap gap-1.5">
              {connectedUsers.map((user, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.color }} />
                  <span className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[60px]">{user.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Ranking */}
          <section className="pt-4 border-t border-white/5">
            <Leaderboard ranking={ranking} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default TopStatusHub;