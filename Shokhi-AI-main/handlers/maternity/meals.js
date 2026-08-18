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
    const mealType = escapeHtml((body.meal_type || 'Breakfast').trim());
    const description = escapeHtml((body.description || '').trim());

    if (!description) {
      return sendJsonError(res, 400, 'Description required');
    }

    let createdId = localDb.generateId();

    // 1. Persist in Supabase meal_logs table
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('meal_logs')
          .insert({
            user_id: userId,
            meal_type: mealType,
            description: description,
            logged_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && data) {
          createdId = data.id;
        } else if (error) {
          console.warn('[Supabase meal_logs insert warning]:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase meal_logs insert error]:', err.message);
      }
    }

    // 2. Persist in local store
    const item = {
      id: createdId,
      user_id: userId,
      meal_type: mealType,
      description,
      logged_at: Date.now() / 1000
    };
    localDb.meal_logs.unshift(item);

    return sendJsonResponse(res, 201, {
      success: true,
      item: {
        id: item.id,
        meal_type: item.meal_type,
        description: item.description,
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
          .from('meal_logs')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (_) {}
    }

    const index = localDb.meal_logs.findIndex(m => m.id === id && String(m.user_id) === userId);
    if (index !== -1) localDb.meal_logs.splice(index, 1);

    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
