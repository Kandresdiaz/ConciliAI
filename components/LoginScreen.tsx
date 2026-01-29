
import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const LoginScreen: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (!supabase) throw new Error("Error de conexión: Cliente Supabase no inicializado.");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error.message);
      setErrorMsg(error.message || "Error al conectar con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-indigo-100">
            C
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-black text-gray-900 tracking-tight">
          Concili<span className="text-indigo-600">AI</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">
          Acceso Seguro para Contadores y Auditores
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-10 px-4 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] sm:px-10 border border-gray-100">
          <div className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Identifícate para gestionar tus créditos</p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              aria-label="Iniciar sesión con Google para acceder a la plataforma"
              className="w-full flex items-center justify-center gap-3 py-5 px-4 border-2 border-slate-100 rounded-2xl shadow-sm bg-white text-gray-700 font-black hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google Logo" />
              {loading ? 'Conectando...' : 'Entrar con Google'}
            </button>

            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                <span className="shrink-0">⚠️</span>
                {errorMsg}
              </div>
            )}

            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <p className="text-[11px] text-indigo-800 font-bold leading-relaxed text-center uppercase tracking-tight">
                Plan Semilla: 5 conciliaciones mensuales gratis
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
              <ShieldCheck size={16} className="text-indigo-500 shrink-0" />
              <span>Autenticación oficial de Google</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
              <Lock size={16} className="text-indigo-500 shrink-0" />
              <span>Encriptación AES-256 en base de datos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
