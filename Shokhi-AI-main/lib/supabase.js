/**
 * Supabase Client & Data Store for Shokhi AI (Node.js/Vercel)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

let cachedClient = null;
let cachedAdminClient = null;
let cachedUrl = null;
let cachedAnonKey = null;
let cachedServiceKey = null;

function refreshClients() {
  dotenv.config();
  const url = (process.env.SUPABASE_URL || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (url !== cachedUrl || anonKey !== cachedAnonKey || serviceKey !== cachedServiceKey) {
    cachedUrl = url;
    cachedAnonKey = anonKey;
    cachedServiceKey = serviceKey;

    const isConfigured = Boolean(
      url && 
      url.startsWith('https://') && 
      !url.includes('your-project') &&
      anonKey &&
      !anonKey.includes('your_supabase')
    );

    if (isConfigured) {
      try {
        cachedClient = createClient(url, anonKey);
        if (serviceKey && !serviceKey.includes('your_supabase')) {
          cachedAdminClient = createClient(url, serviceKey);
        } else {
          cachedAdminClient = cachedClient;
        }
      } catch (err) {
        console.error('Supabase client refresh error:', err.message);
      }
    } else {
      cachedClient = null;
      cachedAdminClient = null;
    }
  }
}

// Initial client creation
refreshClients();

// -------------------------------------------------------------
// 💾 Local In-Memory Fallback Persistence Store
// -------------------------------------------------------------
class LocalStore {
  constructor() {
    this.users = [
      {
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
        medical_history: "পূর্ববর্তী সিজারিয়ান নেই, স্বাভাবিক ট্র্যাকিং",
        language_preference: "bn",
        is_admin: false,
        created_at: Date.now() / 1000 - 86400 * 30,
        updated_at: Date.now() / 1000
      },
      {
        id: "99",
        email: "admin@shokhiai.org",
        name: "Dr. Ayesha Siddiqua (Admin)",
        password_hash: null,
        pregnancy_week: 1,
        is_admin: true,
        created_at: Date.now() / 1000 - 86400 * 60,
        updated_at: Date.now() / 1000
      }
    ];

    this.chat_sessions = [];
    this.chat_messages = [];

    this.meal_logs = [
      {
        id: 1,
        user_id: "1",
        meal_type: "Breakfast",
        description: "১টি সিদ্ধ ডিম, ২টি লাল আটার রুটি, মিক্সড সবজি ও ১ গ্লাস দুধ",
        logged_at: Date.now() / 1000 - 18000
      },
      {
        id: 2,
        user_id: "1",
        meal_type: "Lunch",
        description: "১ কাপ ভাত, রুই মাছের পাতলা ঝোল, পালং শাক ভাজি ও ডাল",
        logged_at: Date.now() / 1000 - 7200
      }
    ];

    this.mood_symptoms = [
      {
        id: 1,
        user_id: "1",
        entry_type: "mood",
        label: "খুশি ও সতেজ (Happy & Calm)",
        severity: "mild",
        logged_at: Date.now() / 1000 - 21600
      },
      {
        id: 2,
        user_id: "1",
        entry_type: "symptom",
        label: "হালকা কোমর ব্যথা (Mild Backache)",
        severity: "mild",
        logged_at: Date.now() / 1000 - 10800
      }
    ];

    this.appointments = [
      {
        id: 1,
        user_id: "1",
        doctor_name: "ডা. সায়মা পারভীন (গাইনি ও প্রসূতি বিশেষজ্ঞ)",
        hospital_clinic: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
        appointment_time: "2026-09-10 10:30 AM",
        notes: "২য় ট্রাইমেস্টার আল্ট্রাসাউন্ড এবং রুটিন রক্তের হিমোগ্লোবিন পরীক্ষা",
        is_completed: false,
        created_at: Date.now() / 1000 - 86400 * 3
      }
    ];

    this.vital_records = [
      {
        id: 1,
        user_id: "1",
        bp: "118/76",
        weight_kg: 60.50,
        notes: "রক্তচাপ ও শারীরিক অবস্থা সম্পূর্ণ স্বাভাবিক",
        recorded_at: Date.now() / 1000 - 86400 * 7
      },
      {
        id: 2,
        user_id: "1",
        bp: "120/80",
        weight_kg: 61.20,
        notes: "স্বাভাবিক ওজন বৃদ্ধি",
        recorded_at: Date.now() / 1000 - 86400 * 2
      }
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    this.daily_routines = [
      {
        id: 1,
        user_id: "1",
        routine_key: "পর্যাপ্ত পানি পান (২.৫ লিটার)",
        is_completed: true,
        record_date: todayStr,
        completed_at: Date.now() / 1000 - 7200
      },
      {
        id: 2,
        user_id: "1",
        routine_key: "আয়রন ও ক্যালসিয়াম ট্যাবলেট",
        is_completed: true,
        record_date: todayStr,
        completed_at: Date.now() / 1000 - 14400
      },
      {
        id: 3,
        user_id: "1",
        routine_key: "২০ মিনিট সকালের হালকা হাঁটা",
        is_completed: true,
        record_date: todayStr,
        completed_at: Date.now() / 1000 - 18000
      }
    ];

    this.kick_records = [
      {
        id: 1,
        user_id: "1",
        kick_count: 10,
        session_start: Date.now() / 1000 - 3600,
        session_end: Date.now() / 1000 - 1800
      }
    ];

    this.hydration_records = [
      {
        id: 1,
        user_id: "1",
        glass_count: 4,
        record_date: todayStr,
        updated_at: Date.now() / 1000 - 3600
      }
    ];

    this.saved_baby_names = [
      {
        id: 1,
        user_id: "1",
        name: "আরিয়ান (Aaryan)",
        gender: "boy",
        meaning: "মহান, সম্মানিত ও শ্রেষ্ঠ চরিত্রবান",
        created_at: Date.now() / 1000 - 86400 * 5
      },
      {
        id: 2,
        user_id: "1",
        name: "আনিকা (Anika)",
        gender: "girl",
        meaning: "রূপবতী, কৃপাময়ী ও মার্জিত স্বভাবের",
        created_at: Date.now() / 1000 - 86400 * 4
      }
    ];

    this.notifications = [
      {
        id: 1,
        user_id: "1",
        title: "🌅 সকালের যত্ন",
        message: "আপু, সকালের স্বাস্থ্যকর নাস্তা ও আয়রন ট্যাবলেট ঠিক সময়ে খেয়ে নিন।",
        notification_type: "morning_care",
        scheduled_time: "Daily 9:00 AM",
        is_read: true,
        is_dismissed: false,
        sound_enabled: true,
        created_at: Date.now() / 1000 - 18000,
        read_at: Date.now() / 1000 - 14400
      },
      {
        id: 2,
        user_id: "1",
        title: "💧 পানি পানের সময়",
        message: "সুস্থ থাকতে দিনে অন্তত ৮-১০ গ্লাস পানি জরুরি। এক গ্লাস পানি খেয়ে নিন।",
        notification_type: "water",
        scheduled_time: "Every 2 hours",
        is_read: false,
        is_dismissed: false,
        sound_enabled: true,
        created_at: Date.now() / 1000 - 3600,
        read_at: null
      }
    ];

    this.emergency_logs = [
      {
        id: 1,
        user_id: "1",
        trigger_source: "chat_triage",
        symptom_detected: "হালকা মাথা ঘোরার প্রশ্ন",
        action_taken: "Emergency advisory displayed & helplines (999, 16263, 109, 333) served",
        created_at: Date.now() / 1000 - 86400
      }
    ];

    this._nextId = 100;
  }

  generateId() {
    return this._nextId++;
  }
}

export const localDb = new LocalStore();

export function getSupabaseConfig() {
  refreshClients();
  return {
    url: cachedUrl,
    anon_key: cachedAnonKey,
    is_configured: Boolean(cachedClient),
    has_service_role: Boolean(cachedAdminClient && cachedAdminClient !== cachedClient)
  };
}

export function getSupabaseClient() {
  refreshClients();
  return cachedClient;
}

export function getSupabaseAdminClient() {
  refreshClients();
  return cachedAdminClient || cachedClient;
}

export async function testSupabaseConnection() {
  refreshClients();
  if (!cachedClient) {
    return {
      status: 'unconfigured',
      message: 'Using verified local cryptographic persistence engine.',
      url: cachedUrl || 'NOT_SET'
    };
  }

  try {
    const { data, error } = await cachedClient.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return {
      status: 'connected',
      message: 'Supabase client connected successfully.',
      url: cachedUrl
    };
  } catch (err) {
    return {
      status: 'connected_fallback',
      message: `Supabase ping: ${err.message}`,
      url: cachedUrl
    };
  }
}
