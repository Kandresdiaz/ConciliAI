import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, Upload, FileSpreadsheet, CreditCard, AlertCircle, Mail, Sparkles, FileText, Camera, RefreshCw, ShieldCheck } from 'lucide-react';
import { parseBankStatementDocument } from '../services/geminiService';
import { Transaction, TransactionSource, AccountSummary, ImportBatch, UserTier } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // Use local worker from public folder to avoid bundling issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: Partial<Transaction>[], summary: AccountSummary | null, filename: string, expectedBalance: number) => void;
  activeBatches: ImportBatch[];
  onDeleteBatch: (batchId: string) => void;
  userTier: UserTier;
  creditsRemaining: number;
  userId: string | null;
}

export const ImportModal: React.FC<Props> = ({ isOpen, onClose, onImport, activeBatches, onDeleteBatch, userTier, creditsRemaining, userId }) => {
  const [activeMethod, setActiveMethod] = useState<'text' | 'file' | 'email' | 'camera'>('file');
  const [targetSource, setTargetSource] = useState<TransactionSource>(TransactionSource.BANK);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preCheckInfo, setPreCheckInfo] = useState<{ pageCount: number, fileName: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [pendingFile, setPendingFile] = useState<{ base64: string, type: string, name: string } | null>(null);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen || activeMethod !== 'camera') {
      stopCamera();
    }
  }, [activeMethod, isOpen]);

  const countPDFPages = async (file: File): Promise<number> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Use standard font loading
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
      }).promise;
      return pdf.numPages;
    } catch (err: any) {
      console.error('Error counting PDF pages:', err);
      // EXPOSE THE REAL ERROR
      throw new Error(`Error PDF: ${err.message || err.name || 'Desconocido'}`);
    }
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreCheckInfo(null);
    setPendingFile(null);

    try {
      // Count pages if PDF
      let pageCount = 1;
      if (file.type === 'application/pdf') {
        pageCount = await countPDFPages(file);
      }

      // Store file data for later processing
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setPendingFile({ base64: base64Data, type: file.type, name: file.name });
      setPreCheckInfo({ pageCount, fileName: file.name });

      // Check credit limits
      if (pageCount > creditsRemaining) {
        setError(`Este archivo tiene ${pageCount} páginas y necesitas ${pageCount} créditos. Solo tienes ${creditsRemaining} disponibles. Actualiza tu plan para continuar.`);
        return;
      }

    } catch (e: any) {
      setError(e.message || "Error al analizar archivo");
    }
  };

  const processFile = async () => {
    if (!pendingFile || !preCheckInfo) return;

    setIsProcessing(true);
    setError(null);
    try {
      // Call deduct_credits RPC if user is authenticated
      if (userId) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL!,
          import.meta.env.VITE_SUPABASE_ANON_KEY!
        );

        const { data, error: rpcError } = await supabase.rpc('deduct_credits', { page_count: preCheckInfo.pageCount });

        if (rpcError) {
          setError(`Error al procesar créditos: ${rpcError.message}`);
          return;
        }
      }

      // Process the file with AI
      const result = await parseBankStatementDocument(pendingFile.base64, pendingFile.type, targetSource);
      onImport(result.transactions, result.summary, pendingFile.name, result.summary?.finalBalance || 0);

      // Clean up
      setPreCheckInfo(null);
      setPendingFile(null);
    } catch (e: any) {
      console.error(e);
      let msg = e.message || "Error al procesar documento";
      if (msg.includes("API key not configured")) {
        msg = "Falta la GEMINI_API_KEY en Vercel. Configúrala en Settings > Env Vars.";
      }
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Permiso de cámara denegado o no disponible.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (creditsRemaining < 1) {
      setError(`No tienes créditos suficientes. Actualiza tu plan.`);
      return;
    }

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const base64Data = canvas.toDataURL('image/jpeg');

    try {
      const result = await parseBankStatementDocument(base64Data, 'image/jpeg', targetSource);
      onImport(result.transactions, result.summary, `Escaneo_${new Date().getTime()}.jpg`, result.summary?.finalBalance || 0);
      stopCamera();
    } catch (e: any) {
      setError(e.message || "Error al procesar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncEmail = async () => {
    setIsProcessing(true);
    setError(null);
    setTimeout(() => {
      setIsProcessing(false);
      setError("Configura el servidor backend para activar Gmail Sync.");
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl flex flex-col my-auto animate-in zoom-in duration-200 overflow-hidden">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Upload className="text-indigo-600" /> Cargar Datos</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={24} className="text-slate-400" /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl">
            <button onClick={() => setTargetSource(TransactionSource.BANK)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-xs transition-all ${targetSource === TransactionSource.BANK ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <CreditCard size={16} /> Banco
            </button>
            <button onClick={() => setTargetSource(TransactionSource.LEDGER)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-xs transition-all ${targetSource === TransactionSource.LEDGER ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
              <FileSpreadsheet size={16} /> Libro
            </button>
          </div>

          <div className="flex gap-6 border-b text-[11px] font-black text-slate-400 uppercase tracking-widest overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button onClick={() => setActiveMethod('file')} className={`pb-4 transition-all ${activeMethod === 'file' ? 'text-indigo-600 border-b-2 border-indigo-600' : ''}`}>Archivo</button>
            <button onClick={() => setActiveMethod('camera')} className={`pb-4 transition-all ${activeMethod === 'camera' ? 'text-indigo-600 border-b-2 border-indigo-600' : ''}`}>Escáner IA</button>
            <button onClick={() => setActiveMethod('email')} className={`pb-4 transition-all ${activeMethod === 'email' ? 'text-indigo-600 border-b-2 border-indigo-600' : ''}`}>Gmail Sync</button>
          </div>

          {activeMethod === 'file' && (
            <>
              <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="h-44 border-2 border-dashed border-slate-200 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                <input type="file" ref={fileInputRef} onChange={handleFileSelection} className="hidden" accept=".pdf,.csv,.xlsx,image/*" />
                {isProcessing ? <Loader2 className="animate-spin text-indigo-600" size={32} /> : <div className="p-4 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform"><FileText size={24} className="text-indigo-400" /></div>}
                <p className="text-xs font-bold text-slate-400">Click para subir PDF o Imagen</p>
              </div>

              {preCheckInfo && !error && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-black text-slate-900">Confirmación de Procesamiento</h4>
                      <p className="text-sm text-slate-600"><strong>{preCheckInfo.fileName}</strong></p>
                      <p className="text-xs font-bold text-indigo-700">📄 {preCheckInfo.pageCount} página{preCheckInfo.pageCount > 1 ? 's' : ''} detectada{preCheckInfo.pageCount > 1 ? 's' : ''}</p>
                      <p className="text-xs font-bold text-slate-600">💳 Consumirá {preCheckInfo.pageCount} crédito{preCheckInfo.pageCount > 1 ? 's' : ''} • Tienes {creditsRemaining} disponibles</p>
                    </div>
                  </div>
                  <button
                    onClick={processFile}
                    disabled={isProcessing}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={18} /> Procesando...</> : 'Procesar Archivo'}
                  </button>
                </div>
              )}
            </>
          )}

          {activeMethod === 'camera' && (
            <div className="relative h-72 bg-slate-950 rounded-[2rem] overflow-hidden flex flex-col items-center justify-center">
              {!isCameraActive ? (
                <div className="p-8 text-center space-y-6 animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-white/40">
                    <Camera size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white font-black">Escáner de Documentos</h4>
                    <p className="text-slate-400 text-xs px-4">Usa la cámara para digitalizar comprobantes físicos en tiempo real.</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    Activar Cámara
                  </button>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <ShieldCheck size={12} /> Privacidad Protegida
                  </p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="absolute inset-0 border-2 border-dashed border-white/20 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-40 border-2 border-indigo-500/40 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.2)]"></div>
                  </div>

                  <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
                    <button
                      onClick={capturePhoto}
                      disabled={isProcessing}
                      className="bg-indigo-600 text-white p-5 rounded-full shadow-2xl hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Camera size={28} />}
                    </button>
                    <button onClick={stopCamera} className="bg-white/10 backdrop-blur-md text-white p-5 rounded-full hover:bg-white/20 transition-all">
                      <X size={28} />
                    </button>
                  </div>
                </>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center z-20">
                  <Loader2 className="animate-spin mb-4 text-indigo-400" size={40} />
                  <p className="font-black text-sm uppercase tracking-widest">IA Extrayendo Movimientos...</p>
                </div>
              )}
            </div>
          )}

          {activeMethod === 'email' && (
            <div className="text-center p-8 space-y-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600"><Mail size={32} /></div>
              <div className="space-y-2">
                <h4 className="font-black text-slate-900">Sincronización Inteligente</h4>
                <p className="text-xs text-slate-400 font-medium">Escanea automáticamente tus correos bancarios.</p>
              </div>
              <button onClick={handleSyncEmail} disabled={isProcessing} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                {isProcessing ? 'Sincronizando...' : 'Conectar Gmail'}
              </button>
            </div>
          )}

          {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-500 flex items-center gap-2 animate-in slide-in-from-top-2"><AlertCircle size={14} /> {error}</div>}
        </div>
      </div>
    </div>
  );
};
