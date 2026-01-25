
import { createClient } from '@supabase/supabase-js';

// Función segura para obtener variables de entorno sin causar ReferenceError
const getEnvVar = (name: string): string => {
  try {
    // Intentamos acceder a través de globalThis para máxima compatibilidad
    const process = (globalThis as any).process;
    return process?.env?.[name] || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Exportamos el cliente instanciado o null si no hay configuración válida
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
