import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { computePregnancyMetrics, escapeHtml } from '../../lib/validation.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
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
      due_date: null,
      blood_group: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      allergies: null,
      medical_history: null,
      language_preference: 'bn',
      is_admin: authUser.is_admin,
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    };
    localDb.users.push(dbUser);
  }

  if (req.method === 'GET') {
    const metrics = computePregnancyMetrics(dbUser.pregnancy_week, dbUser.due_date);
    return sendJsonResponse(res, 200, {
      success: true,
      profile: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        pregnancy_week: dbUser.pregnancy_week,
        due_date: dbUser.due_date,
        blood_group: dbUser.blood_group,
        emergency_contact_name: dbUser.emergency_contact_name,
        emergency_contact_phone: dbUser.emergency_contact_phone,
        allergies: dbUser.allergies,
        medical_history: dbUser.medical_history,
        language_preference: dbUser.language_preference || 'bn',
        is_admin: dbUser.is_admin,
        gestational_metrics: metrics
      }
    });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const body = req.body || {};
    if (body.name !== undefined) dbUser.name = escapeHtml(String(body.name).trim());
    if (body.pregnancy_week !== undefined) dbUser.pregnancy_week = parseInt(body.pregnancy_week, 10) || 1;
    if (body.due_date !== undefined) dbUser.due_date = body.due_date ? String(body.due_date).trim() : null;
    if (body.blood_group !== undefined) dbUser.blood_group = body.blood_group ? escapeHtml(String(body.blood_group).trim()) : null;
    if (body.emergency_contact_name !== undefined) dbUser.emergency_contact_name = body.emergency_contact_name ? escapeHtml(String(body.emergency_contact_name).trim()) : null;
    if (body.emergency_contact_phone !== undefined) dbUser.emergency_contact_phone = body.emergency_contact_phone ? escapeHtml(String(body.emergency_contact_phone).trim()) : null;
    if (body.allergies !== undefined) dbUser.allergies = body.allergies ? escapeHtml(String(body.allergies).trim()) : null;
    if (body.medical_history !== undefined) dbUser.medical_history = body.medical_history ? escapeHtml(String(body.medical_history).trim()) : null;
    if (body.language_preference !== undefined) dbUser.language_preference = body.language_preference;
    dbUser.updated_at = Date.now() / 1000;

    const metrics = computePregnancyMetrics(dbUser.pregnancy_week, dbUser.due_date);
    return sendJsonResponse(res, 200, {
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        pregnancy_week: dbUser.pregnancy_week,
        due_date: dbUser.due_date,
        blood_group: dbUser.blood_group,
        emergency_contact_name: dbUser.emergency_contact_name,
        emergency_contact_phone: dbUser.emergency_contact_phone,
        allergies: dbUser.allergies,
        medical_history: dbUser.medical_history,
        language_preference: dbUser.language_preference,
        is_admin: dbUser.is_admin,
        gestational_metrics: metrics
      }
    });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
