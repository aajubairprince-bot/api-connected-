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
    let entryType = (body.entry_type || (body.symptoms?.length ? 'symptom' : 'mood')).trim().toLowerCase();
    if (entryType !== 'mood' && entryType !== 'symptom') entryType = 'mood';
    
    const label = escapeHtml((body.label || body.mood || (body.symptoms && body.symptoms[0]) || 'Good').trim());
    let severity = (body.severity || 'mild').toLowerCase();
    if (!['mild', 'moderate', 'severe'].includes(severity)) severity = 'mild';

    if (!label) {
      return sendJsonError(res, 400, 'Label required');
    }

    let createdId = localDb.generateId();

    // 1. Persist to Supabase mood_symptoms table
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('mood_symptoms')
          .insert({
            user_id: userId,
            entry_type: entryType,
            label: label,
            severity: severity,
            logged_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && data) {
          createdId = data.id;
        } else if (error) {
          console.warn('[Supabase mood_symptoms insert warning]:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase mood_symptoms error]:', err.message);
      }
    }

    // 2. Persist in local store
    const item = {
      id: createdId,
      user_id: userId,
      entry_type: entryType,
      label,
      severity,
      logged_at: Date.now() / 1000
    };
    localDb.mood_symptoms.unshift(item);

    return sendJsonResponse(res, 201, {
      success: true,
      item: {
        id: item.id,
        entry_type: item.entry_type,
        label: item.label,
        severity: item.severity,
        logged_at: item.logged_at
      }
    });
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query?.id || req.url?.split('/').pop()?.split('?')[0], 10);
    
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        await supabase
          .from('mood_symptoms')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (_) {}
    }

    const index = localDb.mood_symptoms.findIndex(m => m.id === id && String(m.user_id) === userId);
    if (index !== -1) localDb.mood_symptoms.splice(index, 1);

    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
