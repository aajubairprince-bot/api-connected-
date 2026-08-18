import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { escapeHtml } from '../../lib/validation.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const body = req.body || {};
  const symptom = escapeHtml((body.symptom_detected || 'Unspecified Emergency').trim());
  const source = body.trigger_source || 'manual_sos';
  const actionTaken = escapeHtml((body.action_taken || 'Emergency advisory presented').trim());

  const logEntry = {
    id: localDb.generateId(),
    user_id: String(authUser.id),
    trigger_source: source,
    symptom_detected: symptom,
    action_taken: actionTaken,
    created_at: Date.now() / 1000
  };

  localDb.emergency_logs.push(logEntry);

  sendJsonResponse(res, 201, {
    success: true,
    log_id: logEntry.id,
    logged_at: logEntry.created_at
  });
}
