import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { getSupabaseConfig, getSupabaseClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Admin authorization token required.');
  }

  if (!authUser.is_admin) {
    return sendJsonError(res, 403, 'Forbidden: Administrator privileges required.');
  }

  const body = req.body || {};
  const targetEmail = body.email ? String(body.email).toLowerCase().trim() : null;
  const targetUserId = body.user_id ? String(body.user_id).trim() : null;
  const newRoleState = body.is_admin !== undefined ? Boolean(body.is_admin) : true;

  if (!targetEmail && !targetUserId) {
    return sendJsonError(res, 400, 'Target user email or user_id is required.');
  }

  let foundUser = null;

  // 1. Update in local store
  if (targetUserId) {
    foundUser = localDb.users.find(u => String(u.id) === targetUserId);
  }
  if (!foundUser && targetEmail) {
    foundUser = localDb.users.find(u => u.email && u.email.toLowerCase() === targetEmail);
  }

  if (foundUser) {
    foundUser.is_admin = newRoleState;
    foundUser.updated_at = Date.now() / 1000;
  } else if (targetEmail) {
    // If not found in memory, create/seed the user with the specified admin role
    foundUser = {
      id: targetUserId || localDb.generateId(),
      email: targetEmail,
      name: body.name || targetEmail.split('@')[0],
      pregnancy_week: 1,
      is_admin: newRoleState,
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    };
    localDb.users.push(foundUser);
  }

  // 2. Update in Supabase if configured
  const config = getSupabaseConfig();
  if (config.is_configured) {
    const supabase = getSupabaseClient();
    try {
      if (targetUserId) {
        await supabase
          .from('profiles')
          .update({ is_admin: newRoleState, updated_at: new Date().toISOString() })
          .eq('id', targetUserId);
      }
      if (targetEmail) {
        await supabase
          .from('profiles')
          .update({ is_admin: newRoleState, updated_at: new Date().toISOString() })
          .eq('email', targetEmail);
      }
    } catch (e) {
      console.warn('[Assign Role] Supabase update warning:', e.message);
    }
  }

  return sendJsonResponse(res, 200, {
    success: true,
    message: `Admin role successfully ${newRoleState ? 'assigned to' : 'revoked from'} ${foundUser?.email || targetEmail || targetUserId}`,
    user: {
      id: foundUser?.id || targetUserId,
      email: foundUser?.email || targetEmail,
      name: foundUser?.name,
      is_admin: newRoleState
    }
  });
}
