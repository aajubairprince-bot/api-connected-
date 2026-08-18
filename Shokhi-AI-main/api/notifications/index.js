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

  if (req.method === 'GET') {
    let list = [];

    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${userId},user_id.eq.all`)
          .order('created_at', { ascending: false })
          .limit(40);

        if (!error && data) {
          list = data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            notification_type: n.notification_type,
            scheduled_time: n.scheduled_time || 'Immediate',
            is_read: Boolean(n.is_read),
            sound_enabled: n.sound_enabled !== false,
            created_at: typeof n.created_at === 'string' ? Math.floor(new Date(n.created_at).getTime() / 1000) : n.created_at
          }));
        }
      } catch (err) {
        console.warn('[Notifications GET] Supabase notice:', err.message);
      }
    }

    // Merge with local fallback store
    const localList = localDb.notifications
      .filter(n => (String(n.user_id) === userId || n.user_id === 'all') && !n.is_dismissed)
      .map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        notification_type: n.notification_type,
        scheduled_time: n.scheduled_time,
        is_read: n.is_read,
        sound_enabled: n.sound_enabled,
        created_at: n.created_at
      }));

    // Deduplicate by title & created time or ID
    const combined = [...list, ...localList];
    const seen = new Set();
    const finalNotifications = [];
    for (const item of combined) {
      const key = `${item.title}_${item.created_at}`;
      if (!seen.has(key)) {
        seen.add(key);
        finalNotifications.push(item);
      }
    }

    finalNotifications.sort((a, b) => b.created_at - a.created_at);
    const unreadCount = finalNotifications.filter(n => !n.is_read).length;

    return sendJsonResponse(res, 200, {
      success: true,
      unread_count: unreadCount,
      notifications: finalNotifications.slice(0, 30)
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const title = escapeHtml((body.title || '').trim());
    const message = escapeHtml((body.message || '').trim());
    const notifType = body.notification_type || (body.user_id === 'all' ? 'broadcast' : 'custom');
    const scheduledTime = body.scheduled_time || 'Immediate';
    const soundEnabled = body.sound_enabled !== false;
    
    // Target user: If admin and user_id is 'all', target is 'all'. Otherwise target is user's ID
    let targetUserId = userId;
    if (authUser.is_admin && body.user_id) {
      targetUserId = String(body.user_id);
    } else if (body.user_id === 'all') {
      targetUserId = 'all';
    }

    if (!title || !message) {
      return sendJsonError(res, 400, 'Title and message required');
    }

    let createdNotif = null;

    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            title,
            message,
            notification_type: notifType,
            scheduled_time: scheduledTime,
            is_read: false,
            sound_enabled: soundEnabled,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && data) {
          createdNotif = {
            id: data.id,
            title: data.title,
            message: data.message,
            notification_type: data.notification_type,
            scheduled_time: data.scheduled_time,
            created_at: Math.floor(new Date(data.created_at).getTime() / 1000)
          };
        }
      } catch (err) {
        console.warn('[Notifications POST] Supabase notice:', err.message);
      }
    }

    // Also persist in local store
    const localItem = {
      id: localDb.generateId(),
      user_id: targetUserId,
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
    localDb.notifications.unshift(localItem);

    if (!createdNotif) {
      createdNotif = {
        id: localItem.id,
        title: localItem.title,
        message: localItem.message,
        notification_type: localItem.notification_type,
        scheduled_time: localItem.scheduled_time,
        created_at: localItem.created_at
      };
    }

    return sendJsonResponse(res, 201, {
      success: true,
      message: targetUserId === 'all' ? 'Broadcast sent to all mothers successfully' : 'Notification created successfully',
      notification: createdNotif
    });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
