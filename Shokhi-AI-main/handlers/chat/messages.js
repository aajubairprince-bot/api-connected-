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

  const chatId = req.query?.chat_id || req.url?.split('/').pop()?.split('?')[0];

  if (!chatId) {
    return sendJsonResponse(res, 200, []);
  }

  const supaConfig = getSupabaseConfig();
  if (supaConfig.is_configured) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data: supaMsgs, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', chatId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(supaMsgs) && supaMsgs.length > 0) {
        // Clear old local cache for this session and replace with database truth
        localDb.chat_messages = localDb.chat_messages.filter(m => m.session_id !== chatId);
        supaMsgs.forEach(sm => {
          localDb.chat_messages.push({
            id: sm.id,
            session_id: sm.session_id,
            user_id: String(sm.user_id),
            role: sm.role,
            content: sm.content,
            has_image: Boolean(sm.has_image || sm.image_url),
            image_url: sm.image_url || null,
            created_at: new Date(sm.created_at || Date.now()).getTime() / 1000
          });
        });
      }
    } catch (e) {
      console.warn('[Supabase Messages Notice]:', e.message);
    }
  }

  const messages = localDb.chat_messages
    .filter(m => m.session_id === chatId && String(m.user_id) === userId)
    .sort((a, b) => a.created_at - b.created_at)
    .map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      has_image: m.has_image,
      image_url: m.image_url,
      created_at: m.created_at
    }));

  sendJsonResponse(res, 200, messages);
}
