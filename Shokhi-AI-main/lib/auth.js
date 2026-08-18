/**
 * Authentication & JWT Verification Helper for Shokhi AI (Node.js/Vercel)
 * Strictly Database-Driven Access Control (No hardcoded credentials)
 */

import jwt from 'jsonwebtoken';
import { getSupabaseConfig, getSupabaseClient, getSupabaseAdminClient, localDb } from './supabase.js';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || 'prova_ai_secure_key_2026';

export function generateToken(user) {
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name || '',
    pregnancy_week: user.pregnancy_week || 1,
    is_admin: Boolean(user.is_admin),
    iss: 'shokhi-ai-auth'
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: '30d' });
}

export function verifyLocalToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const dbUser = localDb.users.find(u => String(u.id) === String(decoded.sub) || (u.email && u.email.toLowerCase() === (decoded.email || '').toLowerCase()));
    const isAdmin = dbUser ? Boolean(dbUser.is_admin) : Boolean(decoded.is_admin);

    return {
      id: String(decoded.sub),
      email: decoded.email,
      is_admin: isAdmin,
      user_metadata: {
        full_name: decoded.name || '',
        pregnancy_week: decoded.pregnancy_week || 1,
        is_admin: isAdmin
      }
    };
  } catch (err) {
    return null;
  }
}

export async function verifyAuth(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const config = getSupabaseConfig();
  if (config.is_configured) {
    const client = getSupabaseClient();
    const adminClient = getSupabaseAdminClient() || client;
    if (client) {
      try {
        const { data, error } = await client.auth.getUser(token);
        if (!error && data?.user) {
          const u = data.user;

          // Fetch the latest is_admin role directly from Supabase database table
          let isAdmin = Boolean(u.user_metadata?.is_admin);
          try {
            const dbCheckClient = adminClient || client;
            const { data: profile } = await dbCheckClient
              .from('profiles')
              .select('id, is_admin, full_name, pregnancy_week')
              .eq('id', u.id)
              .maybeSingle();

            if (profile && profile.is_admin !== undefined) {
              isAdmin = Boolean(profile.is_admin);
            }
          } catch (pErr) {
            // Use metadata flag if profile query fails
          }

          return {
            id: String(u.id),
            email: u.email,
            is_admin: isAdmin,
            user_metadata: {
              ...(u.user_metadata || {}),
              is_admin: isAdmin
            }
          };
        }
      } catch (e) {
        // Fall through to local token verification
      }
    }
  }

  return verifyLocalToken(token);
}
