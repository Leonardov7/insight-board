import React, { useState } from 'react';
import { Send, X, Quote } from 'lucide-react';

const InputArea = ({ onSend, replyingTo, onCancelReply }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="flex flex-col gap-2">
      {replyingTo && (
        <div className="bg-indigo-500/10 border-l-2 border-indigo-500 p-3 rounded-r-lg flex justify-between items-start animate-in slide-in-from-bottom-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Quote size={10} /> Citando a {replyingTo.msg.alias}
            </span>
            <p className="text-xs text-slate-400 italic line-clamp-1">
              "{replyingTo.quoteText || replyingTo.msg.content}"
            </p>
          </div>
          <button onClick={onCancelReply} className="text-slate-500 hover:text-white p-1"><X size={14}/></button>
        </div>
      )}
      
      <div className="flex gap-3 items-center">
        <textarea
          className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-12 custom-scrollbar"
          placeholder="Escribe tu argumento..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        />
        <button 
          onClick={handleSend}
          className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-xl transition-all active:scale-95 text-white"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default InputArea;