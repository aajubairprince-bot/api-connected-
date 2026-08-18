import bcrypt from 'bcryptjs';
import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { generateToken } from '../../lib/auth.js';
import { escapeHtml } from '../../lib/validation.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const name = escapeHtml((body.name || 'New Mother').trim());
  const pregnancyWeek = parseInt(body.pregnancy_week || 1, 10);
  const isAdmin = body.is_admin === true;

  if (!email || !password) {
    return sendJsonError(res, 400, 'Email and password are required.');
  }

  // Check duplicate email
  const existing = localDb.users.find(u => u.email === email);
  if (existing) {
    return sendJsonError(res, 409, 'User with this email already exists.');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = localDb.generateId();

  const user = {
    id: userId,
    email,
    name,
    password_hash: passwordHash,
    pregnancy_week: isNaN(pregnancyWeek) ? 1 : pregnancyWeek,
    due_date: null,
    blood_group: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    allergies: null,
    medical_history: null,
    language_preference: 'bn',
    is_admin: isAdmin,
    created_at: Date.now() / 1000,
    updated_at: Date.now() / 1000
  };

  localDb.users.push(user);
  const token = generateToken(user);

  sendJsonResponse(res, 201, {
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      pregnancy_week: user.pregnancy_week,
      is_admin: user.is_admin
    }
  });
}
