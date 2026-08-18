import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const config = getSupabaseConfig();

  let record = localDb.kick_records
    .filter(k => String(k.user_id) === userId)
    .sort((a, b) => b.session_start - a.session_start)[0];

  if (req.method === 'GET') {
    let currentKicks = record ? record.kick_count : 0;

    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data } = await supabase
          .from('kick_records')
          .select('*')
          .eq('user_id', userId)
          .order('session_start', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) currentKicks = data.kick_count;
      } catch (_) {}
    }

    return sendJsonResponse(res, 200, {
      success: true,
      kick_count: currentKicks,
      target_kicks: 10
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    let kickCount = 0;

    if (body.reset === true) {
      kickCount = 0;
    } else if (body.increment) {
      kickCount = (record ? record.kick_count : 0) + parseInt(body.increment, 10);
    } else if (body.kick_count !== undefined) {
      kickCount = parseInt(body.kick_count, 10);
    }

    if (isNaN(kickCount)) {
      return sendJsonError(res, 400, 'Kick count integer required');
    }

    let createdId = localDb.generateId();

    // 1. Persist to Supabase kick_records
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('kick_records')
          .insert({
            user_id: userId,
            kick_count: Math.max(0, kickCount),
            session_start: new Date().toISOString(),
            session_end: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && data) {
          createdId = data.id;
        } else if (error) {
          console.warn('[Supabase kick_records error]:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase kick_records insert error]:', err.message);
      }
    }

    // 2. Persist in local store
    if (!record) {
      record = {
        id: createdId,
        user_id: userId,
        kick_count: Math.max(0, kickCount),
        session_start: Date.now() / 1000,
        session_end: null
      };
      localDb.kick_records.unshift(record);
    } else {
      record.kick_count = Math.max(0, kickCount);
      record.session_end = Date.now() / 1000;
    }

    return sendJsonResponse(res, 200, {
      success: true,
      kick_count: record.kick_count,
      session_id: record.id
    });
  }

  if (req.method === 'DELETE') {
    if (record) {
      record.kick_count = 0;
      record.session_end = Date.now() / 1000;
    }
    return sendJsonResponse(res, 200, {
      success: true,
      kick_count: 0
    });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
