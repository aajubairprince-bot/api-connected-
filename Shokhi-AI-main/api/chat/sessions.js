import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  const deviceId = req.headers['x-device-id'] || req.query?.device_id || 'guest_device_default';
  const userId = authUser ? String(authUser.id) : `guest_${deviceId}`;

  const supaConfig = getSupabaseConfig();
  if (supaConfig.is_configured) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data: supaSessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(supaSessions) && supaSessions.length > 0) {
        supaSessions.forEach(ss => {
          const idx = localDb.chat_sessions.findIndex(s => s.id === ss.id);
          if (idx === -1) {
            localDb.chat_sessions.push({
              id: ss.id,
              user_id: String(ss.user_id),
              title: ss.title,
              created_at: new Date(ss.created_at || Date.now()).getTime() / 1000,
              updated_at: new Date(ss.updated_at || Date.now()).getTime() / 1000
            });
          } else {
            localDb.chat_sessions[idx].title = ss.title;
            localDb.chat_sessions[idx].updated_at = new Date(ss.updated_at || Date.now()).getTime() / 1000;
          }
        });
      }
    } catch (e) {
      console.warn('[Supabase Sessions Notice]:', e.message);
    }
  }

  const sessions = localDb.chat_sessions
    .filter(s => String(s.user_id) === userId)
    .sort((a, b) => b.updated_at - a.updated_at)
    .map(s => ({
      chat_id: s.id,
      title: s.title,
      updated_at: s.updated_at
    }));

  sendJsonResponse(res, 200, sessions);
}
