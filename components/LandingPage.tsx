
import React from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, Linkedin, Send, Zap, ShieldCheck, Lock, BarChart3, Clock, Sparkles } from 'lucide-react';

interface Props {
  onStart: () => void;
  onDemo: () => void;
}

export const LandingPage: React.FC<Props> = ({ onStart, onDemo }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 overflow-x-hidden">
      {/* Navegación */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">C</div>
          <span className="font-black text-2xl tracking-tight">Concili<span className="text-indigo-600">AI</span></span>
        </div>
        <div className="flex gap-4">
          <button onClick={onDemo} className="hidden sm:block text-slate-500 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-slate-50 transition-all">Ver Demo</button>
          <button onClick={onStart} className="bg-indigo-600 text-white px-8 py-2.5 rounded-full font-bold text-sm shadow-xl hover:bg-indigo-700 transition-all active:scale-95" aria-label="Iniciar sesión en ConciliAI">Iniciar Sesión</button>
        </div>
      </nav>

      {/* Hero Section - SEO H1 */}
      <header className="max-w-7xl mx-auto px-6 pt-20 pb-28 text-center animate-fade-in-up">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-10 text-slate-900">
          Conciliación Bancaria <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Automática con IA</span>.
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium mb-14 leading-relaxed">
          La herramienta definitiva para contadores. Automatiza tu auditoría contable sin registros manuales con precisión quirúrgica y seguridad total.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button onClick={onStart} className="w-full sm:w-auto px-12 py-6 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95" aria-label="Empezar a usar ConciliAI gratis">
            Empezar Gratis <ArrowRight size={24} />
          </button>
          <button onClick={onDemo} className="w-full sm:w-auto px-12 py-6 bg-white text-slate-900 border-2 border-slate-100 rounded-3xl font-black text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-4" aria-label="Ver demostración de la aplicación">
            Demo Interactiva
          </button>
        </div>
      </header>

      {/* Características - SEO H2 */}
      <section className="bg-slate-50 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
             <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6">Auditoría contable con superpoderes</h2>
             <p className="text-slate-500 font-medium text-lg">Reportes certificados en PDF y seguridad respaldada por Stripe.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <FeatureCard 
               icon={<Clock className="text-indigo-600" size={32} />}
               title="Velocidad Extrema"
               desc="Procesa extractos de 20 páginas en menos de 5 segundos. Sin errores de transcripción humana."
             />
             <FeatureCard 
               icon={<ShieldCheck className="text-emerald-600" size={32} />}
               title="Datos Blindados"
               desc="Encriptación AES-256. Tus datos se procesan de forma efímera y no alimentan modelos de IA."
             />
             <FeatureCard 
               icon={<Sparkles className="text-violet-600" size={32} />}
               title="IA Gemini Flash"
               desc="Usamos lo último de Google para entender conceptos contables complejos automáticamente."
             />
          </div>
        </div>
      </section>

      {/* FAQ - SEO Semantic Ranking */}
      <section className="py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Preguntas Frecuentes</h2>
            <p className="text-slate-500 font-medium">Resolviendo tus dudas sobre seguridad y funcionamiento.</p>
          </div>
          <div className="space-y-4">
            <FAQItem 
              question="¿Es seguro subir datos financieros a ConciliAI?" 
              answer="Totalmente. Usamos encriptación de extremo a extremo y la tecnología Gemini 3 Flash procesa los datos de forma privada. No almacenamos tus archivos permanentemente a menos que seas usuario Pro." 
            />
            <FAQItem 
              question="¿Qué incluye el Plan Pro de $25 USD?" 
              answer="Acceso ilimitado, guardado de historial en la nube para arrastrar saldos al mes siguiente, reportes certificados con firma digital y soporte prioritario." 
            />
            <FAQItem 
              question="¿Cómo funciona el soporte para usuarios?" 
              answer="Tratamos a todos por igual. Ofrecemos soporte profesional a través de nuestra comunidad en Telegram y conexión directa vía LinkedIn para consultas técnicas." 
            />
            <FAQItem 
              question="¿Tengo garantía de devolución?" 
              answer="Sí. Al usar Stripe como intermediario, tu compra está protegida por estándares globales de seguridad y puedes gestionar tu suscripción en un clic." 
            />
          </div>

          {/* SOPORTE UNIVERSAL LANDING */}
          <div className="mt-28 p-12 bg-indigo-600 rounded-[3rem] text-center shadow-[0_30px_60px_rgba(79,70,229,0.4)] relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-3xl font-black text-white mb-4">¿Necesitas ayuda personalizada?</h3>
                <p className="text-indigo-100 font-medium mb-10 max-w-md mx-auto">Únete a nuestra comunidad o habla directamente conmigo. Tu feedback construye esta herramienta.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                   <a 
                    href="https://t.me/+6BPWuN0P63kxODdh" 
                    target="_blank" 
                    className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-xl"
                    aria-label="Unirse a la comunidad de Telegram"
                   >
                      <Send size={20} /> Comunidad Telegram
                   </a>
                   <a 
                    href="https://www.linkedin.com/in/kevin-diaz-192873177" 
                    target="_blank" 
                    className="bg-indigo-800 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-900 transition-all border border-indigo-500/30"
                    aria-label="Hablar con Kevin Diaz en LinkedIn"
                   >
                      <Linkedin size={20} /> Hablar con el Creador
                   </a>
                </div>
             </div>
             {/* Decoración visual */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 border-t border-slate-100 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
        <div className="flex justify-center gap-8 mb-6">
           <a href="https://www.linkedin.com/in/kevin-diaz-192873177" target="_blank" className="hover:text-indigo-600 transition-all"><Linkedin size={20}/></a>
           <a href="https://t.me/+6BPWuN0P63kxODdh" target="_blank" className="hover:text-indigo-600 transition-all"><Send size={20}/></a>
        </div>
        <p>© 2024 ConciliAI - Desarrollado por Kevin Díaz | Potenciado por Gemini API & Stripe</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
     <div className="mb-6">{icon}</div>
     <h3 className="text-xl font-black text-slate-900 mb-3">{title}</h3>
     <p className="text-slate-500 font-medium text-sm leading-relaxed">{desc}</p>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
  <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all">
    <summary className="flex items-center justify-between p-6 cursor-pointer list-none focus:outline-none">
      <span className="font-black text-slate-800 pr-4">{question}</span>
      <ChevronDown className="text-indigo-600 transition-transform group-open:rotate-180 shrink-0" size={20} />
    </summary>
    <div className="p-6 pt-0 text-slate-500 font-medium leading-relaxed text-sm">
      {answer}
    </div>
  </details>
);
