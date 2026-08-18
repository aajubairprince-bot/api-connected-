import { sendJsonResponse, sendJsonError } from '../../../lib/errors.js';
import { verifyAuth } from '../../../lib/auth.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const todayStr = new Date().toISOString().slice(0, 10);
  const config = getSupabaseConfig();

  if (config.is_configured) {
    try {
      const supabase = getSupabaseAdminClient();
      await supabase
        .from('daily_routines')
        .update({ is_completed: false, completed_at: null })
        .eq('user_id', userId)
        .eq('record_date', todayStr);
    } catch (_) {}
  }

  localDb.daily_routines.forEach(r => {
    if (String(r.user_id) === userId && r.record_date === todayStr) {
      r.is_completed = false;
      r.completed_at = null;
    }
  });

  sendJsonResponse(res, 200, {
    success: true,
    message: 'All routines reset for today',
    record_date: todayStr
  });
}
