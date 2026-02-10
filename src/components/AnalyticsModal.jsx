import React, { useState, useEffect } from 'react';
// Cambiamos 'User' por 'Users' (con S al final)
import { X, Brain, Target, Zap, Loader2, TrendingUp, TrendingDown, Users, FileDown } from 'lucide-react'; 
// CORRECCIÓN 1: Importar getEngagementRanking
import { getSemanticClusters, getEngagementRanking } from '../services/aiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AnalyticsModal = ({ isOpen, onClose, messages = [] }) => {
  const [clusters, setClusters] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && messages.length >= 3) {
      const analyze = async () => {
        setLoading(true);
        try {
          // Ejecutamos ambas peticiones en paralelo
          const [clusterData, rankingData] = await Promise.all([
            getSemanticClusters(messages),
            getEngagementRanking(messages)
          ]);

          setClusters(clusterData);
          setRanking(rankingData);
        } catch (error) {
          console.error("Fallo en el motor analítico:", error);
        } finally {
          setLoading(false);
        }
      };
      analyze();
    }
  }, [isOpen, messages.length]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("REPORTE: MONITOR SEMÁNTICO", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = clusters.map(c => [
      c.topic.toUpperCase(),
      c.summary,
      c.count,
      c.sentiment
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['TEMA', 'RESUMEN SEMÁNTICO', 'IDEAS', 'POSTURA']],
      body: tableData,
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`Reporte_Sinapsis_${new Date().getTime()}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0e0e11]/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-[#14141a] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

        {/* HEADER */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <Brain className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Monitor Semántico</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Mapa de Sintonía Cognitiva</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {clusters.length > 0 && !loading && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 transition-all text-[10px] font-black uppercase tracking-widest mr-2"
              >
                <FileDown size={14} />
                PDF
              </button>
            )}
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* CUERPO DEL MODAL (Área con scroll) */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
          
          {/* 1. KPIs RÁPIDOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Volumen de Ideas</p>
              <h4 className="text-3xl font-black text-white">{messages.length}</h4>
            </div>
            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
              <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Provocaciones Activas</p>
              <h4 className="text-3xl font-black text-indigo-300">{messages.filter(m => m.is_ai).length}</h4>
            </div>
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Impacto de IA</p>
              <h4 className="text-3xl font-black text-white">High</h4>
            </div>
          </div>

          {/* 2. ÁREA DE CLUSTERING TEMÁTICO */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Distribución Semántica</h3>

            {loading ? (
              <div className="min-h-[300px] border-2 border-dashed border-indigo-500/20 rounded-[2rem] flex flex-col items-center justify-center text-center p-12 bg-indigo-500/5">
                <Loader2 size={40} className="text-indigo-400 animate-spin mb-4" />
                <h3 className="text-sm font-black text-indigo-300 uppercase animate-pulse">DeepSeek está extrayendo los temas...</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusters.map((cluster, idx) => (
                  <div key={idx} className="p-6 bg-white/[0.02] border border-white/10 rounded-3xl hover:bg-white/[0.04] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <span className="text-[10px] font-black text-indigo-400 uppercase">{cluster.topic}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${cluster.sentiment === 'Divergencia' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {cluster.sentiment === 'Divergencia' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        {cluster.sentiment}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4 italic">"{cluster.summary}"</p>
                    <div className="flex items-center gap-2">
                      <Users size={12} className="text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{cluster.count} Intervenciones</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CORRECCIÓN 2: SECCIÓN DE GAMIFICACIÓN MOVIDA DENTRO DEL SCROLL */}
          <div className="space-y-6 pb-8">
            <div className="flex items-center gap-2 ml-2">
              <Zap size={14} className="text-amber-400" fill="currentColor" />
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                Mentes Destacadas del Debate
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ranking.length > 0 ? (
                ranking.map((player, idx) => (
                  <div key={idx} className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] relative group hover:scale-[1.02] transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-lg font-black text-indigo-400">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                      </div>
                      <span className="text-[11px] font-black text-white uppercase mb-1">{player.alias}</span>
                      <div className="px-3 py-0.5 bg-indigo-500/20 rounded-full mb-3">
                        <span className="text-[8px] font-black text-indigo-300 uppercase tracking-tighter">{player.badge}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic leading-tight px-2">"{player.reason}"</p>
                    </div>
                  </div>
                ))
              ) : (
                !loading && <p className="col-span-3 text-center text-[10px] text-slate-600 uppercase font-bold tracking-widest py-8">Aún no hay suficiente actividad para el ranking...</p>
              )}
            </div>
          </div>

        </div> {/* CIERRE DEL CUERPO CON SCROLL */}
      </div>
    </div>
  );
};

export default AnalyticsModal;