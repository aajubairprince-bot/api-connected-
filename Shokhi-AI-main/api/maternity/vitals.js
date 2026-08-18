import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { escapeHtml } from '../../lib/validation.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const config = getSupabaseConfig();

  if (req.method === 'POST') {
    const body = req.body || {};
    const rawBp = body.bp || body.blood_pressure;
    const rawWeight = body.weight_kg !== undefined ? body.weight_kg : body.weight;
    
    const bp = rawBp ? escapeHtml(String(rawBp).trim()) : null;
    const weightKg = rawWeight !== undefined && rawWeight !== null && String(rawWeight).trim() !== '' ? parseFloat(rawWeight) : null;
    const notes = body.notes ? escapeHtml(String(body.notes).trim()) : null;

    if (!bp && weightKg === null) {
      return sendJsonError(res, 400, 'Blood pressure or weight required');
    }

    let createdId = localDb.generateId();

    // 1. Persist in Supabase vital_records table
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('vital_records')
          .insert({
            user_id: userId,
            bp: bp,
            weight_kg: weightKg,
            notes: notes,
            recorded_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && data) {
          createdId = data.id;
        } else if (error) {
          console.warn('[Supabase vital_records insert warning]:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase vital_records insert error]:', err.message);
      }
    }

    // 2. Persist in local store
    const item = {
      id: createdId,
      user_id: userId,
      bp,
      weight_kg: weightKg,
      notes,
      recorded_at: Date.now() / 1000
    };
    localDb.vital_records.unshift(item);

    return sendJsonResponse(res, 201, {
      success: true,
      item: {
        id: item.id,
        bp: item.bp,
        weight_kg: item.weight_kg,
        recorded_at: item.recorded_at
      }
    });
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query?.id || req.url?.split('/').pop()?.split('?')[0], 10);
    
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        await supabase
          .from('vital_records')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (_) {}
    }

    const index = localDb.vital_records.findIndex(v => v.id === id && String(v.user_id) === userId);
    if (index !== -1) localDb.vital_records.splice(index, 1);

    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
