
import React, { useState, useMemo, useEffect } from 'react';
import {
  Transaction,
  TransactionSource,
  TransactionStatus,
  AccountSummary,
  ImportBatch,
  UserTier
} from './types';
import { findSmartMatches } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { ImportModal } from './components/ImportModal';
import { LoginScreen } from './components/LoginScreen';
import { LandingPage } from './components/LandingPage';
import { SecurityAgreementModal } from './components/SecurityAgreementModal';
import { PricingModal } from './components/PricingModal';
import {
  Sparkles, PlusCircle, LayoutDashboard, ArrowRightLeft,
  FileCheck, Download, LogOut, Lock, ShieldCheck, Zap,
  Linkedin, Send, Menu, X, MessageSquare, History,
  CheckCircle2
} from 'lucide-react';

const formatCOP = (amount: number) => {
  return amount.toLocaleString('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 2
  });
};

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSecurityAccepted, setIsSecurityAccepted] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<UserTier>(UserTier.FREE);
  const [reconciliationsCount, setReconciliationsCount] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState(10);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reconcile' | 'report' | 'history'>('dashboard');

  const [showPricing, setShowPricing] = useState(false);
  const [initialBankBalance, setInitialBankBalance] = useState(0);
  const [initialLedgerBalance, setInitialLedgerBalance] = useState(0);
  const [companyName, setCompanyName] = useState('EMPRESA S.A.S');

  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);

  // PROTECCIÓN ANTICOPY GLOBAL
  useEffect(() => {
    const handleContext = (e: MouseEvent) => e.preventDefault();
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey && (e.key === 'c' || e.key === 'p' || e.key === 's' || e.key === 'u')) || e.key === 'F12') {
        e.preventDefault();
        showToast("Acción protegida por seguridad de auditoría", "error");
      }
    };
    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) handleLoginSuccess(session.user);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session) handleLoginSuccess(session.user);
        else setIsAuthenticated(false);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleLoginSuccess = (user: any) => {
    setUser(user);
    setIsAuthenticated(true);
    setShowLanding(false);
    setIsDemoMode(false);
    fetchProfile(user.id);
  };

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile) {
      setTier(profile.tier as UserTier);
      setReconciliationsCount(profile.reconciliations_count || 0);
      setCreditsRemaining(profile.credits_remaining || 10);
    }
  };

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const stats = useMemo(() => {
    const bankT = transactions.filter(t => t.source === TransactionSource.BANK);
    const ledgerT = transactions.filter(t => t.source === TransactionSource.LEDGER);
    const bNet = bankT.reduce((acc, t) => acc + t.amount, 0);
    const lNet = ledgerT.reduce((acc, t) => acc + t.amount, 0);
    const fBank = initialBankBalance + bNet;
    const fLedger = initialLedgerBalance + lNet;
    return { finalBank: fBank, finalLedger: fLedger, diff: fBank - fLedger };
  }, [transactions, initialBankBalance, initialLedgerBalance]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">C</div>
        <span className="font-black text-xl tracking-tight">Concili<span className="text-indigo-600">AI</span></span>
      </div>

      <nav className="flex-1 space-y-1">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'reconcile', label: 'Partidas', icon: ArrowRightLeft },
          { id: 'report', label: 'Acta Final', icon: FileCheck },
          { id: 'history', label: 'Historial', icon: History, pro: true }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.pro && tier !== UserTier.PRO) setShowPricing(true);
              else { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }
            }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl font-bold' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-4"><item.icon size={20} /> <span className="text-sm">{item.label}</span></div>
            {item.pro && tier !== UserTier.PRO && <Lock size={14} className="opacity-40" />}
          </button>
        ))}
      </nav>

      <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Comunidad & Ayuda</p>
        <div className="grid grid-cols-2 gap-3 px-2">
          <a href="https://www.linkedin.com/in/kevin-diaz-192873177" target="_blank" className="flex flex-col items-center justify-center p-3 bg-slate-50 border rounded-2xl hover:border-indigo-200 hover:text-indigo-600 transition-all group">
            <Linkedin size={20} className="mb-1" />
            <span className="text-[9px] font-bold">Oficina</span>
          </a>
          <a href="https://t.me/+6BPWuN0P63kxODdh" target="_blank" className="flex flex-col items-center justify-center p-3 bg-slate-50 border rounded-2xl hover:border-sky-200 hover:text-sky-600 transition-all group">
            <Send size={20} className="mb-1" />
            <span className="text-[9px] font-bold">Comunidad</span>
          </a>
        </div>
        <p className="text-[8px] text-center text-slate-400 font-bold leading-tight px-2 italic">Feedback directo con el creador.</p>
      </div>

      <div className="pt-6 border-t mt-auto space-y-4">
        <div className="p-4 bg-slate-900 text-white rounded-2xl">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{tier} PLAN</span>
            {tier === UserTier.FREE && <span className="text-[9px] font-bold">{reconciliationsCount}/5</span>}
          </div>
          <p className="text-xs font-bold truncate">{user?.email || 'Demo User'}</p>
        </div>
        <button onClick={() => window.location.reload()} className="w-full flex items-center gap-4 p-4 text-slate-400 hover:text-red-500 font-bold text-sm">
          <LogOut size={20} /> Salir
        </button>
      </div>
    </div>
  );

  if (showLanding) return <LandingPage onStart={() => setShowLanding(false)} onDemo={() => { setShowLanding(false); setIsAuthenticated(true); setIsDemoMode(true); }} />;
  if (!isAuthenticated && !isDemoMode) return <LoginScreen />;
  if (!isSecurityAccepted && !isDemoMode) return <SecurityAgreementModal onAccept={() => setIsSecurityAccepted(true)} />;

  return (
    <div className={`flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden ${tier === UserTier.FREE ? 'is-free-user' : ''}`}>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}><SidebarContent /></div>
        </div>
      )}

      <aside className="hidden lg:flex w-72 bg-white border-r flex-col print:hidden"><SidebarContent /></aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b p-4 lg:p-6 flex justify-between items-center print:hidden shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"><Menu size={24} /></button>
            <h1 className="text-lg lg:text-xl font-black capitalize">{activeTab}</h1>
          </div>
          <button onClick={() => setImportModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs lg:text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all">
            <PlusCircle size={18} /> <span>Importar</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8 no-copy">
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-8 lg:p-16 rounded-[3rem] shadow-2xl border border-slate-100 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="w-full md:w-auto text-center md:text-left">
                    <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="text-2xl lg:text-4xl font-black text-slate-950 border-b-2 border-transparent focus:border-indigo-100 outline-none w-full bg-transparent" placeholder="Nombre de la Empresa" />
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2">Panel de Auditoría Activo</p>
                  </div>
                  <div className="bg-slate-950 text-white px-10 py-8 rounded-[2.5rem] text-center shadow-2xl w-full md:w-auto">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Diferencia Neta</span>
                    <p className={`text-3xl lg:text-5xl font-black mt-1 ${Math.abs(stats.diff) > 0.1 ? 'text-red-400' : 'text-emerald-400'}`}>{formatCOP(stats.diff)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 relative">
                  <div className="hidden md:block absolute left-1/2 inset-y-0 w-px bg-slate-100" />
                  <div className="space-y-6">
                    <h3 className="flex items-center gap-3 font-black uppercase text-[10px] text-slate-400 tracking-widest"><ShieldCheck size={16} /> Bancos</h3>
                    <CalcRow label="Saldo Anterior" value={initialBankBalance} onChange={setInitialBankBalance} isInput />
                    <CalcRow label="Saldo Final" value={stats.finalBank} isFinal />
                  </div>
                  <div className="space-y-6">
                    <h3 className="flex items-center gap-3 font-black uppercase text-[10px] text-slate-400 tracking-widest"><FileCheck size={16} /> Libros</h3>
                    <CalcRow label="Saldo Anterior" value={initialLedgerBalance} onChange={setInitialLedgerBalance} isInput />
                    <CalcRow label="Saldo Final" value={stats.finalLedger} isFinal />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reconcile' && (
            <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-8">
              <TablePanel title="Partidas de Banco" transactions={transactions.filter(t => t.source === TransactionSource.BANK)} color="indigo" />
              <TablePanel title="Partidas de Libros" transactions={transactions.filter(t => t.source === TransactionSource.LEDGER)} color="emerald" />
            </div>
          )}

          {activeTab === 'report' && (
            <div className="max-w-4xl mx-auto pb-24">
              <div className="flex flex-col sm:flex-row justify-center mb-10 gap-4 print:hidden px-4">
                <button onClick={() => setShowPricing(true)} className="flex-1 bg-indigo-600 text-white px-8 py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95">
                  <Lock size={18} /> Guardar (PRO)
                </button>
                <button onClick={() => window.print()} className="flex-1 bg-slate-950 text-white px-8 py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95">
                  <Download size={18} /> Imprimir Acta
                </button>
              </div>

              <div id="report-to-export" className="bg-white p-12 lg:p-24 rounded-[4rem] border shadow-2xl relative space-y-16 overflow-hidden">
                {tier === UserTier.FREE && (
                  <div className="watermark-free">
                    {Array(20).fill(0).map((_, i) => (
                      <div key={i} className="watermark-text">BORRADOR NO CERTIFICADO - CONCILIAI FREE</div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-start border-b pb-12">
                  <div><h2 className="text-3xl lg:text-5xl font-black tracking-tight">{companyName}</h2><p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mt-3">Acta Oficial de Conciliación Bancaria</p></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                  <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen Banco</h4><p className="text-3xl font-black">{formatCOP(stats.finalBank)}</p></div>
                  <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen Libros</h4><p className="text-3xl font-black">{formatCOP(stats.finalLedger)}</p></div>
                </div>
                <div className="pt-32 grid grid-cols-2 gap-32 relative">
                  <div className="border-t-2 border-slate-900 pt-6"><p className="text-sm font-black uppercase">Firma Auditor Responsable</p></div>
                  <div className="border-t-2 border-slate-200 pt-6"><p className="text-sm font-black uppercase text-slate-300">Certificación Digital</p></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>


      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} currentTier={tier} />

      {toast && <div className="fixed bottom-6 right-6 bg-slate-950 text-white px-8 py-5 rounded-3xl shadow-2xl font-black z-[1000] animate-in slide-in-from-bottom duration-300">{toast.msg}</div>}

      {/* MODAL RENDERIZADO CONDICIONALMENTE: Solo existe si isImportModalOpen es true */}
      {isImportModalOpen && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={(txs, sum, file, exp) => {
            setTransactions(prev => [...prev, ...txs.map(t => ({ ...t, id: Math.random().toString(36).substring(7), status: TransactionStatus.PENDING } as Transaction))]);
            setInitialBankBalance(sum?.initialBalance || initialBankBalance);
            setImportModalOpen(false);
            showToast("Movimientos importados");
          }}
          activeBatches={batches}
          onDeleteBatch={(id) => {
            setBatches(prev => prev.filter(b => b.id !== id));
            setTransactions(prev => prev.filter(t => t.batchId !== id));
          }}
          userTier={tier}
          creditsRemaining={creditsRemaining}
          userId={user?.id || null}
        />
      )}
    </div>
  );
};

const CalcRow = ({ label, value, isInput, onChange, isFinal }: any) => (
  <div className={`flex justify-between items-center p-6 rounded-3xl border transition-all ${isFinal ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100 shadow-sm'}`}>
    <span className="text-[10px] lg:text-[11px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
    {isInput ? (
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="bg-slate-50 px-4 py-2 rounded-xl text-right font-black outline-none w-32 focus:ring-2 focus:ring-indigo-100" />
    ) : (
      <span className={`font-black ${isFinal ? 'text-2xl text-slate-950' : 'text-slate-600'}`}>{formatCOP(value)}</span>
    )}
  </div>
);

const TablePanel = ({ title, transactions, color }: any) => (
  <div className="bg-white rounded-[2.5rem] border shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
    <div className={`p-6 bg-${color}-50 border-b font-black text-xs text-${color}-600 uppercase tracking-widest`}>{title}</div>
    <div className="flex-1 overflow-x-auto">
      {transactions.length === 0 ? <div className="p-20 text-center text-slate-300 italic">Sin datos cargados</div> : (
        <table className="w-full text-xs min-w-[500px]">
          <thead className="sticky top-0 bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest border-b">
            <tr><th className="p-5 text-left">Fecha</th><th className="p-5 text-left">Concepto</th><th className="p-5 text-right">Monto</th></tr>
          </thead>
          <tbody>
            {transactions.map((t: any) => (
              <tr key={t.id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="p-5 font-bold text-slate-400">{t.date}</td>
                <td className="p-5 font-bold text-slate-800 truncate max-w-[200px]">{t.description}</td>
                <td className={`p-5 font-black text-right ${t.amount < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatCOP(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

export default App;
