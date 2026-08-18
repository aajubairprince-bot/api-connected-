import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

/**
 * DELETE /api/admin/delete
 * Body: { table: 'meal_logs' | 'emergency_logs' | 'notifications' | 'appointments' | 'vital_logs' | 'mood_symptoms' | 'daily_routines' | 'kick_records', id: number }
 *
 * Admin-only. Deletes a single record from any allowed table by its primary key.
 */
const ALLOWED_TABLES = new Set([
  'meal_logs',
  'emergency_logs',
  'notifications',
  'appointments',
  'vital_logs',
  'mood_symptoms',
  'daily_routines',
  'kick_records',
  'saved_baby_names',
  'chat_messages',
  'chat_sessions',
]);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }
  if (!authUser.is_admin) {
    return sendJsonError(res, 403, 'Forbidden: Administrator privileges required.');
  }

  const { table, id } = req.body || {};

  if (!table || !id) {
    return sendJsonError(res, 400, 'Both table and id are required.');
  }
  if (!ALLOWED_TABLES.has(table)) {
    return sendJsonError(res, 400, `Table "${table}" is not eligible for admin deletion.`);
  }

  const config = getSupabaseConfig();

  if (config.is_configured) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error(`[Admin Delete] Supabase error on ${table}#${id}:`, error.message);
      return sendJsonError(res, 500, `Failed to delete record: ${error.message}`);
    }
  } else {
    // Local DB fallback
    const key = table === 'vital_logs' ? 'vital_records' : table;
    if (localDb[key]) {
      const idx = localDb[key].findIndex(r => String(r.id) === String(id));
      if (idx !== -1) localDb[key].splice(idx, 1);
    }
  }

  sendJsonResponse(res, 200, { success: true, message: `Record #${id} deleted from ${table}.` });
}
