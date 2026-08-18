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

  const config = getSupabaseConfig();
  let supabaseUserId = null;

  // 1. Register with Supabase Auth (Auto-confirmed with email_confirm: true)
  if (config.is_configured) {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      
      const { data: createdAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // No verification email needed! Instantly confirmed.
        user_metadata: {
          full_name: name,
          name: name,
          pregnancy_week: isNaN(pregnancyWeek) ? 24 : pregnancyWeek
        }
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes('already') || authError.status === 422) {
          return sendJsonError(res, 409, 'An account with this email already exists. Please log in.');
        }
        console.warn('[Supabase Auth createUser warning]:', authError.message);
      } else if (createdAuth?.user) {
        supabaseUserId = createdAuth.user.id;
      }

      // Upsert profile in Supabase profiles table
      const finalId = supabaseUserId || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: finalId,
          email: email,
          full_name: name,
          pregnancy_week: isNaN(pregnancyWeek) ? 24 : pregnancyWeek,
          is_admin: isAdmin,
          preferred_language: 'bn',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      supabaseUserId = finalId;
    } catch (err) {
      console.warn('[Register Supabase error]:', err.message);
    }
  }

  // 2. Save in local memory store fallback
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const localUserId = supabaseUserId || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const newUser = {
    id: localUserId,
    email,
    name,
    full_name: name,
    password_hash: passwordHash,
    pregnancy_week: isNaN(pregnancyWeek) ? 24 : pregnancyWeek,
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

  // Remove duplicate in local store if any
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
    message: 'Account created successfully in Supabase! You can now log in anytime.',
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
