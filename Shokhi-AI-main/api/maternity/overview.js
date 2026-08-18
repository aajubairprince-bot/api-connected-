import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const todayStr = new Date().toISOString().slice(0, 10);

  const meals = localDb.meal_logs
    .filter(m => String(m.user_id) === userId)
    .sort((a, b) => b.logged_at - a.logged_at)
    .slice(0, 20);

  const moods = localDb.mood_symptoms
    .filter(m => String(m.user_id) === userId)
    .sort((a, b) => b.logged_at - a.logged_at)
    .slice(0, 20);

  const appointments = localDb.appointments
    .filter(a => String(a.user_id) === userId)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 20);

  const vitals = localDb.vital_records
    .filter(v => String(v.user_id) === userId)
    .sort((a, b) => b.recorded_at - a.recorded_at)
    .slice(0, 20);

  const routines = localDb.daily_routines
    .filter(r => String(r.user_id) === userId && r.record_date === todayStr);

  const routinesMap = {};
  routines.forEach(r => {
    routinesMap[r.routine_key] = r.is_completed;
  });

  const latestKick = localDb.kick_records
    .filter(k => String(k.user_id) === userId)
    .sort((a, b) => b.session_start - a.session_start)[0];

  if (!localDb.hydration_records) {
    localDb.hydration_records = [];
  }
  const latestHydration = localDb.hydration_records.find(
    h => String(h.user_id) === userId && h.record_date === todayStr
  );

  const names = localDb.saved_baby_names
    .filter(n => String(n.user_id) === userId)
    .sort((a, b) => b.created_at - a.created_at);

  const userProfile = localDb.users.find(u => String(u.id) === userId);

  sendJsonResponse(res, 200, {
    success: true,
    meals: meals.map(m => ({ id: m.id, meal_type: m.meal_type, description: m.description, logged_at: m.logged_at })),
    mood_symptoms: moods.map(m => ({ id: m.id, entry_type: m.entry_type, label: m.label, severity: m.severity, logged_at: m.logged_at })),
    appointments: appointments.map(a => ({ id: a.id, doctor_name: a.doctor_name, appointment_time: a.appointment_time, hospital_clinic: a.hospital_clinic })),
    vitals: vitals.map(v => ({ id: v.id, bp: v.bp, weight_kg: v.weight_kg, recorded_at: v.recorded_at })),
    routines: routinesMap,
    kick_count: latestKick ? latestKick.kick_count : 0,
    hydration_count: latestHydration ? latestHydration.glass_count : 0,
    pregnancy_week: userProfile?.pregnancy_week || 24,
    due_date: userProfile?.due_date || '2026-12-15',
    names: names.map(n => ({ id: n.id, name: n.name, gender: n.gender, meaning: n.meaning }))
  });
}
