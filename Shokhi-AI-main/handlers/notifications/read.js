import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const notifId = parseInt(req.query?.id || req.url?.split('/')?.slice(-2)[0], 10);

  const notif = localDb.notifications.find(n => n.id === notifId && (String(n.user_id) === userId || n.user_id === 'all'));
  if (!notif) {
    return sendJsonError(res, 404, 'Notification not found');
  }

  notif.is_read = true;
  notif.read_at = Date.now() / 1000;

  sendJsonResponse(res, 200, {
    success: true,
    notification_id: notif.id,
    is_read: true
  });
}
