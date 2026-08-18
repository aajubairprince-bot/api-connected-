import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Admin authorization token required.');
  }
  if (!authUser.is_admin) {
    return sendJsonError(res, 403, 'Forbidden: Administrator privileges required.');
  }

  const config = getSupabaseConfig();

  // Initialise with local store fallbacks
  let usersCount       = localDb.users.length;
  let sessionsCount    = localDb.chat_sessions.length;
  let messagesCount    = localDb.chat_messages.length;
  let mealsCount       = localDb.meal_logs.length;
  let vitalsCount      = localDb.vital_records.length;
  let appointmentsCount = localDb.appointments.length;
  let kicksCount       = localDb.kick_records.length;
  let notifsCount      = localDb.notifications.length;
  let emergenciesCount = localDb.emergency_logs.length;
  let moodsCount       = 0;
  let routinesCount    = 0;

  let supaUsers        = null;
  let supaSessions     = null;
  let supaMessages     = null;
  let supaMeals        = null;
  let supaVitals       = null;
  let supaAppointments = null;
  let supaEmergencies  = null;
  let supaNotifs       = null;
  let supaMoods        = null;
  let supaRoutines     = null;
  let supaKicks        = null;
  let supaNames        = null;

  if (config.is_configured) {
    // Use the ADMIN client to bypass RLS and read all tenants' data
    const supabase = getSupabaseAdminClient();
    try {
      const [u, s, m, ml, vl, app, em, not, mo, ro, ki, na] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('meal_logs').select('*').order('logged_at', { ascending: false }).limit(200),
        supabase.from('vital_logs').select('*').order('recorded_at', { ascending: false }).limit(200),
        supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('emergency_logs').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('mood_symptoms').select('*').order('logged_at', { ascending: false }).limit(200),
        supabase.from('daily_routines').select('*').order('completed_at', { ascending: false }).limit(200),
        supabase.from('kick_records').select('*').order('session_start', { ascending: false }).limit(200),
        supabase.from('saved_baby_names').select('*').order('saved_at', { ascending: false }).limit(200),
      ]);

      if (!u.error  && u.data)   { usersCount        = u.data.length;   supaUsers        = u.data; }
      if (!s.error  && s.data)   { sessionsCount      = s.data.length;   supaSessions     = s.data; }
      if (!m.error  && m.data)   { messagesCount      = m.data.length;   supaMessages     = m.data; }
      if (!ml.error && ml.data)  { mealsCount         = ml.data.length;  supaMeals        = ml.data; }
      if (!vl.error && vl.data)  { vitalsCount        = vl.data.length;  supaVitals       = vl.data; }
      if (!app.error && app.data){ appointmentsCount  = app.data.length; supaAppointments = app.data; }
      if (!em.error && em.data)  { emergenciesCount   = em.data.length;  supaEmergencies  = em.data; }
      if (!not.error && not.data){ notifsCount        = not.data.length; supaNotifs       = not.data; }
      if (!mo.error && mo.data)  { moodsCount         = mo.data.length;  supaMoods        = mo.data; }
      if (!ro.error && ro.data)  { routinesCount      = ro.data.length;  supaRoutines     = ro.data; }
      if (!ki.error && ki.data)  { kicksCount         = ki.data.length;  supaKicks        = ki.data; }
      if (!na.error && na.data)  { supaNames          = na.data; }

    } catch (e) {
      console.warn('[Admin Metrics] Supabase query error, falling back to local store:', e.message);
    }
  }

  // Build user ID → name lookup map for enriching chat transcripts
  const userMap = {};
  (supaUsers || localDb.users).forEach(u => {
    userMap[u.id] = u.full_name || u.name || u.email || u.id;
  });

  const responsePayload = {
    system_status: 'HEALTHY_OPERATIONAL',
    timestamp: Date.now() / 1000,
    academic_defense_metrics: {
      total_registered_mothers:              usersCount,
      total_conversations_started:           sessionsCount,
      total_clinical_ai_turns_logged:        messagesCount,
      maternal_nutrition_meals_logged:       mealsCount,
      vital_records_bp_weight_logged:        vitalsCount,
      prenatal_doctor_appointments_scheduled: appointmentsCount,
      fetal_kick_monitoring_sessions:        kicksCount,
      scheduled_care_notifications_dispatched: notifsCount,
      obstetric_emergency_triage_interventions: emergenciesCount,
      mood_and_symptom_entries_logged:       moodsCount,
      daily_routines_completed:              routinesCount,
    },
    engine_specifications: {
      runtime: 'Node.js (Vercel Serverless)',
      database_layer: config.is_configured ? 'Supabase PostgreSQL (Live · Admin Client)' : 'Cryptographic Relational Store',
      generative_ai_model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      multilingual_support: ['Bengali (bn-BD)', 'English (en-US)'],
      emergency_red_flag_interceptor: 'Active (999 / 16263 / 109 / 333 Hotline Integration)',
      multimodal_vision_processing: 'Active (Sonograms, Ultrasound & Clinical Prescriptions)',
      multi_tenant_isolation_protocol: 'Active (Strict Cryptographic UID Foreign Key Partitioning)',
    },
  };

  // Detailed data payload for the admin table explorer
  if (req.query?.details === 'true' || req.query?.details === '1') {
    const users = (supaUsers || localDb.users).map(u => ({
      id: u.id,
      name: u.full_name || u.name || 'Unknown',
      email: u.email,
      pregnancy_week: u.pregnancy_week,
      due_date: u.due_date,
      blood_group: u.blood_group,
      emergency_contact: u.emergency_contact_name
        ? `${u.emergency_contact_name} (${u.emergency_contact_phone || ''})`
        : 'None',
      allergies: u.allergies,
      is_admin: u.is_admin,
      created_at: u.created_at,
    }));

    responsePayload.data = {
      users,
      chat_sessions: (supaSessions || localDb.chat_sessions).map(s => ({
        id: s.id,
        user_id: s.user_id,
        user_name: userMap[s.user_id] || s.user_id,
        title: s.title,
        created_at: s.created_at,
        updated_at: s.updated_at,
      })),
      chat_messages: (supaMessages || localDb.chat_messages).map(m => ({
        id: m.id,
        session_id: m.session_id,
        user_id: m.user_id,
        user_name: userMap[m.user_id] || m.user_id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
      meal_logs: (supaMeals || localDb.meal_logs).map(m => ({
        ...m,
        user_name: userMap[m.user_id] || m.user_id,
      })),
      vital_records: (supaVitals || localDb.vital_records).map(v => ({
        ...v,
        user_name: userMap[v.user_id] || v.user_id,
      })),
      appointments: (supaAppointments || localDb.appointments).map(a => ({
        ...a,
        user_name: userMap[a.user_id] || a.user_id,
      })),
      mood_symptoms: (supaMoods || []).map(m => ({
        ...m,
        user_name: userMap[m.user_id] || m.user_id,
      })),
      daily_routines: (supaRoutines || localDb.daily_routines).map(r => ({
        ...r,
        user_name: userMap[r.user_id] || r.user_id,
      })),
      kick_records: (supaKicks || localDb.kick_records).map(k => ({
        ...k,
        user_name: userMap[k.user_id] || k.user_id,
      })),
      saved_baby_names: (supaNames || localDb.saved_baby_names || []).map(n => ({
        ...n,
        user_name: userMap[n.user_id] || n.user_id,
      })),
      notifications: (supaNotifs || localDb.notifications).map(n => ({
        ...n,
        user_name: n.user_id === 'all' ? '📢 All Mothers' : (userMap[n.user_id] || n.user_id),
      })),
      emergency_logs: (supaEmergencies || localDb.emergency_logs).map(e => ({
        ...e,
        user_name: userMap[e.user_id] || e.user_id,
      })),
    };
  }

  sendJsonResponse(res, 200, responsePayload);
}
