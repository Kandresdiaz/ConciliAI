import React from 'react';
import { X, CheckCircle2, Zap } from 'lucide-react';
import { UserTier } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentTier: UserTier;
}

export const PricingModal: React.FC<Props> = ({ isOpen, onClose, currentTier }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
            <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 z-10 text-slate-400 hover:text-slate-900 bg-white rounded-full p-2 shadow-lg">
                    <X size={28} />
                </button>

                <div className="p-8 lg:p-12 text-center border-b">
                    <h2 className="text-3xl lg:text-4xl font-black mb-3">Planes de <span className="text-indigo-600">ConciliAI</span></h2>
                    <p className="text-slate-500 font-medium">Transparencia total: 1 crédito = 1 página procesada por IA</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-x">
                    <div className="p-8 lg:p-12 flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black mb-2">Plan Semilla</h3>
                            <p className="text-4xl font-black text-slate-900">$0<span className="text-sm text-slate-400 font-medium">/mes</span></p>
                            <p className="text-xs text-indigo-600 font-bold mt-2">Para probar la magia</p>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1 text-sm">
                            <li className="flex gap-3 items-start"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /><span className="font-bold text-slate-700">10 créditos = 10 páginas al mes</span></li>
                            <li className="flex gap-3 items-start"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /><span className="font-bold text-slate-700">Procesamiento con IA</span></li>
                            <li className="flex gap-3 items-start text-slate-300"><X size={18} className="shrink-0 mt-0.5" /><span className="font-medium">Sin historial en la nube</span></li>
                            <li className="flex gap-3 items-start text-slate-300"><X size={18} className="shrink-0 mt-0.5" /><span className="font-medium">Actas con marca de agua</span></li>
                        </ul>
                        <button disabled={currentTier === UserTier.FREE} className="w-full py-4 bg-slate-200 text-slate-500 rounded-2xl font-black text-sm uppercase tracking-wide disabled:opacity-50">
                            {currentTier === UserTier.FREE ? 'Plan Actual' : 'Empezar'}
                        </button>
                    </div>

                    <div className="p-8 lg:p-12 flex flex-col bg-indigo-50 border-2 border-indigo-200 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wide">Recomendado</div>
                        <div className="mb-8">
                            <h3 className="text-2xl font-black mb-2 text-indigo-900">Plan Pro</h3>
                            <p className="text-4xl font-black text-indigo-600">$25<span className="text-sm text-indigo-400 font-medium">/mes</span></p>
                            <p className="text-xs text-indigo-700 font-bold mt-2">Tu asistente contable de tiempo completo</p>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1 text-sm">
                            <li className="flex gap-3 items-start"><Zap size={18} className="text-indigo-600 shrink-0 mt-0.5" /><span className="font-bold text-slate-800">500 créditos = 500 páginas/mes</span></li>
                            <li className="flex gap-3 items-start"><Zap size={18} className="text-indigo-600 shrink-0 mt-0.5" /><span className="font-bold text-slate-800">Ideal para ~25 clientes mensuales</span></li>
                            <li className="flex gap-3 items-start"><Zap size={18} className="text-indigo-600 shrink-0 mt-0.5" /><span className="font-bold text-slate-800">Historial en la nube ilimitado</span></li>
                            <li className="flex gap-3 items-start"><Zap size={18} className="text-indigo-600 shrink-0 mt-0.5" /><span className="font-bold text-slate-800">Descarga PDF sin marcas de agua</span></li>
                            <li className="flex gap-3 items-start"><Zap size={18} className="text-indigo-600 shrink-0 mt-0.5" /><span className="font-bold text-slate-800">Sello de certificación digital</span></li>
                        </ul>
                        <button onClick={() => window.open('https://buy.stripe.com/conciliai_pro', '_blank')} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-base shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                            Comprar Pro
                        </button>
                    </div>

                    <div className="p-8 lg:p-12 flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black mb-2">Enterprise</h3>
                            <p className="text-4xl font-black text-slate-900">Custom</p>
                            <p className="text-xs text-slate-600 font-bold mt-2">Para Despachos y Firmas de Auditoría</p>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1 text-sm">
                            <li className="flex gap-3 items-start"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /><span className="font-bold text-slate-700">Créditos según necesidad</span></li>
                            <li className="flex gap-3 items-start"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /><span className="font-bold text-slate-700">Soporte prioritario</span></li>
                            <li className="flex gap-3 items-start"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /><span className="font-bold text-slate-700">Contacto directo con el fundador</span></li>
                            <li className="flex gap-3 items-start"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /><span className="font-bold text-slate-700">API personalizada</span></li>
                        </ul>
                        <button onClick={() => window.open('https://www.linkedin.com/in/kevin-diaz-192873177', '_blank')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95">
                            Contactar en LinkedIn
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 text-center border-t">
                    <p className="text-xs text-slate-500 font-medium">💡 <strong>ROI Garantizado:</strong> Si le cobras $10 a cada cliente por conciliación, con Pro generas $250 y solo inviertes $25.</p>
                </div>
            </div>
        </div>
    );
};
