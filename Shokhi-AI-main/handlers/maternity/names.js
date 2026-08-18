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
    const name = escapeHtml((body.name || '').trim());
    let gender = (body.gender || 'unspecified').toLowerCase();
    if (!['boy', 'girl', 'unspecified'].includes(gender)) gender = 'unspecified';
    const meaning = escapeHtml((body.meaning || '').trim());

    if (!name) {
      return sendJsonError(res, 400, 'Name required');
    }

    let createdId = localDb.generateId();

    // 1. Persist in Supabase saved_baby_names table
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('saved_baby_names')
          .insert({
            user_id: userId,
            name: name,
            gender: gender,
            meaning: meaning,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && data) {
          createdId = data.id;
        } else if (error) {
          console.warn('[Supabase saved_baby_names insert warning]:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase saved_baby_names insert error]:', err.message);
      }
    }

    // 2. Persist in local store
    const item = {
      id: createdId,
      user_id: userId,
      name,
      gender,
      meaning,
      created_at: Date.now() / 1000
    };
    localDb.saved_baby_names.unshift(item);

    return sendJsonResponse(res, 201, {
      success: true,
      item: {
        id: item.id,
        name: item.name,
        gender: item.gender,
        meaning: item.meaning
      }
    });
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query?.id || req.url?.split('/').pop()?.split('?')[0], 10);
    
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        await supabase
          .from('saved_baby_names')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (_) {}
    }

    const index = localDb.saved_baby_names.findIndex(n => n.id === id && String(n.user_id) === userId);
    if (index !== -1) localDb.saved_baby_names.splice(index, 1);

    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
