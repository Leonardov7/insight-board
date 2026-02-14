import React, { useEffect, useState } from 'react';
import { useMessages } from './hooks/useMessages';
import { usePresence } from './hooks/usePresence';
import AccessGuard from './components/AccessGuard';
import Board from './components/Board';
import InputArea from './components/InputArea';
import Sidebar from './components/Sidebar';
import AnalyticsModal from './components/AnalyticsModal';
import TopStatusHub from './components/TopStatusHub';
import { Settings, Hash, Activity, Rocket, Zap, Database, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { getEngagementRanking } from './services/aiService';

// --- NUEVO COMPONENTE: LOGIN ---
const LoginView = () => (
  <div className="h-screen w-screen bg-[#060608] flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-[#0e0e12] border border-white/10 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Bienvenido</h2>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-10">Gestiona tu Red Sináptica Profesional</p>

      <button
        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
        className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-lg"
      >
        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
        Entrar con Google
      </button>
    </div>
  </div>
);

function App() {
  const queryParams = new URLSearchParams(window.location.search);

  // --- NUEVOS ESTADOS DE IDENTIDAD ---
  const [sessionAuth, setSessionAuth] = useState(null);
  const [appView, setAppView] = useState('launcher'); // 'launcher' | 'insight-board'

  // Mantenemos el soporte para el parámetro admin o lo vinculamos al login
  const isAdmin = queryParams.get('admin') === 'true' || !!sessionAuth;

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);

  const { messages, sendMessage, fetchMessagesBySession, subscribeToMessages, updateMessage, deleteMessage } = useMessages();
  const onlineUsers = usePresence(session?.id, user);

  // --- ESCUCHA DE AUTENTICACIÓN ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSessionAuth(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSessionAuth(s));
    return () => subscription.unsubscribe();
  }, []);

  // --- ANTENA DE SINCRONIZACIÓN ---
  useEffect(() => {
    if (!session?.id) return;

    fetchMessagesBySession(session.id);
    const unsubscribeMessages = subscribeToMessages(session.id);

    const channelName = `sync_gate_${session.id}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: true } }
    })
      .on('broadcast', { event: 'START_SESSION' }, () => {
        setSession(prev => ({ ...prev, status: 'active' }));
      })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sesiones', filter: `id=eq.${session.id}` },
        (payload) => {
          // CAMBIO: Ahora aceptamos cualquier status que venga de la DB (active o inactive)
          setSession(prev => ({ ...prev, status: payload.new.status }));

          // Si tienes fetchMessagesBySession definido, úsalo aquí para refrescar
          if (typeof fetchMessagesBySession === 'function') {
            fetchMessagesBySession(session.id);
          }
        }
      )
      .subscribe();

    const poller = setInterval(async () => {
      if (!isAdmin && session?.status !== 'active') {
        const { data } = await supabase.from('sesiones').select('status').eq('id', session.id).maybeSingle();
        if (data?.status === 'active') {
          setSession(prev => ({ ...prev, status: 'active' }));
          clearInterval(poller);
        }
      }
    }, 3000);

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      supabase.removeChannel(channel);
      clearInterval(poller);
    };
  }, [session?.id]);

  // --- PULSO DE GAMIFICACIÓN ---
  useEffect(() => {
    if (messages.length >= 7) {
      const runPulse = async () => {
        try {
          const newRanking = await getEngagementRanking(messages);
          setRanking(newRanking);
        } catch (error) {
          console.error("❌ [GAMIFICACIÓN] Fallo:", error);
        }
      };
      runPulse();
    }
  }, [messages.length]);

  const handleStartSinapsis = async () => {
    if (!session?.id) return;
    await supabase.from('sesiones').update({ status: 'active' }).eq('id', session.id);
    const channel = supabase.channel(`sync_gate_${session.id}`);
    await channel.send({ type: 'broadcast', event: 'START_SESSION', payload: { status: 'active' } });
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
  const handleEditMessage = async (msgId, currentContent) => {
    console.log("🧠 Iniciando remapeo de neurona:", msgId);
    const newText = window.prompt("RECONFIGURAR NÚCLEO COGNITIVO:", currentContent);

    if (newText !== null && newText.trim() !== "" && newText !== currentContent) {
      try {
        console.log("🛰️ Enviando pulso de actualización a la red...");
        await updateMessage(msgId, newText.trim());
        console.log("✅ Sinapsis reconfigurada con éxito.");

        // Forzamos actualización local inmediata para asegurar visión
        fetchMessagesBySession(session.id);
      } catch (e) {
        console.error("❌ Fallo en la reconfiguración:", e);
        alert("Error en la transmisión neuronal.");
      }
    }
  };


  const handleSmartDelete = async (msgId) => {
    const hasChildren = messages.some(m => m.parent_id === msgId);
    console.log(`🧐 Analizando topología: ${hasChildren ? 'Rama activa' : 'Neurona terminal'}`);

    if (!hasChildren) {
      // CASO HOJA: Borrado físico
      if (window.confirm("¿Deseas disolver esta neurona aislada del flujo cognitivo?")) {
        try {
          console.log("🗑️ Podando neurona terminal...");
          await deleteMessage(msgId);
          console.log("✅ Neurona disuelta.");
        } catch (e) {
          console.error("❌ Error al podar:", e);
        }
      }
    } else {
      // CASO NODO: Borrado lógico (Inhibición)
      if (window.confirm("Esta neurona posee conexiones sinápticas activas. Se inhibirá su núcleo para preservar la integridad de la red. ¿Proceder?")) {
        try {
          console.log("🚫 Inhibiendo núcleo sináptico...");
          await updateMessage(msgId, "🚫 [Sinapsis Inhibida por el Docente]");
          console.log("✅ Núcleo neutralizado. Estructura preservada.");
        } catch (e) {
          console.error("❌ Error al inhibir:", e);
        }
      }
    }
  };
  // --- LÓGICA DE NAVEGACIÓN ---
  if (!sessionAuth && isAdmin) return <LoginView />;

  if (appView === 'launcher' && isAdmin) {
    return (
      <div className="h-screen w-screen bg-[#060608] flex flex-col items-center justify-center p-10 font-sans">
        <div className="text-center mb-16">
          <h2 className="text-white font-black uppercase tracking-[0.4em] text-[10px] mb-2 opacity-40">Ecosistema Cognitivo</h2>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Mis Aplicaciones</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <button
            onClick={() => setAppView('insight-board')}
            className="p-12 bg-indigo-600/5 border border-indigo-500/20 rounded-[3rem] hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Zap className="text-indigo-400 mb-6 group-hover:scale-110 transition-transform" size={48} />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Insight Board</h3>
            <p className="text-[10px] text-slate-500 uppercase font-bold mt-3 tracking-widest">Red de Sinapsis en Vivo</p>
          </button>

          <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[3rem] opacity-30 grayscale cursor-not-allowed">
            <Database className="text-slate-500 mb-6" size={48} />
            <h3 className="text-slate-500 font-black uppercase italic tracking-tighter text-xl">Dendron LMS</h3>
            <p className="text-[10px] text-slate-600 uppercase font-bold mt-3 tracking-widest">Próxima Integración</p>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-20 flex items-center gap-2 text-slate-600 hover:text-rose-500 transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>
    );
  }
  // --- LÓGICA DE BLOQUEO RESTAURADA ---
  // 1. Verificamos si ya existe el mensaje raíz (semilla) del docente
  const hasSeed = messages.some(m => !m.parent_id);

  // 2. El docente siempre puede publicar (para crear la semilla o intervenir)
  // 3. El estudiante solo puede si: la sesión está ACTIVA Y ya existe la semilla
  const canPost = isAdmin || (session?.status === 'active' && hasSeed);
  return (
    <AccessGuard
      isAdmin={isAdmin} session={session} user={user}
      setSession={setSession} onUserAssigned={setUser}
      sessionReady={!!session && !!user}
    >
      <div className="h-screen w-screen bg-[#0a0a0c] text-slate-100 flex flex-col overflow-hidden font-sans">

        {/* HEADER PRINCIPAL */}
        <header className={`h-16 border-b flex justify-between items-center px-8 z-50 backdrop-blur-xl ${isAdmin ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-[#0e0e12]/80 border-white/5'}`}>
          <div className="flex items-center gap-8">
            <button onClick={() => setAppView('launcher')} className="flex flex-col hover:opacity-70 transition-opacity">
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-0.5">Red de Sinapsis</span>
              <h1 className="text-xs font-bold uppercase truncate max-w-[200px] tracking-tight">{session?.tema}</h1>
            </button>

            <div className="bg-indigo-600/10 border border-indigo-500/20 px-4 py-1.5 rounded-xl flex items-center gap-3">
              <Hash size={14} className="text-indigo-400" />
              <span className="text-sm font-black text-white font-mono tracking-tighter">{session?.codigo}</span>
            </div>

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
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: user?.color }} />
              <span className="text-[10px] font-black text-white uppercase font-mono">{user?.name}</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 transition-all">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* CONTENEDOR CENTRAL */}
        <div className="flex-1 relative flex flex-col overflow-hidden">

          {session && (
            <TopStatusHub
              connectedUsers={onlineUsers}
              ranking={ranking}
              sessionStatus={session.status}
            />
          )}

          <main className="flex-1 relative bg-[#070709] z-10">
            <Board
              messages={messages}
              isAdmin={isAdmin}
              userAlias={user?.name}
              onReply={(msg, text) => setReplyingTo({ msg, quoteText: text })}
              sessionStatus={session?.status}
              onDeleteMessage={handleSmartDelete} // <--- Tu función inteligente
              onEditMessage={handleEditMessage}   // <--- Tu función de edición
            />
          </main>

          <footer className="p-6 bg-[#0a0a0c]/95 border-t border-white/5 z-40">
            <div className="max-w-4xl mx-auto">
              {canPost ? (
                <InputArea onSend={handleSend} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} />
              ) : (
                <div className="py-4 px-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[1.5rem] flex items-center justify-center gap-4">
                  <Activity size={18} className={!hasSeed ? "text-indigo-500 animate-pulse" : "text-rose-500 animate-pulse"} />
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
                    {!hasSeed
                      ? "Esperando a que el docente plantee el tema de apertura..."
                      : "La red ha sido pausada por el docente."}
                  </p>
                </div>
              )}
            </div>
          </footer>
        </div>

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isAdmin={isAdmin}
          currentSessionId={session?.id}
          currentSessionStatus={session?.status} // <--- ESTA ES LA LÍNEA NUEVA
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
      </div>
    </AccessGuard>
  );
}

export default App;