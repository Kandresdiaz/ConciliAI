
-- 1. Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Perfiles: Sistema de 3 niveles con créditos
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  tier TEXT DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE')),
  reconciliations_count INTEGER DEFAULT 0,
  credits_remaining INTEGER DEFAULT 10, -- Sistema de créditos: 1 crédito = 1 página procesada
  total_processed_pages INTEGER DEFAULT 0, -- Tracking de uso total
  last_reconciliation_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Conciliaciones: El historial contable
CREATE TABLE IF NOT EXISTS public.conciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Ej: "2024-05"
  initial_bank_balance NUMERIC DEFAULT 0,
  initial_ledger_balance NUMERIC DEFAULT 0,
  final_bank_balance NUMERIC DEFAULT 0,
  final_ledger_balance NUMERIC DEFAULT 0,
  data JSONB NOT NULL, -- Aquí guardamos el array de transacciones y batches
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Seguridad de Fila (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliations ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Políticas para Conciliaciones (El corazón de tu negocio)
-- Solo permitimos insertar si el usuario es PRO
DROP POLICY IF EXISTS "Usuarios PRO pueden guardar historial" ON public.conciliations;
CREATE POLICY "Usuarios PRO pueden guardar historial" 
ON public.conciliations FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND tier = 'PRO'
  )
);

DROP POLICY IF EXISTS "Usuarios pueden ver su propio historial" ON public.conciliations;
CREATE POLICY "Usuarios pueden ver su propio historial" 
ON public.conciliations FOR SELECT 
USING (auth.uid() = user_id);

-- 5. Trigger: Crear perfil automáticamente al registrarse en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, tier, reconciliations_count, credits_remaining, total_processed_pages)
  VALUES (new.id, new.email, 'FREE', 0, 10, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Función de Deducción de Créditos: PROTECCIÓN DE COSTOS
-- Esta función garantiza que nadie pueda procesar documentos sin créditos disponibles
CREATE OR REPLACE FUNCTION public.deduct_credits(page_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Obtener créditos actuales del usuario autenticado
  SELECT credits_remaining INTO current_credits
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Validar que haya suficientes créditos
  IF current_credits < page_count THEN
    RAISE EXCEPTION 'Insufficient credits. You have % credits but need %.', current_credits, page_count;
  END IF;
  
  -- Deducir créditos y actualizar estadísticas
  UPDATE public.profiles
  SET 
    credits_remaining = credits_remaining - page_count,
    total_processed_pages = total_processed_pages + page_count
  WHERE id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
