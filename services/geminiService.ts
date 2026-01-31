
import { Transaction, TransactionSource, MatchSuggestion, ImportResult } from "../types";

// For development, use localhost. In production, Vercel will use same domain
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const parseBankStatementDocument = async (base64Full: string, mimeType: string, source: TransactionSource): Promise<ImportResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/process-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data: base64Full,
        mimeType,
        source
      })
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json();
        const fullMessage = errorData.detail ? `${errorData.error}: ${errorData.detail}` : (errorData.error || 'Error procesando el documento');
        throw new Error(fullMessage);
      } else {
        const text = await response.text();
        console.error("Non-JSON error response:", text.substring(0, 200));
        throw new Error(`Error del servidor (${response.status}). Por favor, intenta de nuevo más tarde.`);
      }
    }

    if (!isJson) {
      throw new Error("El servidor no devolvió una respuesta válida (se esperaba JSON).");
    }

    const result = await response.json();
    return {
      summary: result.summary || null,
      transactions: result.transactions || []
    };
  } catch (error: any) {
    console.error("Error procesando documento:", error);
    throw new Error(error.message || "Error al procesar el documento con IA.");
  }
};

// This function is kept client-side for now but could be moved to API if needed
export const findSmartMatches = async (bankTransactions: Transaction[], ledgerTransactions: Transaction[]): Promise<MatchSuggestion[]> => {
  // For now, return empty array. This can be implemented later as an API endpoint
  console.log('Smart matching not implemented yet');
  return [];
};
