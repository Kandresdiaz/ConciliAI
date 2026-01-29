
# 📑 ConciliAI: Guía de Persistencia y Negocio

Esta aplicación implementa un modelo de **Freemium Contable** donde el valor reside en el historial.

---

## 💎 Modelo de Persistencia Selectiva

| Plan | Almacenamiento | Límite IA | Saldo Automático |
| :--- | :--- | :--- | :--- |
| **FREE** | Volátil (RAM) | 50 Transacciones | Manual |
| **PRO ($25)** | Supabase Histórico | Ilimitado | Precarga automática |

### Lógica de Saldos PRO
Cuando un usuario PRO inicia sesión, el sistema ejecuta:
```sql
SELECT final_bank_balance FROM conciliations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1;
```
Este valor se inyecta automáticamente como el **Saldo Inicial** del nuevo periodo, eliminando errores de transcripción humana.

---

## 🛠️ Configuración de Supabase (Actualización v2)

Ejecuta el nuevo archivo `database.sql` para habilitar:
1. **Perfiles de Usuario:** Vinculación de suscripciones.
2. **RLS Basado en Tier:** Solo los usuarios con `tier = 'PRO'` pueden realizar `INSERT` en la tabla de conciliaciones.
3. **Trigger de Perfil:** Se crea automáticamente un perfil `FREE` para cada nuevo usuario registrado en Auth.

---

## 🔒 Seguridad de Datos PRO
*   **Aislamiento:** Cada fila de conciliación está protegida por políticas RLS de Postgres, asegurando que un usuario nunca pueda ver datos de otro.
*   **Bóveda JSON:** Los detalles de las transacciones se guardan en una columna `JSONB` indexada para búsquedas ultra-rápidas en el historial.

---

## 🔌 Integración con Google (Producción)

### Autenticación y Seguridad
La aplicación utiliza **Supabase Auth** con el proveedor de Google para gestionar identidades de forma segura.
- **Protocolo:** OAuth 2.0.
- **Persistencia:** Los tokens de sesión se manejan automáticamente (JWT).

### Flujo de Usuarios (Freemium)
El sistema distingue automáticamente entre usuarios mediante Triggers de Base de Datos:
1. **Nuevo Usuario:** Al registrarse con Google, se dispara un trigger `handle_new_user`.
2. **Perfil Automático:** Se crea una entrada en `public.profiles` con `tier = 'FREE'`.
3. **Restricciones:** El frontend lee este `tier` para bloquear/desbloquear funciones (ej. Historial).

### Despliegue en Vercel
Para que la autenticación funcione en producción (Vercel):
1. Agregar la URL de producción a **Site URL** en Supabase Auth.
2. Añadir la URL de redirección (ej. `https://tu-app.vercel.app/**`) en la lista de **Redirect URLs**.

---

## ❓ Solución de Problemas Comunes (Auth)

### Error: "Error de conexión: Cliente Supabase no inicializado"
- **Causa:** Las variables de entorno no están configuradas en Vercel.
- **Solución:** Revisa que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén en *Settings > Environment Variables* de Vercel.

### Error: "Redirect URL mismatch" o similar
- **Causa:** La URL de tu sitio en Vercel no está autorizada en Supabase.
- **Solución:**
    1. Ve a Supabase > Authentication > URL Configuration.
    2. En **Site URL**, pon tu dominio principal (ej. `https://conciliai.vercel.app`).
    3. En **Redirect URLs**, añade `https://conciliai.vercel.app/**`.
    4. **IMPORTANTE:** Si usas un dominio custom, añádelo también.

### Error: Google Auth no abre o da error 400
- **Causa:** No has habilitado Google como proveedor.
- **Solución:**
    1. Ve a Supabase > Authentication > Providers > Google.
    2. Asegúrate de que esté **Enabled**.
    3. Verifica que hayas puesto el Client ID y Secret obtenidos de Google Cloud Console.

---

## 🚀 Guía de Configuración Producción (Paso a Paso)

Sigue estos pasos para conectar todo en Vercel.

### 1. Variables de Entorno (Vercel)
Ve a tu proyecto en Vercel > Settings > Environment Variables y agrega las siguientes:

| Variable | Descripción | Dónde conseguirla |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | Supabase > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Clave pública de Supabase | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Clave secreta** (Server-side) | Supabase > Settings > API (Service Role) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe | Stripe > Developers > API Keys |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | Stripe > Developers > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Secreto del Webhook | Stripe > Developers > Webhooks (ver paso 2) |
| `GEMINI_API_KEY` | API Key de Google AI | Google AI Studio |

### 2. Configurar Webhook de Stripe
1. Ve a **Stripe Dashboard > Developers > Webhooks**.
2. Dale a **+ Add Endpoint**.
3. **Endpoint URL:** `https://tudominio.vercel.app/api/stripe-webhook`
4. **Events to send:** Selecciona estos eventos:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
5. Dale a "Add endpoint".
6. Copia el **Signing secret** (whsec_...) y ponlo en la variable `STRIPE_WEBHOOK_SECRET` en Vercel.

### 3. Base de Datos (Supabase)
Conecta Supabase con Stripe ejecutando el script `database.sql` en el **SQL Editor** de Supabase. Esto creará:
- Tabla `profiles` (para guardar quién es PRO).
- Tabla `conciliations` (para guardar el historial).
- Triggers para crear usuarios automáticamente.

