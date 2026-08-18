import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const history = localDb.notifications
    .filter(n => String(n.user_id) === userId || n.user_id === 'all')
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 50);

  sendJsonResponse(res, 200, {
    success: true,
    total_dispatched: history.length,
    notifications: history
  });
}
