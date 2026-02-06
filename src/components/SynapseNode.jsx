import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Shield, MessageSquareReply, Maximize2 } from 'lucide-react';

const SynapseNode = memo(({ data }) => {
    // Extraemos onIsolate que viene desde el Board
    const { msg, userAlias, onReply, isRoot, onIsolate } = data;

    const isDocente = msg.alias === "Docente" || msg.alias === "Administrador";
    const themeColor = msg.color_theme || '#6366f1';

    return (
        <div className="relative group transition-all duration-300">
            {/* Resplandor Neón */}
            <div
                className="absolute -inset-1 blur-xl opacity-20 group-hover:opacity-50 transition-opacity rounded-full"
                style={{ backgroundColor: themeColor }}
            />

            {/* Cuerpo del Orbe: Compactado al máximo */}
            <div
                className={`relative min-w-[160px] max-w-[220px] p-3 rounded-[1.2rem] border backdrop-blur-md shadow-lg
          ${isRoot ? 'ring-1 ring-white/20' : ''}`}
                style={{
                    backgroundColor: `${themeColor}15`,
                    borderColor: `${themeColor}44`,
                }}
            >
                <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                        <div
                            className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]"
                            style={{ color: themeColor, backgroundColor: themeColor }}
                        />
                        <span className="text-[8px] font-black uppercase tracking-tight text-white/60 truncate max-w-[80px]">
                            {msg.alias}
                        </span>
                    </div>
                    {isDocente && <Shield size={10} className="text-indigo-400" />}
                </div>

                <p className="text-[11px] text-slate-100 leading-[1.3] font-medium mb-2">
                    {/* Esta expresión regular quita todo lo que empiece por "> " hasta el primer espacio/salto de línea */}
                    {msg.content.replace(/^> .*?\s/, "")}
                </p>

                <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                    <span className="text-[7px] font-mono text-slate-600 italic">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1">
                        {/* NUEVO: Botón de Aislamiento (Modo Enfoque) */}
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

                        {/* Botón de Respuesta */}
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

            {/* Conectores invisibles pero funcionales */}
            <Handle
                type="target"
                position={Position.Left}
                className="!opacity-0"
                style={{ left: '10px' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!opacity-0"
            />
        </div>
    );
});

export default SynapseNode;