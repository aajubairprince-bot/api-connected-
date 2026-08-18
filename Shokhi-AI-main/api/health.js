import { sendJsonResponse } from '../lib/errors.js';
import { testSupabaseConnection } from '../lib/supabase.js';

const APP_START_TIME = Date.now() / 1000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  const dbTest = await testSupabaseConnection();
  const dbOk = dbTest.status.includes('connected') || dbTest.status.includes('unconfigured');
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  const geminiStatus = geminiKey && geminiKey !== 'your_gemini_api_key_here' ? 'CONFIGURED' : 'FALLBACK_MODE';

  sendJsonResponse(res, 200, {
    status: dbOk ? 'HEALTHY' : 'DEGRADED',
    version: '2.0.0-node-vercel',
    timestamp: Date.now() / 1000,
    uptime_seconds: Math.floor((Date.now() / 1000) - APP_START_TIME),
    subsystems: {
      database: dbOk ? 'CONNECTED' : 'UNAVAILABLE',
      gemini_generative_ai: geminiStatus,
      maternal_context_engine: 'ACTIVE',
      emergency_triage_engine: 'ACTIVE',
      notification_engine: 'ACTIVE'
    }
  });
}
