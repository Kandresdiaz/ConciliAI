/**
 * ARQUITECTURA BACKEND (Node.js / Express)
 * ---------------------------------------------------------
 * Para desplegar esto necesitas:
 * 1. Un servidor (Render, Railway, Heroku).
 * 2. Una base de datos PostgreSQL (Supabase, Neon).
 * 3. Credenciales de Google Cloud Console (Para Gmail API).
 */

// Fix: Using ESM import as per GenAI guidelines
import express from 'express';
import { google } from 'googleapis';
import { GoogleGenAI, Type } from '@google/genai';
import pg from 'pg';
const { Pool } = pg;
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(express.json());
// Permitir peticiones desde tu frontend (localhost o dominio real)
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// 1. CONEXIÓN BASE DE DATOS (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Ej: postgres://postgres:[password]@db.supabase.co:5432/postgres
  ssl: { rejectUnauthorized: false } // Necesario para Supabase
});

// 3. GMAIL OAUTH2
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI // Ej: http://localhost:4000/auth/google/callback
);

/**
 * RUTA: Sincronización Inteligente de Correos
 * Esta es la lógica clave para filtrar solo lo que importa.
 */
app.post('/api/sync-bank-emails', async (req, res) => {
  const { userId } = req.body; // El ID del usuario logueado

  try {
    // A. Recuperar el Token de acceso del usuario desde la BD
    const userRes = await pool.query('SELECT refresh_token FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(401).json({ error: 'Usuario no autenticado con Google' });

    oauth2Client.setCredentials({ refresh_token: userRes.rows[0].refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // =================================================================================
    // FILTRO 1: QUERY DE GMAIL (Para ignorar correos personales)
    // =================================================================================
    const bankQuery = `
      (from:notificaciones@bancolombia.com OR from:alertas@bbva.com OR from:info@santander.com) 
      (subject:"Extracto" OR subject:"Movimientos" OR subject:"Transferencia Recibida") 
      newer_than:30d
      -category:promotions
    `;

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: bankQuery,
      maxResults: 10 // Procesar en lotes pequeños
    });

    const messages = response.data.messages || [];
    let processedCount = 0;

    for (const msg of messages) {
      // B. Verificar si ya procesamos este correo para no duplicar
      const existingEmail = await pool.query('SELECT id FROM processed_emails WHERE gmail_id = $1', [msg.id]);
      if (existingEmail.rows.length > 0) continue;

      // C. Obtener contenido limpio del correo
      const email = await gmail.users.messages.get({ userId: 'me', id: msg.id });
      let bodyData = '';

      // Lógica para extraer texto plano o HTML dependiendo de la estructura MIME
      if (email.data.payload.parts) {
        bodyData = email.data.payload.parts.find(p => p.mimeType === 'text/plain')?.body?.data || '';
      } else {
        bodyData = email.data.payload.body.data || '';
      }

      if (!bodyData) continue;
      const decodedBody = Buffer.from(bodyData, 'base64').toString('utf-8');

      // =================================================================================
      // FILTRO 2: IA GEMINI (Para limpiar basura y estructurar)
      // =================================================================================
      // Fix: Create GoogleGenAI instance right before the call as per best practices
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `
          Analiza este correo electrónico.
          Si contiene transacciones financieras (compras, transferencias, pagos), extraelas en JSON.
          Si es publicidad, avisos legales o no hay montos claros, devuelve un array vacío [].
          
          Email:
          ${decodedBody.substring(0, 8000)} 
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER }
              }
            }
          }
        }
      });

      // Fix: Access .text property directly instead of calling it
      const transactions = JSON.parse(aiResponse.text || "[]");

      // D. Guardar en Base de Datos (Supabase)
      if (transactions.length > 0) {
        for (const t of transactions) {
          await pool.query(
            `INSERT INTO transactions (user_id, date, description, amount, source, status, created_at)
             VALUES ($1, $2, $3, $4, 'BANK', 'PENDING', NOW())`,
            [userId, t.date, t.description, t.amount]
          );
        }
        processedCount += transactions.length;
      }

      // Marcar correo como procesado
      await pool.query('INSERT INTO processed_emails (gmail_id, user_id) VALUES ($1, $2)', [msg.id, userId]);
    }

    res.json({ success: true, newTransactions: processedCount });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
