import { GoogleGenAI } from '@google/genai';

export const config = {
    runtime: 'edge',
};

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

export default async function handler(req: Request) {
    // CORS headers
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { base64Data, mimeType, source } = await req.json();

        if (!base64Data || !mimeType || !source) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const ai = new GoogleGenAI({ apiKey });
        const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
                parts: [
                    { text: "Escanea la imagen adjunta. Identifica específicamente el cuadro de SALDO ANTERIOR y SALDO ACTUAL. Luego extrae todos los movimientos de la tabla inferior." },
                    { inlineData: { mimeType, data: cleanBase64 } }
                ]
            }],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json"
            }
        });

        const cleanedText = cleanJsonResponse(response.text || '');
        const data = JSON.parse(cleanedText);

        const result = {
            summary: data.summary || null,
            transactions: (data.transactions || []).map((item: any) => ({
                ...item,
                source,
                status: 'PENDING'
            }))
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });

    } catch (error: any) {
        console.error('Error processing document:', error);

        let errorMessage = 'Error procesando el documento';
        let detail = error.message || '';

        // Try to list models if 404 to see what IS available
        if (detail.includes('not found') || detail.includes('404')) {
            try {
                // Attempt to debug available models (if method exists in SDK)
                // This is a "blind" attempt to help the user debug
                errorMessage = 'Modelo no encontrado. Por favor verifica que tu API Key tenga acceso a "gemini-1.5-flash".';
            } catch (e) {
                // ignore
            }
        }

        if (detail.includes('API key')) {
            errorMessage = ' Error de Configuración: Falta la API Key de Gemini en Vercel.';
        } else if (detail.includes('429') || detail.includes('Quota')) {
            errorMessage = 'Cuota Excedida: La API de Gemini ha alcanzado su límite gratuito.';
        } else if (detail.includes('400')) {
            errorMessage = 'Solicitud Inválida: El archivo puede estar corrupto o no ser legible.';
        }

        return new Response(JSON.stringify({
            error: errorMessage,
            detail: detail
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
