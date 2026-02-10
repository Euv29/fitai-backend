-- FitAI Database Schema Migration
-- Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone TEXT UNIQUE,
    phone_country_code TEXT DEFAULT '+351',
    name TEXT,
    email TEXT,
    age INTEGER,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    fitness_goal TEXT CHECK (fitness_goal IN ('lose_weight', 'gain_muscle', 'maintain', 'endurance', 'flexibility', 'general_health')),
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active')),
    medical_conditions_encrypted TEXT,
    injuries TEXT[] DEFAULT '{}',
    gym_access BOOLEAN DEFAULT false,
    home_equipment TEXT[] DEFAULT '{}',
    preferred_language TEXT DEFAULT 'pt-BR',
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    notifications_enabled BOOLEAN DEFAULT true,
    profile_completed BOOLEAN DEFAULT false,
    password_hash TEXT, -- For email/password auth
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT users_contact_check CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

-- =============================================
-- 2. VERIFICATION_CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone TEXT,
    email TEXT,
    code_hash TEXT NOT NULL,
    CONSTRAINT verification_codes_contact_check CHECK (phone IS NOT NULL OR email IS NOT NULL),
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON public.verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON public.verification_codes(expires_at);

-- =============================================
-- 3. SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT DEFAULT 'free_trial' CHECK (plan IN ('free_trial', 'limited_free', 'base', 'pro', 'unlimited')),
    status TEXT DEFAULT 'trialing' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- =============================================
-- 4. WEEKLY_SCHEDULES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.weekly_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    available BOOLEAN DEFAULT true,
    preferred_time TEXT CHECK (preferred_time IN ('morning', 'afternoon', 'evening')),
    duration_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_schedules_user ON public.weekly_schedules(user_id);

-- =============================================
-- 5. WORKOUT_PROGRAMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.workout_programs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    weekly_split TEXT,
    ai_generation_prompt TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_programs_user ON public.workout_programs(user_id);

-- =============================================
-- 6. WORKOUT_SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES public.workout_programs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    day_of_week INTEGER,
    session_name TEXT NOT NULL,
    session_type TEXT,
    estimated_duration_minutes INTEGER,
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_program ON public.workout_sessions(program_id);

-- =============================================
-- 7. SESSION_EXERCISES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.session_exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_db_id TEXT,
    exercise_name TEXT NOT NULL,
    exercise_type TEXT,
    target_muscle TEXT,
    equipment TEXT,
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '10',
    rest_seconds INTEGER DEFAULT 60,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON public.session_exercises(session_id);

-- =============================================
-- 8. WORKOUT_LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.workout_sessions(id),
    duration_minutes INTEGER,
    notes TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON public.workout_logs(user_id);

-- =============================================
-- 9. EXERCISE_LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.exercise_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE,
    exercise_id UUID,
    exercise_name TEXT,
    sets_data JSONB,
    sets_completed INTEGER,
    actual_reps INTEGER[],
    actual_weight_kg DECIMAL[],
    difficulty_rating INTEGER,
    notes TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_log ON public.exercise_logs(log_id);

-- =============================================
-- 10. CHAT_MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    image_url TEXT,
    image_analysis JSONB,
    language TEXT DEFAULT 'pt-BR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);

-- =============================================
-- 11. EXERCISES_CACHE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.exercises_cache (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    body_part TEXT,
    equipment TEXT,
    gif_url TEXT,
    target TEXT,
    secondary_muscles TEXT[],
    instructions TEXT[],
    cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_cache_name ON public.exercises_cache(name);
CREATE INDEX IF NOT EXISTS idx_exercises_cache_body_part ON public.exercises_cache(body_part);

-- =============================================
-- 12. PROGRESS_PHOTOS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    weight_kg DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_user ON public.progress_photos(user_id);

-- =============================================
-- 13. USAGE_LIMITS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.usage_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    ai_chat_count INTEGER DEFAULT 0,
    recipe_generation_count INTEGER DEFAULT 0,
    image_analysis_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_limits_user_date ON public.usage_limits(user_id, date);

-- =============================================
-- DISABLE RLS for simplicity (enable and configure in production)
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'users', 'verification_codes', 'subscriptions', 'weekly_schedules',
        'workout_programs', 'workout_sessions', 'session_exercises',
        'workout_logs', 'exercise_logs', 'chat_messages', 'exercises_cache',
        'progress_photos', 'usage_limits'
    ]) LOOP
        EXECUTE format('
            CREATE POLICY IF NOT EXISTS "Allow service role full access on %I" ON public.%I
            FOR ALL
            USING (true)
            WITH CHECK (true);
        ', tbl, tbl);
    END LOOP;
END $$;
