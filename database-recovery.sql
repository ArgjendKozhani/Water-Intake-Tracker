-- Water Intake Tracker Database Schema Recovery
-- Run this SQL in your Supabase project to recreate the lost tables

-- =====================================================
-- Table 1: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY NOT NULL DEFAULT auth.uid(),
  name TEXT,
  surname TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own profile
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- =====================================================
-- Table 2: water_intake
-- =====================================================
CREATE TABLE IF NOT EXISTS public.water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cups INTEGER NOT NULL DEFAULT 0,
  bottles INTEGER NOT NULL DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security for water_intake
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own water intake entries
CREATE POLICY "Users can read their own water intake" ON public.water_intake
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own water intake entries
CREATE POLICY "Users can insert their own water intake" ON public.water_intake
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own water intake entries
CREATE POLICY "Users can update their own water intake" ON public.water_intake
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own water intake entries
CREATE POLICY "Users can delete their own water intake" ON public.water_intake
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================
-- Indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS water_intake_user_id_idx ON public.water_intake(user_id);
CREATE INDEX IF NOT EXISTS water_intake_date_idx ON public.water_intake(date);
CREATE INDEX IF NOT EXISTS water_intake_user_date_idx ON public.water_intake(user_id, date);

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON TABLE public.water_intake IS 'Daily water intake tracking logs';
COMMENT ON COLUMN public.water_intake.cups IS 'Number of cups of water consumed';
COMMENT ON COLUMN public.water_intake.bottles IS 'Number of bottles of water consumed';
COMMENT ON COLUMN public.water_intake.start_time IS 'Start time of the water intake tracking session';
COMMENT ON COLUMN public.water_intake.end_time IS 'End time of the water intake tracking session';
COMMENT ON COLUMN public.water_intake.date IS 'Date of the water intake entry (ISO format)';
