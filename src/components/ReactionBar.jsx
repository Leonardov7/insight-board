import React from 'react';
import { Lightbulb, HelpCircle, Star } from 'lucide-react';
import { useReactions } from '../hooks/useReactions';

const ReactionBar = ({ intervencionId, userAlias }) => {
  const { counts, addReaction } = useReactions(intervencionId);

  const reactions = [
    { type: 'aporte', icon: <Lightbulb size={12} />, label: '¡Buen punto!', color: 'text-amber-400' },
    { type: 'duda', icon: <HelpCircle size={12} />, label: 'Tengo duda', color: 'text-rose-400' },
    { type: 'interesante', icon: <Star size={12} />, label: 'Interesante', color: 'text-indigo-400' },
  ];

  return (
    <div className="flex gap-2 mt-2">
      {reactions.map((r) => (
        <button
          key={r.type}
          onClick={() => addReaction(r.type, userAlias)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-all group`}
        >
          <span className={`${r.color} group-hover:scale-110 transition-transform`}>{r.icon}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase">{counts[r.type]}</span>
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;