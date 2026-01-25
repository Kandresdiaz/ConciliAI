
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, content, mimeType, bankData, ledgerData } = req.body;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let response;

    if (type === 'parse') {
      // Instrucción optimizada: Más técnica y corta para ahorrar tokens
      const systemInstruction = `Rol: Auditor Senior. Tarea: Extraer movimientos financieros y saldo final de documentos. 
      Reglas: 
      1. Formato Bancolombia/ISL. 
      2. Si hay Débito/Crédito, devolver monto neto. 
      3. Ignorar avisos legales. 
      4. JSON estricto.
      Esquema: { "transactions": [{ "date": "ISO", "description": "str", "amount": num }], "summary": { "finalBalance": num } }`;
      
      const prompt = "Analiza y extrae JSON.";

      if (mimeType) {
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: content } }
            ]
          },
          config: { 
            systemInstruction, 
            responseMimeType: "application/json"
          }
        });
      } else {
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: content,
          config: { systemInstruction, responseMimeType: "application/json" }
        });
      }
    } else if (type === 'match') {
      response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Match: B:${JSON.stringify(bankData)} L:${JSON.stringify(ledgerData)}`,
        config: {
          systemInstruction: "Cruzar partidas. Devolver [{bId, lId, r}]. r = razón breve.",
          responseMimeType: "application/json",
        }
      });
    }

    const resultText = response?.text || (type === 'parse' ? '{"transactions":[], "summary": null}' : "[]");
    res.status(200).json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Error IA" });
  }
}
