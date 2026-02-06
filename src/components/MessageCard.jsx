import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareReply, Shield, Target, Lightbulb, HelpCircle, Star } from 'lucide-react';
import { useReactions } from '../hooks/useReactions';

const MessageCard = ({ msg, onReply, isAdminView, onFocus, isFocused, userAlias }) => {
  const { counts, userReactions, toggleReaction } = useReactions(msg.id, userAlias);
  
  const isDocente = msg.alias === "Docente" || msg.alias === "Administrador";
  const isOwnMessage = msg.alias === userAlias;

  // Configuración de los "bombillitos"
  const buttonConfigs = [
    { type: 'aporte', icon: <Lightbulb size={12} />, activeClass: 'text-amber-400 bg-amber-500/20 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' },
    { type: 'duda', icon: <HelpCircle size={12} />, activeClass: 'text-rose-400 bg-rose-500/20 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]' },
    { type: 'interesante', icon: <Star size={12} />, activeClass: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]' }
  ];

  return (
    <motion.div layout
      className={`relative p-5 border shadow-2xl transition-all group
        ${isDocente ? 'bg-indigo-600/10 border-indigo-500/30 rounded-tr-3xl rounded-bl-3xl' : 'bg-[#16161a] border-white/5 rounded-2xl'}
        ${isAdminView ? 'w-80' : 'w-full max-w-2xl'}`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: msg.color_theme }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: msg.color_theme }}>
            {msg.alias} {isOwnMessage && <span className="text-slate-500 ml-1">(TÚ)</span>}
          </span>
        </div>
        {isDocente && <Shield size={10} className="text-indigo-400" />}
      </div>

      <p className={`text-slate-200 leading-relaxed font-medium ${isAdminView ? 'text-[11px] line-clamp-4' : 'text-sm'}`}>
        {msg.content}
      </p>

      {/* PANEL DE REACCIONES (PULSADORES) */}
      <div className="mt-4 flex gap-2 pt-3 border-t border-white/5">
        {buttonConfigs.map((btn) => {
          const isActive = userReactions.includes(btn.type);
          return (
            <button 
              key={btn.type}
              disabled={isOwnMessage}
              onClick={() => toggleReaction(btn.type)}
              className={`px-2.5 py-1.5 rounded-xl flex items-center gap-2 border transition-all duration-300
                ${isOwnMessage ? 'opacity-30 cursor-not-allowed border-transparent' : 'cursor-pointer'}
                ${isActive ? btn.activeClass : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/10'}`}
            >
              <span className={isActive ? 'animate-pulse' : ''}>{btn.icon}</span>
              <span className="text-[10px] font-black font-mono">{counts[btn.type]}</span>
            </button>
          );
        })}
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          {!isFocused && <button onClick={onFocus} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"><Target size={14}/></button>}
          <button onClick={() => onReply(msg)} className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 transition-opacity"><MessageSquareReply size={14} /></button>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageCard;