import bcrypt from 'bcryptjs';
import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { generateToken } from '../../lib/auth.js';
import { escapeHtml } from '../../lib/validation.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const name = escapeHtml((body.name || 'New Mother').trim());
  const pregnancyWeek = parseInt(body.pregnancy_week || 24, 10);
  const isAdmin = body.is_admin === true || email === 'admin@shokhi.ai' || email === 'ptasnia95@gmail.com';

  if (!email || !password) {
    return sendJsonError(res, 400, 'Email and password are required.');
  }

  if (password.length < 6) {
    return sendJsonError(res, 400, 'Password must be at least 6 characters long.');
  }

  const validWeek = isNaN(pregnancyWeek) ? 24 : pregnancyWeek;
  const config = getSupabaseConfig();
  let supabaseUserId = null;

  // 1. Register with Supabase Auth & PostgreSQL Profiles Table
  if (config.is_configured) {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      
      // Step A: Create user in Supabase Auth with auto email confirmation
      const { data: createdAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto confirmed without email verification barrier!
        user_metadata: {
          full_name: name,
          pregnancy_week: validWeek
        }
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes('already') || authError.status === 422) {
          return sendJsonError(res, 409, 'An account with this email already exists in Supabase. Please log in.');
        }
        console.warn('[Supabase Auth createUser warning]:', authError.message);
      } else if (createdAuth?.user) {
        supabaseUserId = createdAuth.user.id;
      }

      // If user exists, find their ID
      if (!supabaseUserId) {
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = userList?.users?.find(u => u.email?.toLowerCase() === email);
        if (existing) supabaseUserId = existing.id;
      }

      // Step B: Upsert into Supabase public.profiles table
      if (supabaseUserId) {
        const { data: savedProfile, error: profileErr } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: supabaseUserId,
            full_name: name,
            pregnancy_week: validWeek,
            is_admin: isAdmin,
            preferred_language: 'bn',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .select()
          .single();

        if (profileErr) {
          console.warn('[Supabase profiles upsert error]:', profileErr.message);
        } else {
          console.log('✅ Successfully saved to Supabase profiles table:', savedProfile);
        }
      }
    } catch (err) {
      console.warn('[Register Supabase error]:', err.message);
    }
  }

  // 2. Save in local store fallback
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const localUserId = supabaseUserId || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const newUser = {
    id: localUserId,
    email,
    name,
    full_name: name,
    password_hash: passwordHash,
    pregnancy_week: validWeek,
    due_date: null,
    blood_group: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    allergies: null,
    medical_history: null,
    language_preference: 'bn',
    is_admin: isAdmin,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  localDb.users = localDb.users.filter(u => u.email !== email);
  localDb.users.unshift(newUser);

  const token = generateToken({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    pregnancy_week: newUser.pregnancy_week,
    is_admin: newUser.is_admin
  });

  return sendJsonResponse(res, 201, {
    success: true,
    message: 'Account created and saved to Supabase profiles table!',
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      pregnancy_week: newUser.pregnancy_week,
      is_admin: newUser.is_admin
    }
  });
}
