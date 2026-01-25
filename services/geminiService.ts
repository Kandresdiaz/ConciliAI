
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionSource, MatchSuggestion, TransactionStatus, ImportResult } from "../types";

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonResponse = (text: string) => {
  if (!text) return '{}';
  let cleaned = text.trim();
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    } else {
      cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
    }
  }
  return cleaned;
};

const SYSTEM_INSTRUCTION = `Actúa como un Auditor Contable experto en procesamiento de extractos bancarios colombianos (Bancolombia, etc.).

TU MISIÓN: Extraer el CUADRO DE RESUMEN y el LISTADO DE MOVIMIENTOS.

REGLAS DE ORO PARA EL CUADRO DE RESUMEN:
1. Busca etiquetas exactas como: "SALDO ANTERIOR", "TOTAL ABONOS", "TOTAL CARGOS", "SALDO ACTUAL", "NUEVO SALDO".
2. "SALDO ANTERIOR" -> initialBalance (Ej: 1359797.86)
3. "SALDO ACTUAL" o "NUEVO SALDO" -> finalBalance (Ej: 442076.08)
4. "TOTAL ABONOS" -> totalCredits
5. "TOTAL CARGOS" -> totalDebits

REGLAS PARA MOVIMIENTOS:
1. Extrae: Fecha (formato YYYY-MM-DD), Descripción (ej: TRANSFERENCIA), Monto (Número).
2. MUY IMPORTANTE: Los montos que reduzcan el saldo (Cargos, Retiros, Pagos, Intereses Pagados) DEBEN ser negativos.
3. Los montos que aumenten el saldo (Abonos, Consignaciones, Transferencias recibidas) DEBEN ser positivos.

FORMATO DE SALIDA (JSON ESTRICTO):
{
  "summary": {
    "initialBalance": 0,
    "totalCredits": 0,
    "totalDebits": 0,
    "finalBalance": 0
  },
  "transactions": [
    { "date": "YYYY-MM-DD", "description": "TEXTO", "amount": 0.00 }
  ]
}`;

export const parseBankStatementText = async (rawText: string, source: TransactionSource): Promise<ImportResult> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Analiza el siguiente extracto y extrae los saldos y movimientos:\n\n${rawText}` }] }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const cleanedText = cleanJsonResponse(response.text || '');
    const data = JSON.parse(cleanedText);
    
    return { 
      summary: data.summary || null, 
      transactions: (data.transactions || []).map((item: any) => ({
        ...item,
        source,
        status: TransactionStatus.PENDING
      }))
    };
  } catch (error) {
    console.error("Error IA (Texto):", error);
    throw new Error("No se pudieron procesar los datos del texto.");
  }
};

export const parseBankStatementDocument = async (base64Full: string, mimeType: string, source: TransactionSource): Promise<ImportResult> => {
  const ai = getAiClient();
  const base64Data = base64Full.split(',')[1] || base64Full;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { text: "Escanea la imagen adjunta. Identifica específicamente el cuadro de SALDO ANTERIOR y SALDO ACTUAL. Luego extrae todos los movimientos de la tabla inferior." },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const cleanedText = cleanJsonResponse(response.text || '');
    const data = JSON.parse(cleanedText);
    
    return { 
      summary: data.summary || null,
      transactions: (data.transactions || []).map((item: any) => ({
        ...item,
        source,
        status: TransactionStatus.PENDING
      }))
    };
  } catch (error) {
    console.error("Error IA (Documento):", error);
    throw new Error("Error procesando el documento. Asegúrate de que la tabla de saldos sea legible.");
  }
};

export const findSmartMatches = async (bankTransactions: Transaction[], ledgerTransactions: Transaction[]): Promise<MatchSuggestion[]> => {
  const ai = getAiClient();
  const bankData = bankTransactions.map(t => ({ id: t.id, d: t.description, a: t.amount, date: t.date }));
  const ledgerData = ledgerTransactions.map(t => ({ id: t.id, d: t.description, a: t.amount, date: t.date }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ 
        parts: [{ 
          text: `Realiza el cruce de estas dos fuentes:\nBANCO: ${JSON.stringify(bankData)}\nLIBROS: ${JSON.stringify(ledgerData)}` 
        }] 
      }],
      config: {
        systemInstruction: "Tu tarea es encontrar coincidencias entre movimientos de banco y libros. Devuelve un JSON: [{ \"bId\": \"id_banco\", \"lId\": \"id_libro\", \"r\": \"razón del cruce\" }].",
        responseMimeType: "application/json",
      }
    });

    const cleanedText = cleanJsonResponse(response.text || '');
    const matches = JSON.parse(cleanedText);
    return (Array.isArray(matches) ? matches : []).map((m: any) => ({
      bankId: m.bId,
      ledgerId: m.lId,
      confidence: 1,
      reason: m.r || "Cruce automático"
    }));
  } catch (error) {
    return [];
  }
};
