import { supabase } from '../lib/supabase';

const Login = () => {
  const handleLogin = () => {
    supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div className="h-screen w-screen bg-[#060608] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0e0e12] border border-white/10 rounded-[3rem] p-12 text-center shadow-2xl">
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Bienvenido</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-10">Ingresa para gestionar tu Red Sináptica</p>
        
        <button 
          onClick={handleLogin}
          className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Entrar con Google
        </button>
      </div>
    </div>
  );
};