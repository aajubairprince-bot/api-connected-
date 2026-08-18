import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);

  let record = localDb.kick_records
    .filter(k => String(k.user_id) === userId)
    .sort((a, b) => b.session_start - a.session_start)[0];

  if (req.method === 'GET') {
    return sendJsonResponse(res, 200, {
      success: true,
      kick_count: record ? record.kick_count : 0,
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

    if (!record) {
      record = {
        id: localDb.generateId(),
        user_id: userId,
        kick_count: kickCount,
        session_start: Date.now() / 1000,
        session_end: null
      };
      localDb.kick_records.push(record);
    } else {
      record.kick_count = kickCount;
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
