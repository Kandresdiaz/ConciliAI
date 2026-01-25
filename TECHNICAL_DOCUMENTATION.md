
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
