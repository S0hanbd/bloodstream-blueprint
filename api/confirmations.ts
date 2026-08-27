import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, memoryConfirmations, supabase, type Confirmation } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method === 'POST') {
    const { confirmer_user_id, donor_user_id } = req.body;
    if (!confirmer_user_id || !donor_user_id) {
      return res.status(400).json({ error: 'Missing required confirmation fields' });
    }
    const today = new Date().toISOString().split('T')[0];

    if (supabase) {
      try {
        const { data: existing } = await supabase.from('confirmations')
          .select('*')
          .eq('confirmer_user_id', confirmer_user_id)
          .eq('confirmation_date', today);

        if (existing && existing.length >= 2) {
          return res.status(400).json({ error: 'You can only confirm up to 2 donors per day' });
        }

        const { data: newConf, error } = await supabase.from('confirmations').insert([{
          confirmer_user_id,
          donor_user_id,
          confirmation_date: today
        }]).select().single();

        if (!error && newConf) {
          return res.status(201).json(newConf);
        }
      } catch {
        // Fallback to memory
      }
    }

    const todayConfirmations = memoryConfirmations.filter(c => c.confirmer_user_id === confirmer_user_id && c.confirmation_date === today);
    if (todayConfirmations.length >= 2) {
      return res.status(400).json({ error: 'You can only confirm up to 2 donors per day' });
    }

    const newConf: Confirmation = {
      confirmation_id: `c_${Date.now()}`,
      confirmer_user_id,
      donor_user_id,
      confirmation_date: today
    };
    memoryConfirmations.push(newConf);

    return res.status(201).json(newConf);
  }

  if (req.method === 'GET') {
    const { donor_user_id } = req.query;
    const today = new Date().toISOString().split('T')[0];

    if (supabase && donor_user_id) {
      try {
        const { data } = await supabase.from('confirmations')
          .select('*')
          .eq('donor_user_id', String(donor_user_id))
          .eq('confirmation_date', today);
        if (data) return res.status(200).json(data);
      } catch {
        // Fallback
      }
    }

    const filtered = memoryConfirmations.filter(c => c.confirmation_date === today && (!donor_user_id || c.donor_user_id === donor_user_id));
    return res.status(200).json(filtered);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
