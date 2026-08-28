-- Initial Schema Migration for Supabase
-- Enables Row-Level Security (RLS) to prevent BOLA vulnerabilities

-- 1. Create profiles table extending Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  blood_type TEXT,
  last_donation_date TIMESTAMP WITH TIME ZONE,
  phone TEXT,
  national_id TEXT,
  department TEXT,
  batch_name TEXT,
  city_area TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batch_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_area TEXT;

-- 2. Create secondary tables with foreign key relationships
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  donation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'completed' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Enable Row-Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for profiles
-- Policy: Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Policy: Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. RLS Policies for donations
-- Policy: Donors can view their own donations
CREATE POLICY "Donors can view own donations"
  ON public.donations
  FOR SELECT
  USING (auth.uid() = donor_id);

-- Policy: Donors can insert their own donations
CREATE POLICY "Donors can insert own donations"
  ON public.donations
  FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- Policy: Donors can update their own donations
CREATE POLICY "Donors can update own donations"
  ON public.donations
  FOR UPDATE
  USING (auth.uid() = donor_id)
  WITH CHECK (auth.uid() = donor_id);

-- Policy: Donors can delete their own donations
CREATE POLICY "Donors can delete own donations"
  ON public.donations
  FOR DELETE
  USING (auth.uid() = donor_id);

-- 6. RLS Policies for appointments
-- Policy: Users can view their own appointments
CREATE POLICY "Users can view own appointments"
  ON public.appointments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own appointments
CREATE POLICY "Users can create own appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own appointments
CREATE POLICY "Users can update own appointments"
  ON public.appointments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own appointments
CREATE POLICY "Users can delete own appointments"
  ON public.appointments
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Trigger function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
