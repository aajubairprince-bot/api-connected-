-- ==============================================================================
-- 🌸 Shokhi AI (সখী AI) — Migration 002: Seed Maternal Data for Supabase
-- Target: Supabase CLI & Dashboard SQL Editor
-- ==============================================================================

DO $$
DECLARE
    user1_id text := '11111111-1111-1111-1111-111111111111';
    user2_id text := '22222222-2222-2222-2222-222222222222';
    admin_id text := '99999999-9999-9999-9999-999999999999';
BEGIN

    -- 1. Seed Chat Sessions
    INSERT INTO public.chat_sessions (id, user_id, title, created_at, updated_at)
    VALUES
        ('chat_demo_001', user1_id, 'গর্ভাবস্থায় পুষ্টিকর দেশীয় খাদ্য তালিকা', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
        ('chat_demo_002', user1_id, 'হালকা মাথা ঘোরার সমস্যা ও প্রতিকার', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
        ('chat_demo_003', user2_id, '৩য় ট্রাইমেস্টারে বাচ্চার নড়াচড়া পর্যবেক্ষণ', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Seed Chat Messages
    INSERT INTO public.chat_messages (session_id, user_id, role, content, has_image, created_at)
    VALUES
        ('chat_demo_001', user1_id, 'user', 'আপু, ২য় ত্রৈমাসিকে প্রতিদিন কী কী দেশীয় খাবার খাওয়া ভালো?', FALSE, NOW() - INTERVAL '2 days'),
        ('chat_demo_001', user1_id, 'assistant', 'আপু, ২য় ত্রৈমাসিকে বাচ্চার দ্রুত বৃদ্ধির জন্য প্রোটিন ও আয়রন সমৃদ্ধ খাবার ভীষণ দরকার। প্রতিদিনের খাদ্যতালিকায় ১টি সিদ্ধ ডিম, ১ গ্লাস দুধ, দেশি ছোট মাছ বা মুরগির মাংস, কচুশাক/পালং শাক ও পাতলা ডাল রাখবেন। সাথে পর্যাপ্ত পানি ও দেশীয় ফল (যেমন পেয়ারা, আমলকী বা কলা) খান। কোনো ভারী বা অতিরিক্ত মশলাযুক্ত খাবার এড়িয়ে চলুন।', FALSE, NOW() - INTERVAL '2 days' + INTERVAL '3 seconds'),
        
        ('chat_demo_002', user1_id, 'user', 'আপু, সকালের দিকে একটু মাথা ঘোরে, কী করতে পারি?', FALSE, NOW() - INTERVAL '1 day'),
        ('chat_demo_002', user1_id, 'assistant', 'আপু, গর্ভাবস্থায় রক্তচাপের সামান্য পরিবর্তন বা সুগার কমে যাওয়ার কারণে সকালে এমন হতে পারে। সকালে ঘুম ভাঙার পর বিছানা থেকে হঠাৎ না উঠে কয়েক মিনিট বসে থাকুন। বিছানার পাশে হালকা বিস্কুট বা মুড়ি রাখুন এবং তা খেয়ে ধীরে উঠুন। দিনে অন্তত ৮-১০ গ্লাস পানি পান করুন। যদি সমস্যাটি ক্রমাগত থাকে বা চোখে ঝাপসা দেখেন, তবে অবিলম্বে ডাক্তারের সাথে কথা বলুন।', FALSE, NOW() - INTERVAL '1 day' + INTERVAL '4 seconds'),

        ('chat_demo_003', user2_id, 'user', 'বাচ্চার নড়াচড়া কতবার হওয়া স্বাভাবিক?', FALSE, NOW() - INTERVAL '12 hours'),
        ('chat_demo_003', user2_id, 'assistant', 'আপু, ২৮তম সপ্তাহের পর থেকে বাচ্চার কিক বা নড়াচড়া খেয়াল রাখা খুব গুরুত্বপূর্ণ। খাবার খাওয়ার পর বাম কাতে শুয়ে বা শান্ত হয়ে বসে গণনা করবেন। ২ ঘণ্টার মধ্যে অন্তত ১০ বার বাচ্চার স্পষ্ট নড়াচড়া অনুভূত হওয়া স্বাভাবিক ও স্বাস্থ্যকর। যদি দীর্ঘক্ষণ কোনো নড়াচড়া টের না পান, তবে মিষ্টি কিছু খেয়ে আবার দেখুন এবং প্রয়োজনে দ্রুত ডাক্তারের শরণাপন্ন হোন।', FALSE, NOW() - INTERVAL '12 hours' + INTERVAL '3 seconds')
    ON CONFLICT DO NOTHING;

    -- 3. Seed Nutritional Meal Logs
    INSERT INTO public.meal_logs (user_id, meal_type, description, logged_at)
    VALUES
        (user1_id, 'Breakfast', '১টি সিদ্ধ ডিম, ২টি লাল আটার রুটি, মিক্সড সবজি ও ১ গ্লাস দুধ', NOW() - INTERVAL '5 hours'),
        (user1_id, 'Lunch', '১ কাপ ভাত, রুই মাছের পাতলা ঝোল, পালং শাক ভাজি ও ডাল', NOW() - INTERVAL '2 hours'),
        (user1_id, 'Snack', 'ভেজা কাঠবাদাম, ১টি আপেল ও এক বাটি টক দই', NOW() - INTERVAL '1 hour'),
        (user2_id, 'Breakfast', 'ডিম পোচ, ওটস খিচুড়ি ও ১টি পাকা কলা', NOW() - INTERVAL '6 hours'),
        (user2_id, 'Lunch', 'ভাত, দেশি মুরগির মাংস, করলা ভাজি ও ডাল', NOW() - INTERVAL '3 hours')
    ON CONFLICT DO NOTHING;

    -- 4. Seed Mood & Symptoms Records
    INSERT INTO public.mood_symptoms (user_id, entry_type, label, severity, logged_at)
    VALUES
        (user1_id, 'mood', 'খুশি ও সতেজ (Happy & Calm)', 'mild', NOW() - INTERVAL '6 hours'),
        (user1_id, 'symptom', 'হালকা কোমর ব্যথা (Mild Backache)', 'mild', NOW() - INTERVAL '3 hours'),
        (user1_id, 'mood', 'মানসিক প্রশান্তি (Peaceful)', 'mild', NOW() - INTERVAL '1 hour'),
        (user2_id, 'symptom', 'পায়ে হালকা ফোলাভাব (Mild Swelling)', 'mild', NOW() - INTERVAL '4 hours'),
        (user2_id, 'mood', 'ক্লান্তি (Fatigue)', 'moderate', NOW() - INTERVAL '2 hours')
    ON CONFLICT DO NOTHING;

    -- 5. Seed Prenatal Doctor Appointments
    INSERT INTO public.appointments (user_id, doctor_name, hospital_clinic, appointment_time, notes, is_completed, created_at)
    VALUES
        (user1_id, 'ডা. সায়মা পারভীন (গাইনি ও প্রসূতি বিশেষজ্ঞ)', 'পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি', '2026-09-10 10:30 AM', '২য় ট্রাইমেস্টার আল্ট্রাসাউন্ড এবং রুটিন রক্তের হিমোগ্লোবিন পরীক্ষা', FALSE, NOW() - INTERVAL '3 days'),
        (user1_id, 'ডা. রেহানা বেগম', 'স্কয়ার হাসপাতাল', '2026-10-05 04:00 PM', 'টিটেনাস (TT) টিকার দ্বিতীয় ডোজ ও রক্তচাপ ফলোআপ', FALSE, NOW() - INTERVAL '1 day'),
        (user2_id, 'ডা. নাজনীন আহমেদ', 'ইবনে সিনা মেডিকেল', '2026-08-25 11:00 AM', 'গ্রোথ স্ক্যান ও ডেলিভারি প্ল্যানিং কনসালটেশন', FALSE, NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- 6. Seed Maternal Vital Records (Blood Pressure & Weight)
    INSERT INTO public.vital_records (user_id, bp, weight_kg, notes, recorded_at)
    VALUES
        (user1_id, '118/76', 60.50, 'রক্তচাপ ও শারীরিক অবস্থা সম্পূর্ণ স্বাভাবিক', NOW() - INTERVAL '7 days'),
        (user1_id, '120/80', 61.20, 'স্বাভাবিক ওজন বৃদ্ধি', NOW() - INTERVAL '4 days'),
        (user1_id, '120/78', 61.80, 'সর্বশেষ চেকিং: পারফেক্ট রিডিং', NOW() - INTERVAL '1 day'),
        (user2_id, '122/82', 68.40, '৩য় ট্রাইমেস্টার পর্যবেক্ষণ', NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- 7. Seed Daily Habits & Routines
    INSERT INTO public.daily_routines (user_id, routine_key, is_completed, record_date, completed_at)
    VALUES
        (user1_id, 'পর্যাপ্ত পানি পান (২.৫ লিটার)', TRUE, CURRENT_DATE::text, NOW() - INTERVAL '2 hours'),
        (user1_id, 'আয়রন ও ক্যালসিয়াম ট্যাবলেট', TRUE, CURRENT_DATE::text, NOW() - INTERVAL '4 hours'),
        (user1_id, '২০ মিনিট সকালের হালকা হাঁটা', TRUE, CURRENT_DATE::text, NOW() - INTERVAL '5 hours'),
        (user1_id, 'বিকেলের পুষ্টিকর নাস্তা ও বিশ্রাম', FALSE, CURRENT_DATE::text, NULL),
        (user2_id, 'পর্যাপ্ত পানি পান (২.৫ লিটার)', TRUE, CURRENT_DATE::text, NOW() - INTERVAL '3 hours'),
        (user2_id, 'আয়রন ও ফলিক এসিড ট্যাবলেট', TRUE, CURRENT_DATE::text, NOW() - INTERVAL '5 hours')
    ON CONFLICT DO NOTHING;

    -- 8. Seed Fetal Kick Monitoring Records
    INSERT INTO public.kick_records (user_id, kick_count, session_start, session_end)
    VALUES
        (user1_id, 10, NOW() - INTERVAL '1 day' - INTERVAL '50 minutes', NOW() - INTERVAL '1 day'),
        (user1_id, 12, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours'),
        (user2_id, 14, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour')
    ON CONFLICT DO NOTHING;

    -- 9. Seed Saved Baby Names
    INSERT INTO public.saved_baby_names (user_id, name, gender, meaning, created_at)
    VALUES
        (user1_id, 'আরিয়ান (Aaryan)', 'boy', 'মহান, সম্মানিত ও শ্রেষ্ঠ চরিত্রবান', NOW() - INTERVAL '5 days'),
        (user1_id, 'আনিকা (Anika)', 'girl', 'রূপবতী, কৃপাময়ী ও মার্জিত স্বভাবের', NOW() - INTERVAL '4 days'),
        (user1_id, 'আয়াত (Ayat)', 'girl', 'পবিত্র কোরআনের নিদর্শন ও আশীর্বাদ', NOW() - INTERVAL '3 days'),
        (user1_id, 'ফারহান (Farhan)', 'boy', 'আনন্দিত, প্রফুল্ল ও উৎফুল্ল মন', NOW() - INTERVAL '2 days'),
        (user2_id, 'আবরার (Abrar)', 'boy', 'ধার্মিক, সত্যবাদী ও পুণ্যবান', NOW() - INTERVAL '3 days'),
        (user2_id, 'মাহিয়া (Mahiya)', 'girl', 'প্রেমময়ী, সুর ও আনন্দ', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

    -- 10. Seed Dynamic Notifications & Reminders
    INSERT INTO public.notifications (user_id, title, message, notification_type, scheduled_time, is_read, is_dismissed, sound_enabled, created_at, read_at)
    VALUES
        (user1_id, '🌅 সকালের যত্ন', 'আপু, সকালের স্বাস্থ্যকর নাস্তা ও আয়রন ট্যাবলেট ঠিক সময়ে খেয়ে নিন।', 'morning_care', 'Daily 9:00 AM', TRUE, FALSE, TRUE, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours'),
        (user1_id, '💧 পানি পানের সময়', 'সুস্থ থাকতে দিনে অন্তত ৮-১০ গ্লাস পানি জরুরি। এক গ্লাস পানি খেয়ে নিন।', 'water', 'Every 2 hours', FALSE, FALSE, TRUE, NOW() - INTERVAL '1 hour', NULL),
        (user1_id, '📅 ডাক্তারের অ্যাপয়েন্টমেন্ট', 'আগামী ১০ সেপ্টেম্বর ডা. সায়মা পারভীনের চেম্বারে আপনার রুটিন ভিজিট রয়েছে।', 'doctor_visit', 'Upcoming', FALSE, FALSE, TRUE, NOW() - INTERVAL '1 day', NULL),
        (user2_id, '👣 কিক কাউন্টিং রিমাইন্ডার', 'খাবার খাওয়ার পর আরাম করে শুয়ে বাচ্চার নড়াচড়া খেয়াল করুন।', 'kick_count', 'Daily Evening', FALSE, FALSE, TRUE, NOW() - INTERVAL '2 hours', NULL)
    ON CONFLICT DO NOTHING;

    -- 11. Seed Obstetric Emergency Audit Logs
    INSERT INTO public.emergency_logs (user_id, trigger_source, symptom_detected, action_taken, created_at)
    VALUES
        (user1_id, 'chat_triage', 'হালকা মাথা ঘোরার প্রশ্ন', 'Emergency advisory displayed & helplines (999, 16263, 109, 333) served', NOW() - INTERVAL '1 day'),
        (user2_id, 'manual_sos', 'লক্ষণ: পেটে টানটান অস্বস্তি', 'Emergency advisory presented & nearest maternity hospitals mapped', NOW() - INTERVAL '3 days')
    ON CONFLICT DO NOTHING;

END $$;
