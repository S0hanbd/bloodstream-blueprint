-- ==========================================
-- UAP BLOODSTREAM SUPABASE DATABASE SCHEMA
-- ==========================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    national_id TEXT UNIQUE, -- UAP Student/Staff ID
    full_name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    biological_sex TEXT DEFAULT 'male',
    user_type TEXT DEFAULT 'student',
    verification_status TEXT DEFAULT 'pending',
    uap_id_verified BOOLEAN DEFAULT false,
    blood_group_verified BOOLEAN DEFAULT false,
    donation_history_verified BOOLEAN DEFAULT false,
    blood_type TEXT DEFAULT 'A+',
    department TEXT DEFAULT 'General',
    batch_name TEXT DEFAULT 'UAP',
    city_area TEXT DEFAULT 'Dhaka',
    profile_visible BOOLEAN DEFAULT true,
    allow_contact_requests BOOLEAN DEFAULT true,
    show_phone_publicly BOOLEAN DEFAULT true,
    last_donation_date DATE,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all new columns exist if table was created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biological_sex TEXT DEFAULT 'male';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS uap_id_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS donation_history_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_type TEXT DEFAULT 'A+';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batch_name TEXT DEFAULT 'UAP';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_area TEXT DEFAULT 'Dhaka';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visible BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_contact_requests BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_phone_publicly BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_donation_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. DONATIONS TABLE
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    donation_date DATE DEFAULT CURRENT_DATE,
    location TEXT DEFAULT 'UAP Blood Bank Center',
    status TEXT DEFAULT 'completed',
    verification_status TEXT DEFAULT 'verified',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BLOOD REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    patient_name TEXT,
    blood_group TEXT,
    units_needed INT DEFAULT 1,
    hospital_name TEXT,
    hospital_location TEXT,
    urgency TEXT DEFAULT 'urgent',
    when_needed TEXT DEFAULT 'As soon as possible',
    contact_person TEXT,
    contact_phone TEXT,
    additional_info TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONTACT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_name TEXT,
    requester_phone TEXT,
    donor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    blood_request_id UUID REFERENCES public.blood_requests(id) ON DELETE SET NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROFILE REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.profile_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_name TEXT DEFAULT 'Anonymous User',
    reported_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    details TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;

-- Clean Up Old Policies if they exist
DROP POLICY IF EXISTS "Public Read Active Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public Read Blood Requests" ON public.blood_requests;
DROP POLICY IF EXISTS "Public Insert Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public Insert Donations" ON public.donations;
DROP POLICY IF EXISTS "Public Insert Blood Requests" ON public.blood_requests;
DROP POLICY IF EXISTS "Public Insert Contact Requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Public Insert Profile Reports" ON public.profile_reports;
DROP POLICY IF EXISTS "Enable Update Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable Update Blood Requests" ON public.blood_requests;

-- Create Clean Policies
CREATE POLICY "Public Read Active Profiles" ON public.profiles FOR SELECT USING (COALESCE(profile_visible, true) = true);
CREATE POLICY "Public Read Blood Requests" ON public.blood_requests FOR SELECT USING (true);
CREATE POLICY "Public Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Donations" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Blood Requests" ON public.blood_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Contact Requests" ON public.contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Profile Reports" ON public.profile_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update Profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Enable Update Blood Requests" ON public.blood_requests FOR UPDATE USING (true);
