import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  let dbUser = localDb.users.find(u => String(u.id) === String(authUser.id));
  if (!dbUser) {
    dbUser = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || 'Mother',
      pregnancy_week: authUser.user_metadata?.pregnancy_week || 1,
      is_admin: authUser.is_admin,
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    };
    localDb.users.push(dbUser);
  }

  sendJsonResponse(res, 200, {
    success: true,
    user: dbUser
  });
}
