import { sendJsonResponse, sendJsonError } from '../../../lib/errors.js';
import { verifyAuth } from '../../../lib/auth.js';
import { escapeHtml } from '../../../lib/validation.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const config = getSupabaseConfig();
  const body = req.body || {};
  const routineKey = escapeHtml((body.routine_key || '').trim());
  const todayStr = new Date().toISOString().slice(0, 10);

  if (!routineKey) {
    return sendJsonError(res, 400, 'Routine key required');
  }

  let item = localDb.daily_routines.find(
    r => String(r.user_id) === userId && r.routine_key === routineKey && r.record_date === todayStr
  );

  let targetState = true;
  if (body.is_completed !== undefined) {
    targetState = Boolean(body.is_completed);
  } else if (item) {
    targetState = !item.is_completed;
  }

  // 1. Persist in Supabase daily_routines table
  if (config.is_configured) {
    try {
      const supabase = getSupabaseAdminClient();
      await supabase
        .from('daily_routines')
        .upsert({
          user_id: userId,
          routine_key: routineKey,
          is_completed: targetState,
          record_date: todayStr,
          completed_at: targetState ? new Date().toISOString() : null
        }, { onConflict: 'user_id,routine_key,record_date' });
    } catch (err) {
      console.warn('[Supabase daily_routines upsert error]:', err.message);
    }
  }

  // 2. Persist in local store
  if (item) {
    item.is_completed = targetState;
    item.completed_at = targetState ? Date.now() / 1000 : null;
  } else {
    item = {
      id: localDb.generateId(),
      user_id: userId,
      routine_key: routineKey,
      is_completed: targetState,
      record_date: todayStr,
      completed_at: targetState ? Date.now() / 1000 : null
    };
    localDb.daily_routines.push(item);
  }

  sendJsonResponse(res, 200, {
    success: true,
    routine_key: item.routine_key,
    is_completed: item.is_completed
  });
}
