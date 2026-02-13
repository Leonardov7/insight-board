import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Intentamos el login con un timeout implícito
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          // Aseguramos que regrese a la URL correcta del admin
          redirectTo: window.location.origin + '?admin=true'
        }
      });

      if (error) throw error;
    } catch (error) {
      // Si hay error 522 o de red, esto te avisará en lugar de quedarse congelado
      console.error("Fallo de conexión:", error.message);
      alert("Error de conexión con Supabase (Error 522). El servidor no responde a tiempo. Por favor, revisa tu conexión o intenta en 1 minuto.");
      setLoading(false);
    }
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
          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${
            loading 
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