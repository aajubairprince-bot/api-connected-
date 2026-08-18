import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  const deviceId = req.headers['x-device-id'] || req.body?.device_id || 'guest_device_default';
  const userId = authUser ? String(authUser.id) : `guest_${deviceId}`;

  const chatId = req.query?.chat_id || req.url?.split('/').pop()?.split('?')[0];

  const sessionIndex = localDb.chat_sessions.findIndex(s => s.id === chatId && String(s.user_id) === userId);
  if (sessionIndex !== -1) {
    localDb.chat_sessions.splice(sessionIndex, 1);
  }

  localDb.chat_messages = localDb.chat_messages.filter(m => !(m.session_id === chatId && String(m.user_id) === userId));

  const supaConfig = getSupabaseConfig();
  if (supaConfig.is_configured) {
    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from('chat_messages').delete().eq('session_id', chatId);
      await supabase.from('chat_sessions').delete().eq('id', chatId);
    } catch (e) {
      console.warn('[Supabase Delete Notice]:', e.message);
    }
  }

  sendJsonResponse(res, 200, {
    success: true,
    message: 'Chat session deleted successfully'
  });
}
