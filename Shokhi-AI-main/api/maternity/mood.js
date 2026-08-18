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
    const entryType = escapeHtml((body.entry_type || 'mood').trim());
    const label = escapeHtml((body.label || '').trim());
    const severity = body.severity || 'mild';

    if (!label) {
      return sendJsonError(res, 400, 'Label required');
    }

    const item = {
      id: localDb.generateId(),
      user_id: userId,
      entry_type: entryType,
      label,
      severity,
      logged_at: Date.now() / 1000
    };
    localDb.mood_symptoms.push(item);

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
    const index = localDb.mood_symptoms.findIndex(m => m.id === id && String(m.user_id) === userId);
    if (index === -1) {
      return sendJsonError(res, 404, 'Mood / symptom log not found');
    }
    localDb.mood_symptoms.splice(index, 1);
    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
