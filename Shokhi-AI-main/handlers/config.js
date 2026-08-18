import { sendJsonResponse } from '../lib/errors.js';
import { getSupabaseConfig } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  const supa = getSupabaseConfig();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

  sendJsonResponse(res, 200, {
    has_api_key: Boolean(geminiKey && geminiKey !== 'your_gemini_api_key_here'),
    model_name: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    supabase_configured: supa.is_configured,
    supabase_url: supa.url || null,
    supabase_anon_key: supa.anon_key || null
  });
}
