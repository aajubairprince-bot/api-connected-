import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

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
  const config = getSupabaseConfig();

  let meals = [];
  let moods = [];
  let appointments = [];
  let vitals = [];
  let routinesMap = {};
  let kickCount = 0;
  let names = [];
  let pregnancyWeek = 24;
  let dueDate = '2026-12-15';

  // 1. Query Supabase PostgreSQL Database Tables
  if (config.is_configured) {
    try {
      const supabase = getSupabaseAdminClient();

      const [
        mealsRes,
        moodsRes,
        appRes,
        vitalsRes,
        routinesRes,
        kicksRes,
        namesRes,
        profileRes
      ] = await Promise.all([
        supabase.from('meal_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }).limit(20),
        supabase.from('mood_symptoms').select('*').eq('user_id', userId).order('logged_at', { ascending: false }).limit(20),
        supabase.from('appointments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('vital_records').select('*').eq('user_id', userId).order('recorded_at', { ascending: false }).limit(20),
        supabase.from('daily_routines').select('*').eq('user_id', userId).eq('record_date', todayStr),
        supabase.from('kick_records').select('*').eq('user_id', userId).order('session_start', { ascending: false }).limit(1),
        supabase.from('saved_baby_names').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      ]);

      if (mealsRes?.data?.length) meals = mealsRes.data;
      if (moodsRes?.data?.length) moods = moodsRes.data;
      if (appRes?.data?.length) appointments = appRes.data;
      if (vitalsRes?.data?.length) vitals = vitalsRes.data;
      if (routinesRes?.data?.length) {
        routinesRes.data.forEach(r => {
          routinesMap[r.routine_key] = r.is_completed;
        });
      }
      if (kicksRes?.data?.length) kickCount = kicksRes.data[0].kick_count;
      if (namesRes?.data?.length) names = namesRes.data;
      if (profileRes?.data) {
        pregnancyWeek = profileRes.data.pregnancy_week || 24;
        dueDate = profileRes.data.due_date || dueDate;
      }
    } catch (err) {
      console.warn('[Supabase overview query error]:', err.message);
    }
  }

  // 2. Fallback / Merge with local store (for testing & offline reliability)
  if (!meals.length) {
    meals = localDb.meal_logs
      .filter(m => String(m.user_id) === userId)
      .sort((a, b) => b.logged_at - a.logged_at)
      .slice(0, 20);
  }
  if (!moods.length) {
    moods = localDb.mood_symptoms
      .filter(m => String(m.user_id) === userId)
      .sort((a, b) => b.logged_at - a.logged_at)
      .slice(0, 20);
  }
  if (!appointments.length) {
    appointments = localDb.appointments
      .filter(a => String(a.user_id) === userId)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 20);
  }
  if (!vitals.length) {
    vitals = localDb.vital_records
      .filter(v => String(v.user_id) === userId)
      .sort((a, b) => b.recorded_at - a.recorded_at)
      .slice(0, 20);
  }
  if (Object.keys(routinesMap).length === 0) {
    const localRoutines = localDb.daily_routines
      .filter(r => String(r.user_id) === userId && r.record_date === todayStr);
    localRoutines.forEach(r => {
      routinesMap[r.routine_key] = r.is_completed;
    });
  }
  if (!kickCount) {
    const latestKick = localDb.kick_records
      .filter(k => String(k.user_id) === userId)
      .sort((a, b) => b.session_start - a.session_start)[0];
    if (latestKick) kickCount = latestKick.kick_count;
  }
  if (!names.length) {
    names = localDb.saved_baby_names
      .filter(n => String(n.user_id) === userId)
      .sort((a, b) => b.created_at - a.created_at);
  }

  if (!localDb.hydration_records) localDb.hydration_records = [];
  const latestHydration = localDb.hydration_records.find(
    h => String(h.user_id) === userId && h.record_date === todayStr
  );

  return sendJsonResponse(res, 200, {
    success: true,
    meals: meals.map(m => ({ id: m.id, meal_type: m.meal_type, description: m.description, logged_at: m.logged_at })),
    mood_symptoms: moods.map(m => ({ id: m.id, entry_type: m.entry_type, label: m.label, severity: m.severity, logged_at: m.logged_at })),
    appointments: appointments.map(a => ({ id: a.id, doctor_name: a.doctor_name, appointment_time: a.appointment_time, hospital_clinic: a.hospital_clinic })),
    vitals: vitals.map(v => ({ id: v.id, bp: v.bp, weight_kg: v.weight_kg, recorded_at: v.recorded_at })),
    routines: routinesMap,
    kick_count: kickCount,
    hydration_count: latestHydration ? latestHydration.glass_count : 0,
    pregnancy_week: pregnancyWeek,
    due_date: dueDate,
    names: names.map(n => ({ id: n.id, name: n.name, gender: n.gender, meaning: n.meaning }))
  });
}
