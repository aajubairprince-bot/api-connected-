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
    const bp = body.bp ? escapeHtml(String(body.bp).trim()) : null;
    const weightKg = body.weight_kg ? parseFloat(body.weight_kg) : null;
    const notes = body.notes ? escapeHtml(String(body.notes).trim()) : null;

    if (!bp && weightKg === null) {
      return sendJsonError(res, 400, 'Blood pressure or weight required');
    }

    const item = {
      id: localDb.generateId(),
      user_id: userId,
      bp,
      weight_kg: weightKg,
      notes,
      recorded_at: Date.now() / 1000
    };
    localDb.vital_records.push(item);

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
    const index = localDb.vital_records.findIndex(v => v.id === id && String(v.user_id) === userId);
    if (index === -1) {
      return sendJsonError(res, 404, 'Vital record not found');
    }
    localDb.vital_records.splice(index, 1);
    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
