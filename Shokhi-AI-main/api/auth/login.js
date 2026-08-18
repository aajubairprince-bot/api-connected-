import bcrypt from 'bcryptjs';
import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { generateToken } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!email || !password) {
    return sendJsonError(res, 400, 'Email and password are required.');
  }

  let user = localDb.users.find(u => u.email && u.email.toLowerCase() === email);

  if (!user) {
    // If demo mother requested in testing
    if (email === 'nusrat.jahan@example.com') {
      const demoUser = {
        id: "1",
        email: "nusrat.jahan@example.com",
        name: "নুসরাত জাহান",
        password_hash: null,
        pregnancy_week: 24,
        due_date: "2026-12-15",
        blood_group: "B+",
        emergency_contact_name: "মো. রফিকুল ইসলাম",
        emergency_contact_phone: "+8801711223344",
        allergies: "ডিম, পিনাট",
        medical_history: "স্বাভাবিক ট্র্যাকিং",
        language_preference: "bn",
        is_admin: false,
        created_at: Date.now() / 1000 - 86400 * 30,
        updated_at: Date.now() / 1000
      };
      localDb.users.push(demoUser);
      user = demoUser;
    } else {
      return sendJsonError(res, 401, 'Invalid email or password.');
    }
  }

  if (user.password_hash) {
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return sendJsonError(res, 401, 'Invalid email or password.');
    }
  }

  const token = generateToken(user);

  sendJsonResponse(res, 200, {
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      pregnancy_week: user.pregnancy_week || 1,
      is_admin: Boolean(user.is_admin)
    }
  });
}
