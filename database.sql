
-- 1. Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Perfiles: Controla si el usuario pagó los $25 (Tier PRO) y su uso
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  tier TEXT DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO')),
  reconciliations_count INTEGER DEFAULT 0, -- Conteo para el plan FREE
  last_reconciliation_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Conciliaciones: El historial contable
CREATE TABLE public.conciliations (
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
CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Políticas para Conciliaciones (El corazón de tu negocio)
-- Solo permitimos insertar si el usuario es PRO
CREATE POLICY "Usuarios PRO pueden guardar historial" 
ON public.conciliations FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND tier = 'PRO'
  )
);

CREATE POLICY "Usuarios pueden ver su propio historial" 
ON public.conciliations FOR SELECT 
USING (auth.uid() = user_id);

-- 5. Trigger: Crear perfil automáticamente al registrarse en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, tier, reconciliations_count)
  VALUES (new.id, new.email, 'FREE', 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
