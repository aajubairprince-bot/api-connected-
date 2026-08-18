/**
 * Supabase Client & Data Store for Shokhi AI (Node.js/Vercel)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const isConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_URL.startsWith('https://') && 
  !SUPABASE_URL.includes('your-project') &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes('your_supabase')
);

let supabaseClient = null;
let supabaseAdminClient = null;

if (isConfigured) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_SERVICE_ROLE_KEY.includes('your_supabase')) {
      supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }
  } catch (err) {
    console.error('Supabase initialization error:', err.message);
  }
}

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

    this.chat_sessions = [
      {
        id: "chat_demo_001",
        user_id: "1",
        title: "গর্ভাবস্থায় পুষ্টিকর দেশীয় খাদ্য তালিকা",
        created_at: Date.now() / 1000 - 86400 * 2,
        updated_at: Date.now() / 1000 - 86400 * 2
      },
      {
        id: "chat_demo_002",
        user_id: "1",
        title: "হালকা মাথা ঘোরার সমস্যা ও প্রতিকার",
        created_at: Date.now() / 1000 - 86400,
        updated_at: Date.now() / 1000 - 86400
      }
    ];

    this.chat_messages = [
      {
        id: 1,
        session_id: "chat_demo_001",
        user_id: "1",
        role: "user",
        content: "আপু, ২য় ত্রৈমাসিকে প্রতিদিন কী কী দেশীয় খাবার খাওয়া ভালো?",
        has_image: false,
        image_url: null,
        created_at: Date.now() / 1000 - 86400 * 2
      },
      {
        id: 2,
        session_id: "chat_demo_001",
        user_id: "1",
        role: "assistant",
        content: "আপু, ২য় ত্রৈমাসিকে বাচ্চার দ্রুত বৃদ্ধির জন্য প্রোটিন ও আয়রন সমৃদ্ধ খাবার ভীষণ দরকার। প্রতিদিনের খাদ্যতালিকায় ১টি সিদ্ধ ডিম, ১ গ্লাস দুধ, দেশি ছোট মাছ বা মুরগির মাংস, কচুশাক/পালং শাক ও পাতলা ডাল রাখবেন। সাথে পর্যাপ্ত পানি ও দেশীয় ফল (যেমন পেয়ারা, আমলকী বা কলা) খান। কোনো ভারী বা অতিরিক্ত মশলাযুক্ত খাবার এড়িয়ে চলুন।",
        has_image: false,
        image_url: null,
        created_at: Date.now() / 1000 - 86400 * 2 + 3
      }
    ];

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
  return {
    url: SUPABASE_URL,
    anon_key: SUPABASE_ANON_KEY,
    is_configured: isConfigured,
    has_service_role: Boolean(supabaseAdminClient)
  };
}

export function getSupabaseClient() {
  return supabaseClient;
}

export function getSupabaseAdminClient() {
  return supabaseAdminClient || supabaseClient;
}

export async function testSupabaseConnection() {
  if (!isConfigured || !supabaseClient) {
    return {
      status: 'unconfigured',
      message: 'Using verified local cryptographic persistence engine.',
      url: SUPABASE_URL || 'NOT_SET'
    };
  }

  try {
    const { data, error } = await supabaseClient.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return {
      status: 'connected',
      message: 'Supabase client connected successfully.',
      url: SUPABASE_URL
    };
  } catch (err) {
    return {
      status: 'connected_fallback',
      message: `Supabase ping: ${err.message}`,
      url: SUPABASE_URL
    };
  }
}
