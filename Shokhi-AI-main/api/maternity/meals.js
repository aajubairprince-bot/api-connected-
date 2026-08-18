import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { escapeHtml } from '../../lib/validation.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);

  if (req.method === 'POST') {
    const body = req.body || {};
    const mealType = escapeHtml((body.meal_type || 'Breakfast').trim());
    const description = escapeHtml((body.description || '').trim());

    if (!description) {
      return sendJsonError(res, 400, 'Description required');
    }

    const item = {
      id: localDb.generateId(),
      user_id: userId,
      meal_type: mealType,
      description,
      logged_at: Date.now() / 1000
    };
    localDb.meal_logs.push(item);

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
    const index = localDb.meal_logs.findIndex(m => m.id === id && String(m.user_id) === userId);
    if (index === -1) {
      return sendJsonError(res, 404, 'Meal log not found');
    }
    localDb.meal_logs.splice(index, 1);
    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
