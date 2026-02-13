import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
  const origin = window.location.origin;
  const target = `${origin}?admin=true`;
  
  // ESTO ES CLAVE: Verlo en la consola de Vercel (F12) antes de que se vaya a Google
  console.log("DEBUG - Origin:", origin);
  console.log("DEBUG - Target Redirect:", target);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: target,
      // Añadimos esto para forzar que el usuario siempre elija cuenta 
      // y ver si el error persiste
      queryParams: {
        prompt: 'select_account'
      }
    }
  });
  if (error) console.error("Error en OAuth:", error.message);
};

  return (
    <div className="h-screen w-screen bg-[#060608] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0e0e12] border border-white/10 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Bienvenido</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-10 italic">Ingresa para gestionar tu Red Sináptica</p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${loading
              ? 'bg-slate-800 text-slate-500 cursor-wait'
              : 'bg-white text-black hover:bg-slate-200'
            }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          )}
          {loading ? "Conectando con Supabase..." : "Entrar con Google"}
        </button>

        {loading && (
          <p className="mt-4 text-[8px] text-indigo-400 font-bold uppercase animate-pulse">
            Estableciendo vínculo con el servidor...
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;