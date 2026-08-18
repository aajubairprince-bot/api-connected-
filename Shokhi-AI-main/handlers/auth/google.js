import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { generateToken } from '../../lib/auth.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const { email, name, avatar_url, google_id, pregnancy_week } = req.body || {};

  if (!email) {
    return sendJsonError(res, 400, 'Google account email is required.');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const userName = name ? String(name).trim() : normalizedEmail.split('@')[0];
  const userAvatar = avatar_url || '';
  const userWeek = pregnancy_week ? Math.min(42, Math.max(1, parseInt(pregnancy_week, 10))) : 1;

  const config = getSupabaseConfig();

  if (config.is_configured) {
    const supabase = getSupabaseAdminClient();
    try {
      // 1. Try finding existing profile in database by google_id or email
      let targetUser = null;
      if (google_id) {
        const { data: byId } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', google_id)
          .maybeSingle();
        targetUser = byId;
      }

      if (!targetUser) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();
        targetUser = byEmail;
      }

      const isSuperAdmin = normalizedEmail === 'ptasnia95@gmail.com' || (process.env.ADMIN_EMAIL && normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase().trim());

      if (!targetUser) {
        // Insert new profile with is_admin = true for super admin
        const newUserId = google_id || `google_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: newUserId,
            full_name: userName,
            avatar_url: userAvatar,
            pregnancy_week: userWeek,
            is_admin: isSuperAdmin,
            preferred_language: 'bn',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .select()
          .single();

        if (!insertError && created) {
          targetUser = created;
        }
      } else {
        // Update user name/avatar if needed
        const newAdminStatus = isSuperAdmin ? true : Boolean(targetUser.is_admin);
        await supabase
          .from('profiles')
          .update({
            full_name: userName,
            avatar_url: userAvatar || targetUser.avatar_url,
            is_admin: newAdminStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUser.id);
        targetUser.is_admin = newAdminStatus;
      }

      if (targetUser) {
        const token = generateToken({
          id: targetUser.id,
          email: normalizedEmail,
          name: targetUser.full_name || userName,
          pregnancy_week: targetUser.pregnancy_week || userWeek,
          is_admin: Boolean(targetUser.is_admin)
        });

        return sendJsonResponse(res, 200, {
          success: true,
          message: 'Google authentication successful',
          token,
          user: {
            id: targetUser.id,
            email: normalizedEmail,
            name: targetUser.full_name || userName,
            avatar_url: targetUser.avatar_url || userAvatar,
            pregnancy_week: targetUser.pregnancy_week || userWeek,
            is_admin: Boolean(targetUser.is_admin)
          }
        });
      }
    } catch (err) {
      console.warn('[Google Auth] Supabase query notice:', err.message);
    }
  }

  // Local Relational Fallback Store
  let localUser = localDb.users.find(u => u.email === normalizedEmail);

  if (!localUser) {
    localUser = {
      id: google_id || `google_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email: normalizedEmail,
      name: userName,
      avatar_url: userAvatar,
      pregnancy_week: userWeek,
      is_admin: false,
      created_at: Date.now() / 1000
    };
    localDb.users.push(localUser);
  } else {
    if (userName && !localUser.name) localUser.name = userName;
    if (userAvatar) localUser.avatar_url = userAvatar;
  }

  const token = generateToken(localUser);

  sendJsonResponse(res, 200, {
    success: true,
    message: 'Google authentication successful',
    token,
    user: {
      id: localUser.id,
      email: localUser.email,
      name: localUser.name,
      avatar_url: localUser.avatar_url,
      pregnancy_week: localUser.pregnancy_week || 1,
      is_admin: Boolean(localUser.is_admin)
    }
  });
}
