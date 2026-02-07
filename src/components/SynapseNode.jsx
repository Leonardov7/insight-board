import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
// Mantenemos Zap para el Docente
import { Shield, MessageSquareReply, Maximize2, Zap } from 'lucide-react';

const SynapseNode = memo(({ data }) => {
    const { msg, userAlias, onReply, isRoot, onIsolate } = data;

    const isAi = msg.is_ai;
    const isDocente = msg.alias === "Docente" || msg.alias === "Administrador" || msg.alias === "Admin";

    // Eliminamos el forzado de color para la IA para que use su color de "estudiante"
    const themeColor = msg.color_theme || '#6366f1';

    return (
        <div className="relative group transition-all duration-300">
            {/* Resplandor Neón: Normal para todos, ligeramente más opaco para el Docente */}
            <div
                className={`absolute -inset-1 blur-xl transition-opacity rounded-full opacity-20 group-hover:opacity-50`}
                style={{ backgroundColor: themeColor }}
            />

            {/* Cuerpo del Orbe */}
            <div
                className={`relative min-w-[160px] max-w-[220px] p-3 rounded-[1.2rem] border backdrop-blur-md shadow-lg
                ${isRoot ? 'ring-1 ring-white/20' : ''} 
                ${isDocente ? 'ring-2 ring-indigo-500/50 border-indigo-400/50' : 'border-white/10'}`}
                style={{
                    backgroundColor: `${themeColor}15`,
                    borderColor: isDocente ? '#818cf8' : `${themeColor}44`,
                }}
            >
                {/* ETIQUETA DOCENTE: Ahora el Rayito lo lleva el profesor */}
                {isDocente && (
                    <div className="absolute -top-3 -left-1 bg-indigo-600 text-[7px] font-black px-2 py-0.5 rounded-full uppercase text-white flex items-center gap-1 shadow-lg border border-indigo-400 z-10">
                        <Zap size={8} fill="currentColor" />
                        {msg.alias}
                    </div>
                )}

                <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                        {/* Pequeño pulso: Única marca secreta que solo tú (el docente) notarás en los hilos de IA */}
                        <div
                            className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] 
    ${isAi ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : ''}`} // Latido exclusivo para la IA
                            style={{
                                color: themeColor,
                                backgroundColor: themeColor,
                                // Si es IA, podemos hacer que el brillo sea ligeramente más intenso
                                filter: isAi ? 'brightness(2.5)' : 'none'
                            }}
                        />
                        <span className="text-[8px] font-black uppercase tracking-tight truncate max-w-[100px] text-white/60">
                            {msg.alias}
                        </span>
                    </div>
                    {/* El escudo solo aparece si es docente y no es una intervención secreta */}
                    {isDocente && <Shield size={10} className="text-indigo-400" />}
                </div>

                {/* Texto: Eliminamos la cursiva de IA para que no sospechen */}
                <p className="text-[11px] leading-[1.3] font-medium mb-2 text-slate-100">
                    {msg.content.replace(/^> .*?\s/, "")}
                </p>

                <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                    <span className="text-[7px] font-mono text-slate-600 italic">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onIsolate();
                            }}
                            title="Aislar este debate"
                            className="p-1 rounded-full bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all border border-white/10"
                        >
                            <Maximize2 size={11} />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onReply(msg, msg.content);
                            }}
                            title="Responder"
                            className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                        >
                            <MessageSquareReply size={12} />
                        </button>
                    </div>
                </div>
            </div>

            <Handle type="target" position={Position.Left} className="!opacity-0" style={{ left: '10px' }} />
            <Handle type="source" position={Position.Right} className="!opacity-0" />
        </div>
    );
});

export default SynapseNode;