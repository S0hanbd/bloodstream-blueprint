import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * SQL DDL Schema for Supabase PostgreSQL Database:
 * 
 * CREATE TABLE IF NOT EXISTS users (
 *   user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   uap_id TEXT UNIQUE NOT NULL,
 *   full_name TEXT NOT NULL,
 *   phone_number TEXT NOT NULL,
 *   is_donor BOOLEAN DEFAULT false,
 *   account_status TEXT DEFAULT 'active',
 *   password TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE IF NOT EXISTS donors (
 *   donor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
 *   blood_group TEXT NOT NULL,
 *   last_donation_date DATE,
 *   department TEXT NOT NULL,
 *   batch_name TEXT NOT NULL,
 *   city_area TEXT NOT NULL,
 *   total_donations INTEGER DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE IF NOT EXISTS confirmations (
 *   confirmation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   confirmer_user_id UUID REFERENCES users(user_id),
 *   donor_user_id UUID REFERENCES users(user_id),
 *   confirmation_date DATE DEFAULT CURRENT_DATE,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */
