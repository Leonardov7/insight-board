import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Shield, MessageSquareReply, Maximize2, Zap, Trash2, Pencil } from 'lucide-react';

const SynapseNode = memo(({ data }) => {
    const { msg, onReply, isRoot, onIsolate, onDelete, onEdit, isAdminView } = data;
    const isAi = msg.is_ai;
    const isDocente = msg.alias === "Docente" || msg.alias === "Administrador" || msg.alias === "Admin";

    // 1. LÓGICA DE DETECCIÓN DE INHIBICIÓN
    const isInhibited = msg.content.includes("🚫 [NÚCLEO NEUTRALIZADO]") || msg.content.includes("Sinapsis Inhibida");
    const themeColor = msg.color_theme || '#6366f1';

    return (
        <div className="relative group transition-all duration-300">
            
            {/* 2. RESPLANDOR NEÓN: Se apaga totalmente si la neurona está inhibida */}
            <div
                className={`absolute -inset-1 blur-xl transition-opacity rounded-full 
                ${isInhibited ? 'opacity-0' : 'opacity-20 group-hover:opacity-50'}`} 
                style={{ backgroundColor: themeColor }}
            />

            {/* CONTROLES DE ADMINISTRADOR */}
            {isAdminView && (
                <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-[100]">
                    <button
                        onClick={(e) => { e.stopPropagation(); if (onEdit) onEdit(msg.id, msg.content); }}
                        className="p-1.5 bg-amber-500 text-white rounded-full hover:bg-amber-400 shadow-lg border border-white/10"
                        title="Reconfigurar"
                    >
                        <Pencil size={10} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(msg.id); }}
                        className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-500 shadow-lg border border-white/10"
                        title="Protocolo de Poda/Inhibición"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
            )}

            {/* 3. CUERPO DEL ORBE: Grayscale y Opacidad reducida si está inhibida */}
            <div
                className={`relative min-w-[160px] max-w-[220px] p-3 rounded-[1.2rem] border backdrop-blur-md shadow-lg transition-all
                ${isRoot ? 'ring-1 ring-white/20' : ''} 
                ${isDocente && !isInhibited ? 'ring-2 ring-indigo-500/50 border-indigo-400/50' : 'border-white/10'}
                ${isInhibited ? 'grayscale opacity-50 border-slate-700 brightness-50' : ''}`}
                style={{
                    backgroundColor: isInhibited ? '#0f172a' : `${themeColor}15`,
                    borderColor: isInhibited ? '#334155' : (isDocente ? '#818cf8' : `${themeColor}44`),
                }}
            >
                {/* ETIQUETA DOCENTE (Se oculta si está inhibida para limpiar la visual) */}
                {isDocente && !isInhibited && (
                    <div className="absolute -top-3 -left-1 bg-indigo-600 text-[7px] font-black px-2 py-0.5 rounded-full uppercase text-white flex items-center gap-1 shadow-lg border border-indigo-400 z-10">
                        <Zap size={8} fill="currentColor" />
                        {msg.alias}
                    </div>
                )}

                <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                        <div
                            className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] 
                            ${isAi && !isInhibited ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : ''}`}
                            style={{
                                color: isInhibited ? '#475569' : themeColor,
                                backgroundColor: isInhibited ? '#475569' : themeColor,
                                filter: (isAi && !isInhibited) ? 'brightness(2.5)' : 'none'
                            }}
                        />
                        <span className="text-[8px] font-black uppercase tracking-tight truncate max-w-[100px] text-white/60">
                            {msg.alias}
                        </span>
                    </div>
                    {isDocente && !isInhibited && <Shield size={10} className="text-indigo-400" />}
                </div>

                {/* TEXTO DE LA NEURONA */}
                <p className={`text-[11px] leading-[1.3] font-medium mb-2 ${isInhibited ? 'text-slate-500 italic' : 'text-slate-100'}`}>
                    {msg.content.replace(/^> .*?\s/, "")}
                </p>

                <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                    <span className="text-[7px] font-mono text-slate-600 italic">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onIsolate(); }}
                            title="Aislar este debate"
                            className="p-1 rounded-full bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all border border-white/10"
                        >
                            <Maximize2 size={11} />
                        </button>

                        {/* Impedimos respuesta si la neurona está inhibida */}
                        {!isInhibited && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onReply(msg, msg.content); }}
                                title="Responder"
                                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                            >
                                <MessageSquareReply size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <Handle type="target" position={Position.Left} className="!opacity-0" style={{ left: '10px' }} />
            <Handle type="source" position={Position.Right} className="!opacity-0" />
        </div>
    );
});

export default SynapseNode;