import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, memoryDonors, memoryUsers, supabase, type DonorDetails, type User } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method === 'GET') {
    const { bloodGroup, query } = req.query;
    const bgStr = Array.isArray(bloodGroup) ? bloodGroup[0] : (bloodGroup || 'ALL');
    const qStr = Array.isArray(query) ? query[0] : (query || '');

    if (supabase) {
      try {
        let queryBuilder = supabase.from('donors').select('*, user:users(*)');
        if (bgStr && bgStr !== 'ALL') {
          queryBuilder = queryBuilder.eq('blood_group', bgStr);
        }
        const { data, error } = await queryBuilder;
        if (!error && data) {
          let results = data.filter((d: any) => d.user && d.user.account_status === 'active').map((d: any) => {
            const lastDonationDate = new Date(d.last_donation_date);
            const daysSince = Math.floor((Date.now() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24));
            const isAvailable = isNaN(daysSince) ? true : daysSince >= 105;
            return { ...d, isAvailable };
          });

          if (qStr.trim()) {
            const q = qStr.toLowerCase().trim();
            results = results.filter((d: any) =>
              d.user.full_name.toLowerCase().includes(q) ||
              d.user.uap_id.toLowerCase().includes(q) ||
              d.department.toLowerCase().includes(q) ||
              d.city_area.toLowerCase().includes(q)
            );
          }

          results.sort((a: any, b: any) => {
            if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
            const dateA = a.last_donation_date ? new Date(a.last_donation_date).getTime() : 0;
            const dateB = b.last_donation_date ? new Date(b.last_donation_date).getTime() : 0;
            return dateA - dateB;
          });

          return res.status(200).json(results);
        }
      } catch {
        // Fallback to memory
      }
    }

    // Memory fallback logic
    let filtered = memoryDonors.filter(d => {
      if (bgStr && bgStr !== 'ALL' && d.blood_group !== bgStr) return false;
      return true;
    });

    const results = filtered.map(d => {
      const u = memoryUsers.find(user => user.user_id === d.user_id);
      if (!u || u.account_status !== 'active') return null;
      if (qStr.trim()) {
        const q = qStr.toLowerCase().trim();
        const matchesName = u.full_name.toLowerCase().includes(q);
        const matchesId = u.uap_id.toLowerCase().includes(q);
        const matchesDept = d.department.toLowerCase().includes(q);
        const matchesArea = d.city_area.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept && !matchesArea) return null;
      }
      const lastDonationDate = new Date(d.last_donation_date);
      const daysSince = Math.floor((Date.now() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24));
      const isAvailable = isNaN(daysSince) ? true : daysSince >= 105;
      return { ...d, user: u, isAvailable };
    }).filter(Boolean) as Array<DonorDetails & { user: User; isAvailable: boolean }>;

    results.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      const dateA = a.last_donation_date ? new Date(a.last_donation_date).getTime() : 0;
      const dateB = b.last_donation_date ? new Date(b.last_donation_date).getTime() : 0;
      return dateA - dateB;
    });

    return res.status(200).json(results);
  }

  if (req.method === 'POST') {
    const donorData = req.body;
    if (!donorData || !donorData.user_id) {
      return res.status(400).json({ error: 'Missing required donor parameters' });
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.from('donors').insert([{
          user_id: donorData.user_id,
          blood_group: donorData.blood_group,
          last_donation_date: donorData.last_donation_date,
          department: donorData.department,
          batch_name: donorData.batch_name,
          city_area: donorData.city_area,
          total_donations: 0
        }]).select().single();
        if (!error && data) {
          await supabase.from('users').update({ is_donor: true }).eq('user_id', donorData.user_id);
          return res.status(201).json(data);
        }
      } catch {
        // Fallback to memory
      }
    }

    const newDonor: DonorDetails = {
      donor_id: `d_${Date.now()}`,
      total_donations: 0,
      ...donorData
    };
    memoryDonors.push(newDonor);
    const u = memoryUsers.find(user => user.user_id === donorData.user_id);
    if (u) u.is_donor = true;

    return res.status(201).json(newDonor);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
