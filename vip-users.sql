-- =====================================================
-- SCRIPT: Gestión de Usuarios VIP/Lifetime
-- =====================================================
-- Usa este script para dar acceso ilimitado a usuarios específicos

-- =====================================================
-- 1. CREAR TIER "LIFETIME" (Ejecutar solo una vez)
-- =====================================================
-- Actualizar el constraint para incluir LIFETIME
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_tier_check,
  ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE', 'LIFETIME'));

-- =====================================================
-- 2. CREAR USUARIOS VIP/LIFETIME
-- =====================================================

-- Opción A: Dar acceso LIFETIME a usuario por email
UPDATE public.profiles
SET 
  tier = 'LIFETIME',
  credits_remaining = 999999,  -- Créditos "ilimitados"
  updated_at = NOW()
WHERE email = 'usuario_vip@example.com';

-- Opción B: Dar acceso LIFETIME a múltiples usuarios
UPDATE public.profiles
SET 
  tier = 'LIFETIME',
  credits_remaining = 999999,
  updated_at = NOW()
WHERE email IN (
  'amigo1@example.com',
  'amigo2@example.com',
  'cliente_especial@example.com'
);

-- Opción C: Dar acceso LIFETIME a TI MISMO (tu email de Google)
UPDATE public.profiles
SET 
  tier = 'LIFETIME',
  credits_remaining = 999999,
  updated_at = NOW()
WHERE email = 'tu_email@gmail.com'; -- ← Cambia esto por tu email

-- =====================================================
-- 3. CREAR FUNCIÓN PARA USUARIOS LIFETIME (Opcional)
-- =====================================================
-- Esta función evita que usuarios LIFETIME gasten créditos

CREATE OR REPLACE FUNCTION public.deduct_credits(page_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  user_tier TEXT;
BEGIN
  -- Obtener créditos y tier del usuario autenticado
  SELECT credits_remaining, tier INTO current_credits, user_tier
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Si es LIFETIME o ENTERPRISE, no deducir créditos
  IF user_tier IN ('LIFETIME', 'ENTERPRISE') THEN
    RETURN TRUE;
  END IF;
  
  -- Validar que haya suficientes créditos
  IF current_credits < page_count THEN
    RAISE EXCEPTION 'Insufficient credits. You have % credits but need %.', current_credits, page_count;
  END IF;
  
  -- Deducir créditos solo para FREE y PRO
  UPDATE public.profiles
  SET 
    credits_remaining = credits_remaining - page_count,
    total_processed_pages = total_processed_pages + page_count
  WHERE id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. VERIFICAR USUARIOS VIP
-- =====================================================
-- Ver todos los usuarios LIFETIME
SELECT 
  email, 
  tier, 
  credits_remaining, 
  total_processed_pages,
  updated_at
FROM public.profiles
WHERE tier = 'LIFETIME'
ORDER BY updated_at DESC;

-- =====================================================
-- 5. QUITAR ACCESO LIFETIME (Si es necesario)
-- =====================================================
-- Downgrade de usuario LIFETIME a FREE
UPDATE public.profiles
SET 
  tier = 'FREE',
  credits_remaining = 10,
  updated_at = NOW()
WHERE email = 'usuario_a_downgrade@example.com';

-- =====================================================
-- 6. ESTADÍSTICAS DE USO
-- =====================================================
-- Ver cuántos usuarios hay por tier
SELECT 
  tier, 
  COUNT(*) as total_users,
  SUM(total_processed_pages) as total_pages_processed
FROM public.profiles
GROUP BY tier
ORDER BY 
  CASE tier
    WHEN 'LIFETIME' THEN 1
    WHEN 'ENTERPRISE' THEN 2
    WHEN 'PRO' THEN 3
    WHEN 'FREE' THEN 4
  END;
