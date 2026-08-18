import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const todayStr = new Date().toISOString().slice(0, 10);

  if (!localDb.hydration_records) {
    localDb.hydration_records = [];
  }

  let record = localDb.hydration_records.find(
    h => String(h.user_id) === userId && h.record_date === todayStr
  );

  if (req.method === 'GET') {
    return sendJsonResponse(res, 200, {
      success: true,
      glass_count: record ? record.glass_count : 0,
      record_date: todayStr,
      target_glasses: 8
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    let glassCount = 0;

    if (body.reset === true) {
      glassCount = 0;
    } else if (body.increment) {
      glassCount = (record ? record.glass_count : 0) + parseInt(body.increment, 10);
    } else if (body.glass_count !== undefined) {
      glassCount = parseInt(body.glass_count, 10);
    }

    glassCount = Math.max(0, Math.min(16, isNaN(glassCount) ? 0 : glassCount));

    if (!record) {
      record = {
        id: localDb.generateId(),
        user_id: userId,
        glass_count: glassCount,
        record_date: todayStr,
        updated_at: Date.now() / 1000
      };
      localDb.hydration_records.push(record);
    } else {
      record.glass_count = glassCount;
      record.updated_at = Date.now() / 1000;
    }

    return sendJsonResponse(res, 200, {
      success: true,
      glass_count: record.glass_count,
      record_date: record.record_date,
      target_glasses: 8
    });
  }

  if (req.method === 'DELETE') {
    if (record) {
      record.glass_count = 0;
      record.updated_at = Date.now() / 1000;
    }
    return sendJsonResponse(res, 200, {
      success: true,
      glass_count: 0,
      record_date: todayStr
    });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
