
import React from 'react';
import { ShieldCheck, Lock, EyeOff, Server, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  onAccept: () => void;
}

export const SecurityAgreementModal: React.FC<Props> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-indigo-100">
        <div className="p-8 lg:p-10">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <ShieldCheck size={36} />
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">
            Compromiso de <span className="text-indigo-600">Seguridad Bancaria</span>
          </h2>
          
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            Antes de procesar datos financieros sensibles, garantizamos la integridad y confidencialidad de su información mediante protocolos de auditoría de élite.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><Lock size={18} /></div>
              <div>
                <p className="font-bold text-sm text-gray-900">Encriptación de Punto a Punto</p>
                <p className="text-xs text-gray-400">Los datos se transfieren mediante túneles SSL cifrados directamente a la infraestructura de Google Cloud.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><EyeOff size={18} /></div>
              <div>
                <p className="font-bold text-sm text-gray-900">Garantía de Privacidad (No-Training)</p>
                <p className="text-xs text-gray-400">Sus datos bancarios se utilizan exclusivamente para esta sesión y NO alimentan el entrenamiento de la IA.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><Server size={18} /></div>
              <div>
                <p className="font-bold text-sm text-gray-900">Aislamiento de Datos</p>
                <p className="text-xs text-gray-400">Su historial se almacena en una bóveda privada en Supabase con seguridad a nivel de fila (RLS).</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onAccept}
            className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            Aceptar y Continuar <ArrowRight size={22} />
          </button>
          
          <p className="text-center mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <CheckCircle2 size={12} className="text-emerald-500" /> Cumplimiento Normativo GDPR / Ley 1581
          </p>
        </div>
      </div>
    </div>
  );
};
