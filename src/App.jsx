import React, { useEffect, useState } from 'react';
import { useMessages } from './hooks/useMessages';
import { usePresence } from './hooks/usePresence';
import AccessGuard from './components/AccessGuard';
import Board from './components/Board';
import InputArea from './components/InputArea';
import Sidebar from './components/Sidebar';
import AnalyticsModal from './components/AnalyticsModal';
import ParticipantsList from './components/ParticipantsList';
import Leaderboard from './components/Leaderboard'; // <--- AGREGADO
import { Settings, Hash, Shield, Activity, Rocket } from 'lucide-react';
import { supabase } from './lib/supabase';
import { getEngagementRanking } from './services/aiService'; // <--- AGREGADO

function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const isAdmin = queryParams.get('admin') === 'true';

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false); // <--- 
  const [ranking, setRanking] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);

  const { messages, sendMessage, fetchMessagesBySession, subscribeToMessages } = useMessages();
  const onlineUsers = usePresence(session?.id, user);

  // LOG DE CONTROL: Para ver en qué estado está la app en cada momento
  console.log("🔍 [SISTEMA] Status actual:", session?.status);

  // --- ANTENA DE SINCRONIZACIÓN TOTAL ---
  useEffect(() => {
    if (!session?.id) return;

    fetchMessagesBySession(session.id);
    const unsubscribeMessages = subscribeToMessages(session.id);

    // 1. ANTENA REALTIME (Broadcast + Postgres)
    const channelName = `sync_gate_${session.id}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: true } }
    })
      .on('broadcast', { event: 'START_SESSION' }, () => {
        console.log("⚡ [RADIO] Señal recibida: Activando tablero");
        setSession(prev => ({ ...prev, status: 'active' }));
      })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sesiones', filter: `id=eq.${session.id}` },
        (payload) => {
          if (payload.new.status === 'active') {
            console.log("🚀 [DB] Cambio detectado por Postgres");
            setSession(prev => ({ ...prev, status: 'active' }));
          }
        }
      )
      .subscribe((status) => {
        console.log(`📶 [ANTENA] Conexión (${isAdmin ? 'DOCENTE' : 'ALUMNO'}):`, status);
      });

    // 2. PLAN B: MOTOR DE RESCATE (Sondeo incondicional)
    // Este motor ignora errores de red y sigue intentando cada 3 segundos.
    const poller = setInterval(async () => {
      if (!isAdmin && session?.status !== 'active') {
        try {
          const { data, error } = await supabase
            .from('sesiones')
            .select('status')
            .eq('id', session.id)
            .maybeSingle();

          if (error) {
            console.warn("🌐 [RED] Buscando señal... (Reintentando)");
            return;
          }

          if (data?.status === 'active') {
            console.log("✅ [RESCATE] Sesión activa detectada manualmente.");
            setSession(prev => ({ ...prev, status: 'active' }));
            clearInterval(poller);
          }
        } catch (err) {
          console.error("🚨 Fallo de red crítico:", err.message);
        }
      }
    }, 3000);

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      supabase.removeChannel(channel);
      clearInterval(poller);
    };
  }, [session?.id]);

  // --- PULSO DE GAMIFICACIÓN AUTÓNOMO ---
  useEffect(() => {
    if (messages.length >= 7) {
      const runPulse = async () => {
        try {
          const newRanking = await getEngagementRanking(messages);
          setRanking(newRanking);
        } catch (error) {
          console.error("❌ [GAMIFICACIÓN] Fallo en el pulso:", error);
        }
      };
      runPulse();
    }
  }, [messages.length]); // <--- AGREGADO: Evaluación automática tras umbral

  // --- FUNCIÓN DE INICIO (DOCENTE) ---
  const handleStartSinapsis = async () => {
    if (!session?.id) return;
    console.log("📡 [TRANSMISIÓN] Iniciando sinapsis...");

    // A. Actualización en DB (Base sólida)
    const { error } = await supabase
      .from('sesiones')
      .update({ status: 'active' })
      .eq('id', session.id);

    if (error) {
      console.error("❌ Error DB:", error.message);
      return;
    }

    // B. Pulso de Radio (Velocidad instantánea)
    const channel = supabase.channel(`sync_gate_${session.id}`);
    await channel.send({
      type: 'broadcast',
      event: 'START_SESSION',
      payload: { status: 'active' }
    });

    console.log("🚀 [OK] Sinapsis activa para la red.");
    setSession(prev => ({ ...prev, status: 'active' }));
  };

  const handleSend = async (text) => {
    if (!session || !user) return;
    const seed = messages.find(m => !m.parent_id);
    const parentId = replyingTo?.msg?.id || (seed ? seed.id : null);
    await sendMessage(text, user.name, user.color, parentId, session.id);
    setReplyingTo(null);
  };

  const handleSwitchSession = (newSession) => {
    setSession(newSession);
    setIsSidebarOpen(false);
  };

  const handleNewDebate = () => {
    setSession(null);
    setUser(null);
    setIsSidebarOpen(false);
  };

  const hasSeed = messages.length > 0;
  const canPost = isAdmin || hasSeed;

  return (
    <AccessGuard
      isAdmin={isAdmin} session={session} user={user}
      setSession={setSession} onUserAssigned={setUser}
      sessionReady={!!session && !!user}
    >
      <div className="h-screen w-screen bg-[#0a0a0c] text-slate-100 flex overflow-hidden font-sans">
        <div className="flex-1 flex flex-col relative overflow-hidden border-r border-white/5">
          <header className={`h-16 border-b flex justify-between items-center px-8 z-40 backdrop-blur-xl ${isAdmin ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-[#0e0e12]/80 border-white/5'}`}>
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-0.5">Red de Sinapsis</span>
                <h1 className="text-xs font-bold uppercase truncate max-w-[250px] tracking-tight">{session?.tema}</h1>
              </div>
              <div className="bg-indigo-600/10 border border-indigo-500/20 px-4 py-1.5 rounded-xl flex items-center gap-3">
                <Hash size={14} className="text-indigo-400" />
                <span className="text-sm font-black text-white font-mono tracking-tighter">{session?.codigo}</span>
              </div>
              {/* BOTÓN DINÁMICO: Aparece si está en espera o si fue inactivada */}
              {isAdmin && (session?.status === 'waiting' || session?.status === 'inactive') && (
                <button
                  onClick={handleStartSinapsis}
                  className="px-4 py-1.5 bg-emerald-500 text-[#0a0a0c] text-[10px] font-black uppercase rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  <Rocket size={12} />
                  {session?.status === 'inactive' ? 'Reactivar Sinapsis' : 'Iniciar Sinapsis'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: user?.color }} />
                <span className="text-[10px] font-black text-white uppercase font-mono">{user?.name}</span>
              </div>
              <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 transition-all">
                <Settings size={20} />
              </button>
            </div>
          </header>

          <main className="flex-1 relative overflow-hidden bg-[#070709]">
            <Board messages={messages} isAdmin={isAdmin} userAlias={user?.name} onReply={(msg, text) => setReplyingTo({ msg, quoteText: text })} />
          </main>

          <footer className="p-6 bg-[#0a0a0c]/95 border-t border-white/5 z-40">
            <div className="max-w-4xl mx-auto">
              {canPost ? (
                <InputArea onSend={handleSend} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} />
              ) : (
                <div className="py-4 px-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[1.5rem] flex items-center justify-center gap-4">
                  <Activity size={18} className="text-indigo-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Esperando inicio del docente...</p>
                </div>
              )}
            </div>
          </footer>
        </div>
        <aside className="w-64 bg-[#0e0e11] border-l border-white/5 shadow-2xl z-30 flex flex-col overflow-y-auto custom-scrollbar">
          {/* 1. Lista de Usuarios Online */}
          <ParticipantsList participants={onlineUsers} />

          {/* 2. Cuadro de Honor (Ahora integrado aquí) */}
          <Leaderboard ranking={ranking} />
        </aside>

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isAdmin={isAdmin}
          currentSessionId={session?.id}
          onSwitchSession={handleSwitchSession}
          onNewDebate={handleNewDebate}
          messages={messages}
          sendMessage={sendMessage}
          setIsAnalyticsOpen={setIsAnalyticsOpen}
        />

        <AnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          messages={messages}
        />

        {/* ELIMINA EL <Leaderboard ranking={ranking} /> QUE ESTABA AQUÍ AFUERA */}
      </div>
    </AccessGuard>
  );
}

export default App;