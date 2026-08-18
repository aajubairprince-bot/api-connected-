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
    const name = escapeHtml((body.name || '').trim());
    const gender = body.gender || 'unspecified';
    const meaning = escapeHtml((body.meaning || '').trim());

    if (!name) {
      return sendJsonError(res, 400, 'Name required');
    }

    const item = {
      id: localDb.generateId(),
      user_id: userId,
      name,
      gender,
      meaning,
      created_at: Date.now() / 1000
    };
    localDb.saved_baby_names.push(item);

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
    const index = localDb.saved_baby_names.findIndex(n => n.id === id && String(n.user_id) === userId);
    if (index === -1) {
      return sendJsonError(res, 404, 'Baby name not found');
    }
    localDb.saved_baby_names.splice(index, 1);
    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
