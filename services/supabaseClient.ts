
import { createClient } from '@supabase/supabase-js';

// Función segura para obtener variables de entorno sin causar ReferenceError
// Función para obtener variables de entorno compatibles con Vite y Node
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[`VITE_${key}`] || import.meta.env[key] || '';
  }
  try {
    return process.env[key] || process.env[`VITE_${key}`] || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
