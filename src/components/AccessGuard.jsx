import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateTechCode, generateAlias } from '../utils/aliases';
import {
  PlusCircle, Hash, ChevronRight, Activity,
  Loader2, Zap, UserCheck, LogOut
} from 'lucide-react';

const AccessGuard = ({ children, isAdmin, session, user: userProp, setSession, onUserAssigned, sessionReady }) => {
  // Estados para la navegación interna del login
  const [view, setView] = useState(isAdmin ? 'choice' : 'student_join');
  const [tema, setTema] = useState('');
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [savedSessions, setSavedSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(userProp);

  // Función para extraer la identidad real del administrador desde Google
  const getAdminIdentity = (u) => {
    const fullName = u?.user_metadata?.full_name || u?.email?.split('@')[0] || "Administrador";
    return { 
      name: `Docente: ${fullName}`, 
      color: "#818cf8", 
      isAdmin: true 
    };
  };

  // Cargar historial solo para el administrador con aislamiento de datos
  useEffect(() => {
    const initGuard = async () => {
      let activeUser = currentUser;
      if (!activeUser) {
        const { data: { user: sUser } } = await supabase.auth.getUser();
        activeUser = sUser;
        setCurrentUser(sUser);
      }
      if (isAdmin && activeUser) {
        supabase.from('sesiones')
          .select('*')
          .eq('owner_id', activeUser.id) // <--- AISLAMIENTO DE SEGURIDAD
          .order('created_at', { ascending: false })
          .then(({ data }) => setSavedSessions(data || []));
      }
    };
    initGuard();
  }, [isAdmin, currentUser]);

  // Función para que el docente cree un nuevo debate
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    const code = generateTechCode();

    const { data, error } = await supabase
      .from('sesiones')
      .insert([{
        tema: tema,
        codigo: code,
        status: 'waiting',
        owner_id: currentUser.id // <--- VINCULACIÓN CON EL USUARIO
      }])
      .select()
      .single();

    if (error) {
      setLoading(false);
      alert("Error al crear sesión: " + error.message);
      return;
    }

    if (data) {
      setSession(data);
      onUserAssigned(getAdminIdentity(currentUser)); // <--- USA NOMBRE DINÁMICO
    }
    setLoading(false);
  };

  // Función para que el estudiante se una mediante código
  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const code = codigoBusqueda.toUpperCase();

    const { data, error } = await supabase
      .from('sesiones')
      .select('*')
      .eq('codigo', code)
      .single();

    if (data) {
      const storageKey = `alicia_identity_${data.codigo}`;
      const saved = localStorage.getItem(storageKey);
      const identity = saved ? JSON.parse(saved) : generateAlias();

      if (!saved) localStorage.setItem(storageKey, JSON.stringify(identity));

      setSession(data);
      onUserAssigned(identity);
    } else {
      alert("Código no válido");
    }
    setLoading(false);
  };

  // Salida forzada para evitar errores de red/CORS
  const handleForceExit = async () => {
    if (window.confirm("¿Deseas cerrar la sesión administrativa?")) {
      try { await supabase.auth.signOut(); } catch (e) {}
      localStorage.clear();
      window.location.href = window.location.origin + (isAdmin ? '?admin=true' : '');
    }
  };

  // --- LÓGICA DE RENDERIZADO (SALA DE ESPERA VS TABLERO) ---
  if (sessionReady) {
    if (!isAdmin && session?.status !== 'active') {
      return (
        <div className="h-screen w-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden relative">
          <button
            onClick={() => { setSession(null); onUserAssigned(null); }}
            className="absolute top-10 left-10 p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest z-50"
          >
            <ChevronRight size={14} className="rotate-180" /> Regresar
          </button>
          <div className="relative mb-10">
            <div className="absolute -inset-10 bg-indigo-500/10 blur-[80px] rounded-full animate-pulse" />
            <div className="relative w-24 h-24 flex items-center justify-center">
              <Loader2 className="w-full h-full text-indigo-500 animate-spin opacity-20" />
              <Zap className="absolute text-indigo-400 animate-bounce" size={32} />
            </div>
          </div>
          <div className="space-y-2 z-10 animate-in fade-in zoom-in duration-700">
            <h2 className="text-xl font-black uppercase tracking-[0.3em] text-white italic">Sinapsis en Espera</h2>
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white/5 border border-white/10 rounded-full mx-auto w-fit">
              <UserCheck size={12} className="text-indigo-400" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                ID: <span className="text-indigo-400 font-mono">{userProp?.name}</span>
              </p>
            </div>
            <div className="pt-8 max-w-xs mx-auto">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mb-6" />
              <p className="text-slate-500 text-[10px] leading-relaxed uppercase tracking-tighter font-bold italic">
                "La red neuronal se está estabilizando. El docente iniciará la sesión en breve."
              </p>
            </div>
          </div>
        </div>
      );
    }
    return children;
  }

  // --- FORMULARIOS DE ACCESO (VISTA INICIAL) ---
  return (
    <div className="h-screen w-screen bg-[#060608] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#0e0e12] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Insight Board</h2>
          <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Cognitive Interface v4.0</p>
        </div>

        {isAdmin && view === 'choice' && (
          <div className="space-y-4 animate-in fade-in duration-500 text-left">
            <button
              onClick={handleForceExit}
              className="text-[9px] text-slate-600 hover:text-rose-400 uppercase font-black flex items-center gap-2 mb-2 transition-all"
            >
              <LogOut size={12} /> Cerrar Sesión / Salir
            </button>
            <button
              onClick={() => setView('create')}
              className="w-full p-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl flex items-center justify-between font-bold transition-all shadow-lg group"
            >
              <span className="flex items-center gap-3"><PlusCircle size={20} /> Nuevo Debate</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="py-4 flex items-center gap-4">
              <div className="h-px bg-white/5 flex-1" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Historial</span>
              <div className="h-px bg-white/5 flex-1" />
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
              {savedSessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSession(s);
                    onUserAssigned(getAdminIdentity(currentUser));
                  }}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left"
                >
                  <p className="text-xs font-bold text-slate-300 uppercase truncate">{s.tema}</p>
                  <p className="text-[9px] text-indigo-500 font-mono mt-1 uppercase">{s.codigo} — {s.status}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {(!isAdmin || view === 'create') && (
          <form onSubmit={isAdmin ? handleCreate : handleJoin} className="space-y-4 animate-in slide-in-from-bottom-4 text-left">
            <button
              type="button"
              onClick={() => isAdmin ? setView('choice') : handleForceExit()}
              className="text-[9px] text-slate-600 hover:text-white uppercase font-black flex items-center gap-1 mb-4 transition-all"
            >
              <ChevronRight size={12} className="rotate-180" /> Regresar
            </button>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">
                {isAdmin ? "Tema del debate" : "Hash de Conexión"}
              </label>
              <div className="relative">
                {isAdmin ? <Activity className="absolute left-5 top-5 text-indigo-500" size={20} /> : <Hash className="absolute left-5 top-5 text-indigo-500" size={20} />}
                <input
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-14 text-sm text-white outline-none focus:ring-1 ring-indigo-500 uppercase font-bold"
                  value={isAdmin ? tema : codigoBusqueda}
                  onChange={e => isAdmin ? setTema(e.target.value) : setCodigoBusqueda(e.target.value)}
                />
              </div>
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-indigo-500 transition-all flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isAdmin ? "Desplegar Tablero" : "Establecer Vínculo")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccessGuard;