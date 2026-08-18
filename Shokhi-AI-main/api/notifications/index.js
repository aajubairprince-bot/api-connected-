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

  if (req.method === 'GET') {
    const list = localDb.notifications
      .filter(n => (String(n.user_id) === userId || n.user_id === 'all') && !n.is_dismissed)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 30);

    const unreadCount = list.filter(n => !n.is_read).length;

    return sendJsonResponse(res, 200, {
      success: true,
      unread_count: unreadCount,
      notifications: list.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        notification_type: n.notification_type,
        scheduled_time: n.scheduled_time,
        is_read: n.is_read,
        sound_enabled: n.sound_enabled,
        created_at: n.created_at
      }))
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const title = escapeHtml((body.title || '').trim());
    const message = escapeHtml((body.message || '').trim());
    const notifType = body.notification_type || 'custom';
    const scheduledTime = body.scheduled_time || 'Immediate';
    const soundEnabled = body.sound_enabled !== false;

    if (!title || !message) {
      return sendJsonError(res, 400, 'Title and message required');
    }

    const item = {
      id: localDb.generateId(),
      user_id: userId,
      title,
      message,
      notification_type: notifType,
      scheduled_time: scheduledTime,
      is_read: false,
      is_dismissed: false,
      sound_enabled: soundEnabled,
      created_at: Date.now() / 1000,
      read_at: null
    };
    localDb.notifications.push(item);

    return sendJsonResponse(res, 201, {
      success: true,
      notification: {
        id: item.id,
        title: item.title,
        message: item.message,
        notification_type: item.notification_type,
        scheduled_time: item.scheduled_time,
        created_at: item.created_at
      }
    });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
