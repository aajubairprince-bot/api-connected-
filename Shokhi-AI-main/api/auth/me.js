import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  // verifyAuth already queries the DB for the latest is_admin value
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  // Look up local DB for richer profile; fallback to token data
  const dbUser = localDb.users.find(u => String(u.id) === String(authUser.id));

  // Always use authUser.is_admin — it was freshly read from the DB by verifyAuth
  const isAdmin = authUser.is_admin;

  sendJsonResponse(res, 200, {
    user: {
      id: authUser.id,
      email: authUser.email,
      name: dbUser?.name || authUser.user_metadata?.full_name || 'Mother',
      pregnancy_week: dbUser?.pregnancy_week || authUser.user_metadata?.pregnancy_week || 1,
      is_admin: isAdmin
    }
  });
}
