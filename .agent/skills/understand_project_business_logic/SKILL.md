---
name: Understand Project Business Logic
description: Essential context about ConciliAI's Freemium model, persistence strategy, and security. Read this to understand how data is handled for FREE vs PRO users.
---

# 📑 ConciliAI: Contexto de Negocio y Técnica

Usa esta habilidad para entender las reglas fundamentales del negocio y la persistencia de datos en ConciliAI.

## 💎 Modelo de Negocio (Freemium Contable)

El valor central reside en el **historial de conciliaciones**.

| Plan | Almacenamiento | Límite IA | Saldo Automático |
| :--- | :--- | :--- | :--- |
| **FREE** | Volátil (RAM - no se guarda en DB) | 50 Transacciones | Manual (usuario ingresa saldo inicial) |
| **PRO ($25)** | Supabase Histórico (Persistente) | Ilimitado | Precarga automática del último saldo |

### Lógica de Saldos PRO
Cuando un usuario PRO inicia sesión o comienza una nueva conciliación:
1. El sistema busca el último saldo final guardado:
   ```sql
   SELECT final_bank_balance FROM conciliations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1;
   ```
2. Este valor se usa automáticamente como **Saldo Inicial** del nuevo periodo.

## 🛠️ Configuración de Base de Datos (Supabase)

1. **Perfiles (Profiles):** Vinculan usuarios de Auth con su nivel de suscripción (`tier`).
2. **Trigger Automático:** Al registrarse un usuario, se crea un perfil con `tier = 'FREE'`.
3. **Seguridad (RLS):**
   - **FREE:** No tiene permisos de INSERT en la tabla `conciliations` (su data no llega a la DB).
   - **PRO:** Tiene permiso de INSERT en `conciliations` si `tier = 'PRO'`.
   - **Lectura:** Los usuarios solo ven sus propias filas.

## 🔒 Estructura de Datos
- **Tabla `conciliations`:** Guarda el resumen y metadatos.
- **Detalle de Transacciones (Bóveda JSON):** Los detalles línea por línea se guardan en una columna `JSONB` dentro de la misma tabla o una relacionada, optimizada para búsquedas.

---
**Instrucciones para el Agente:**
- Cuando se te pida implementar features de guardado, verifica siempre el `tier` del usuario.
- Si el usuario es FREE, la persistencia debe ser en el estado local del cliente (Context/Redux/State) y perderse al recargar.
- Si el usuario es PRO, usa las funciones de Supabase para persistir.
