import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const created = [];

  // Helper to push notification if not recently sent
  function addNotificationIfMissing(type, title, message, scheduledTime = 'Immediate', cooldownSeconds = 14400) {
    const existing = localDb.notifications.find(
      n => String(n.user_id) === userId && n.notification_type === type && (Date.now() / 1000 - n.created_at) < cooldownSeconds
    );
    if (!existing) {
      const notif = {
        id: localDb.generateId(),
        user_id: userId,
        title,
        message,
        notification_type: type,
        scheduled_time: scheduledTime,
        is_read: false,
        is_dismissed: false,
        sound_enabled: true,
        created_at: Date.now() / 1000,
        read_at: null
      };
      localDb.notifications.unshift(notif);
      created.push(notif);
    }
  }

  // 1. Hydration evaluation
  if (!localDb.hydration_records) localDb.hydration_records = [];
  const hydration = localDb.hydration_records.find(
    h => String(h.user_id) === userId && h.record_date === todayStr
  );
  const glassCount = hydration ? hydration.glass_count : 0;
  if (glassCount < 8) {
    const remaining = 8 - glassCount;
    addNotificationIfMissing(
      'water',
      '💧 পানি পানের রিমাইন্ডার',
      `আপু, আজকের লক্ষ্য পূরণে আরও ${remaining} গ্লাস পানি খাওয়া বাকি রয়েছে। শরীর আর্দ্র ও সুস্থ রাখতে এক গ্লাস পানি পান করুন।`,
      'Daily Habit',
      10800
    );
  }

  // 2. Baby Kick Counter evaluation
  const latestKick = localDb.kick_records
    .filter(k => String(k.user_id) === userId)
    .sort((a, b) => b.session_start - a.session_start)[0];
  const kickCount = latestKick ? latestKick.kick_count : 0;
  if (kickCount < 10) {
    addNotificationIfMissing(
      'kick_count',
      '👶 বেবি কিক কাউন্ট রিমাইন্ডার',
      'খাবার খাওয়ার পর আরাম করে বসে ছোট্ট সোনার নড়াচড়া খেয়াল করুন। ২ ঘণ্টায় ১০টি কিক গণনা করা স্বাভাবিক লক্ষণের নির্দেশক।',
      'Daily Kick Track',
      14400
    );
  }

  // 3. 🩺 Intelligent Proximity Doctor Appointment Notifications
  const upcomingApps = localDb.appointments
    .filter(a => String(a.user_id) === userId && !a.is_completed)
    .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));

  upcomingApps.forEach(app => {
    try {
      const appDate = new Date(app.appointment_time);
      if (isNaN(appDate.getTime())) return;

      const diffMs = appDate.getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const location = app.hospital_clinic ? `(${app.hospital_clinic})` : '';
      const formattedDate = appDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const formattedTime = appDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Case A: Today's Appointment (within 24h or today)
      if (diffHours >= 0 && diffHours <= 24) {
        addNotificationIfMissing(
          `appointment_today_${app.id}`,
          `🚨 আজই আপনার ডাক্তার অ্যাপয়েন্টমেন্ট!`,
          `আপু, আজ ${formattedTime}-এ ${app.doctor_name}-এর সাথে আপনার নির্ধারিত চেকআপ রয়েছে ${location}। প্রয়োজনীয় পূর্ববর্তী রিপোর্ট, আল্ট্রাসাউন্ড ও প্রেসক্রিপশন ফাইল সাথে রাখুন।`,
          `${formattedTime} Today`,
          28800
        );
      }
      // Case B: Tomorrow's Appointment (24h - 48h)
      else if (diffHours > 24 && diffHours <= 48) {
        addNotificationIfMissing(
          `appointment_tomorrow_${app.id}`,
          `🩺 আগামীকাল ডাক্তার অ্যাপয়েন্টমেন্ট স্মরণিকা`,
          `আগামীকাল ${formattedDate} (${formattedTime})-এ ${app.doctor_name}-এর সাথে আপনার অ্যাপয়েন্টমেন্ট নির্ধারিত আছে। সময়মতো পৌঁছানোর প্রস্তুতি নিন।`,
          `Tomorrow ${formattedTime}`,
          43200
        );
      }
      // Case C: Close Appointment within 7 Days
      else if (diffDays > 1 && diffDays <= 7) {
        addNotificationIfMissing(
          `appointment_close_${app.id}`,
          `📅 আসন্ন ডাক্তার চেকআপ স্মরণিকা (${diffDays} দিন বাকি)`,
          `আগামী ${formattedDate}-এ ${app.doctor_name}-এর সাথে আপনার গর্ভকালীন ফলো-আপ চেকআপ রয়েছে ${location}।`,
          `${diffDays} days away`,
          86400
        );
      }
    } catch (dateErr) {
      console.warn('[Appointment Notification] Parse notice:', dateErr.message);
    }
  });

  // 4. Daily Routines evaluation
  const routines = localDb.daily_routines.filter(r => String(r.user_id) === userId && r.record_date === todayStr);
  const uncompletedRoutines = routines.filter(r => !r.is_completed);
  if (uncompletedRoutines.length > 0) {
    addNotificationIfMissing(
      'routine',
      '📋 দৈনিক স্বাস্থ্য রুটিন',
      `আপু, আজকের ${uncompletedRoutines.length}টি অভ্যাস এখনও বাকি রয়েছে। ভিটামিন ও পরিমিত বিশ্রাম সম্পন্ন করে চেকলিস্টে টিক দিন।`,
      'Daily Routine',
      21600
    );
  }

  sendJsonResponse(res, 200, {
    success: true,
    eval_timestamp: Date.now() / 1000,
    notifications_created: created.length,
    notifications: localDb.notifications
      .filter(n => (String(n.user_id) === userId || n.user_id === 'all') && !n.is_dismissed)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 30)
  });
}
