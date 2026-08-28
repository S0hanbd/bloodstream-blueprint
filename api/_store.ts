import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface User {
  user_id: string;
  uap_id: string;
  full_name: string;
  phone_number: string;
  is_donor: boolean;
  account_status: 'active' | 'hidden' | 'deleted';
  password?: string;
}

export interface DonorDetails {
  donor_id: string;
  user_id: string;
  blood_group: string;
  last_donation_date: string;
  department: string;
  batch_name: string;
  city_area: string;
  total_donations: number;
}

export interface Confirmation {
  confirmation_id: string;
  confirmer_user_id: string;
  donor_user_id: string;
  confirmation_date: string;
}

export const INITIAL_USERS: User[] = [
  { user_id: "u14101095", uap_id: "14101095", full_name: "Tanvir Hasan", phone_number: "01711223344", is_donor: true, account_status: "active" },
  { user_id: "u24202074", uap_id: "24202074", full_name: "Arifur Rahman", phone_number: "01812345678", is_donor: true, account_status: "active" },
  { user_id: "u18101023", uap_id: "18101023", full_name: "Nusrat Jahan", phone_number: "01911998877", is_donor: true, account_status: "active" },
  { user_id: "u19201056", uap_id: "19201056", full_name: "Sumaiya Akter", phone_number: "01555667788", is_donor: true, account_status: "active" },
  { user_id: "u20101088", uap_id: "20101088", full_name: "Farhan Ahmed", phone_number: "01677889900", is_donor: true, account_status: "active" },
  { user_id: "u21101012", uap_id: "21101012", full_name: "Mahfuzur Rahman", phone_number: "01300112233", is_donor: true, account_status: "active" },
  { user_id: "u22101045", uap_id: "22101045", full_name: "Kazi Nazrul Islam", phone_number: "01722334455", is_donor: true, account_status: "active" },
  { user_id: "u23101067", uap_id: "23101067", full_name: "Tasmia Islam", phone_number: "01833445566", is_donor: true, account_status: "active" },
  { user_id: "u15101034", uap_id: "15101034", full_name: "Rakibul Hossain", phone_number: "01944556677", is_donor: true, account_status: "active" },
  { user_id: "u16201089", uap_id: "16201089", full_name: "Shahriar Kabir", phone_number: "01511224466", is_donor: true, account_status: "active" },
  { user_id: "u17101099", uap_id: "17101099", full_name: "Sadia Sultana", phone_number: "01622446688", is_donor: true, account_status: "active" },
  { user_id: "u18201011", uap_id: "18201011", full_name: "Imtiaz Mahmud", phone_number: "01733557799", is_donor: true, account_status: "active" },
  { user_id: "u19101077", uap_id: "19101077", full_name: "Fariha Chowdhury", phone_number: "01844668800", is_donor: true, account_status: "active" },
  { user_id: "u20201055", uap_id: "20201055", full_name: "Mehedi Hasan Shamim", phone_number: "01955779911", is_donor: true, account_status: "active" },
  { user_id: "u21201044", uap_id: "21201044", full_name: "Sabrina Yasmin", phone_number: "01311335577", is_donor: true, account_status: "active" }
];

export const INITIAL_DONORS: DonorDetails[] = [
  { donor_id: "d14101095", user_id: "u14101095", blood_group: "A+", last_donation_date: "2024-01-15", department: "Computer Science & Engineering", batch_name: "Fall 2021", city_area: "Dhanmondi, Dhaka", total_donations: 4 },
  { donor_id: "d24202074", user_id: "u24202074", blood_group: "B+", last_donation_date: "2023-11-20", department: "Electrical & Electronic Engineering", batch_name: "Spring 2022", city_area: "Mirpur 10, Dhaka", total_donations: 2 },
  { donor_id: "d18101023", user_id: "u18101023", blood_group: "O+", last_donation_date: "2024-03-01", department: "Pharmacy", batch_name: "Fall 2020", city_area: "Farmgate, Dhaka", total_donations: 5 },
  { donor_id: "d19201056", user_id: "u19201056", blood_group: "AB+", last_donation_date: "2023-09-10", department: "Business Administration", batch_name: "Spring 2021", city_area: "Mohammadpur, Dhaka", total_donations: 3 },
  { donor_id: "d20101088", user_id: "u20101088", blood_group: "O-", last_donation_date: "2023-12-05", department: "Civil Engineering", batch_name: "Fall 2022", city_area: "Uttara, Dhaka", total_donations: 1 },
  { donor_id: "d21101012", user_id: "u21101012", blood_group: "A-", last_donation_date: "2024-02-14", department: "Law & Human Rights", batch_name: "Spring 2023", city_area: "Green Road, Dhaka", total_donations: 2 },
  { donor_id: "d22101045", user_id: "u22101045", blood_group: "B-", last_donation_date: "2023-08-25", department: "English", batch_name: "Fall 2023", city_area: "Rajarbagh, Dhaka", total_donations: 3 },
  { donor_id: "d23101067", user_id: "u23101067", blood_group: "AB-", last_donation_date: "2024-04-10", department: "Pharmacy", batch_name: "Spring 2024", city_area: "Gulshan 1, Dhaka", total_donations: 1 },
  { donor_id: "d15101034", user_id: "u15101034", blood_group: "A+", last_donation_date: "2024-05-01", department: "Computer Science & Engineering", batch_name: "Fall 2019", city_area: "Lalmatia, Dhaka", total_donations: 6 },
  { donor_id: "d16201089", user_id: "u16201089", blood_group: "B+", last_donation_date: "2023-10-18", department: "Electrical & Electronic Engineering", batch_name: "Spring 2020", city_area: "Banani, Dhaka", total_donations: 4 },
  { donor_id: "d17101099", user_id: "u17101099", blood_group: "O+", last_donation_date: "2024-02-28", department: "Civil Engineering", batch_name: "Fall 2020", city_area: "Shyamoli, Dhaka", total_donations: 3 },
  { donor_id: "d18201011", user_id: "u18201011", blood_group: "A+", last_donation_date: "2023-07-12", department: "Business Administration", batch_name: "Spring 2021", city_area: "Badda, Dhaka", total_donations: 5 },
  { donor_id: "d19101077", user_id: "u19101077", blood_group: "B+", last_donation_date: "2024-01-30", department: "Architecture", batch_name: "Fall 2021", city_area: "Azimpur, Dhaka", total_donations: 2 },
  { donor_id: "d20201055", user_id: "u20201055", blood_group: "O+", last_donation_date: "2023-12-22", department: "Computer Science & Engineering", batch_name: "Spring 2022", city_area: "Tejgaon, Dhaka", total_donations: 3 },
  { donor_id: "d21201044", user_id: "u21201044", blood_group: "AB+", last_donation_date: "2024-03-15", department: "Law & Human Rights", batch_name: "Spring 2023", city_area: "Moghbazar, Dhaka", total_donations: 1 }
];

// Fallback in-memory arrays
export const memoryUsers: User[] = [...INITIAL_USERS];
export const memoryDonors: DonorDetails[] = [...INITIAL_DONORS];
export const memoryConfirmations: Confirmation[] = [];

export interface SimpleReq {
  method?: string;
}

export interface SimpleRes {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => { end: () => void };
}

export function applyCors(req: SimpleReq, res: SimpleRes) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
