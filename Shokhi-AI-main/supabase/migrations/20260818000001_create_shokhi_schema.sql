-- ==============================================================================
-- 🌸 Shokhi AI (সখী AI) — Migration 001: Complete PostgreSQL Schema for Supabase
-- Target: Supabase CLI & Dashboard SQL Editor
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Automatic Timestamp Updater Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. Core Tables
-- ------------------------------------------------------------------------------

-- Table: profiles (Extends auth.users or standalone user table)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    pregnancy_week INTEGER DEFAULT 1 CHECK (pregnancy_week BETWEEN 1 AND 45),
    due_date VARCHAR(50),
    blood_group VARCHAR(10),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(30),
    allergies TEXT,
    medical_history TEXT,
    preferred_language VARCHAR(5) DEFAULT 'bn' CHECK (preferred_language IN ('bn', 'en')),
    is_admin BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: chat_sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) DEFAULT 'New Chat' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    has_image BOOLEAN DEFAULT FALSE NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: meal_logs
CREATE TABLE IF NOT EXISTS public.meal_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    meal_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: mood_symptoms
CREATE TABLE IF NOT EXISTS public.mood_symptoms (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('mood', 'symptom')),
    label VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'mild' CHECK (severity IN ('mild', 'moderate', 'severe')),
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    doctor_name VARCHAR(150) NOT NULL,
    hospital_clinic VARCHAR(200),
    appointment_time VARCHAR(100) NOT NULL,
    notes TEXT,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: vital_records
CREATE TABLE IF NOT EXISTS public.vital_records (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    bp VARCHAR(50),
    weight_kg NUMERIC(5, 2),
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: daily_routines
CREATE TABLE IF NOT EXISTS public.daily_routines (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    routine_key VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    record_date VARCHAR(20) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_routine_date UNIQUE (user_id, routine_key, record_date)
);

-- Table: kick_records
CREATE TABLE IF NOT EXISTS public.kick_records (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    kick_count INTEGER NOT NULL DEFAULT 0 CHECK (kick_count >= 0),
    session_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    session_end TIMESTAMPTZ
);

-- Table: saved_baby_names
CREATE TABLE IF NOT EXISTS public.saved_baby_names (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) DEFAULT 'unspecified' CHECK (gender IN ('boy', 'girl', 'unspecified')),
    meaning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'custom',
    scheduled_time VARCHAR(100) DEFAULT 'Immediate',
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    is_dismissed BOOLEAN DEFAULT FALSE NOT NULL,
    sound_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    read_at TIMESTAMPTZ
);

-- Table: emergency_logs
CREATE TABLE IF NOT EXISTS public.emergency_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    trigger_source VARCHAR(50) DEFAULT 'chat_triage',
    symptom_detected TEXT NOT NULL,
    action_taken VARCHAR(255) DEFAULT 'Emergency advisory displayed & helplines served',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. Indexes for Performance (Sub-10ms Queries)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user ON public.meal_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_symptoms_user ON public.mood_symptoms(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vital_records_user ON public.vital_records(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_routines_user ON public.daily_routines(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_kick_records_user ON public.kick_records(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_saved_baby_names_user ON public.saved_baby_names(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_user ON public.emergency_logs(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kick_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_baby_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Generic User Ownership Policies
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'chat_sessions', 'chat_messages', 'meal_logs', 'vital_records',
        'mood_symptoms', 'appointments', 'daily_routines', 'kick_records',
        'saved_baby_names', 'notifications', 'emergency_logs'
    ])
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "User access policy for %1$I" ON public.%1$I;
            CREATE POLICY "User access policy for %1$I" ON public.%1$I
                FOR ALL USING (auth.uid()::text = user_id OR user_id = ''all'');
        ', tbl);
    END LOOP;
END $$;
