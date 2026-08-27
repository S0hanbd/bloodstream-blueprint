import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, memoryUsers, supabase, type User } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const action = req.query.action || (req.body && req.body.action);

  if (req.method === 'POST') {
    if (action === 'register') {
      const { uap_id, full_name, phone_number, is_donor, password } = req.body;
      if (!uap_id || !full_name || !phone_number || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (supabase) {
        try {
          const { data: existing } = await supabase.from('users').select('uap_id').eq('uap_id', uap_id).single();
          if (existing) {
            return res.status(400).json({ error: 'UAP ID already registered' });
          }
          const { data: newUser, error } = await supabase.from('users').insert([{
            uap_id,
            full_name,
            phone_number,
            is_donor: Boolean(is_donor),
            account_status: 'active',
            password
          }]).select().single();
          if (!error && newUser) {
            return res.status(201).json(newUser);
          }
        } catch {
          // Fallback to memory
        }
      }

      if (memoryUsers.some(u => u.uap_id === uap_id)) {
        return res.status(400).json({ error: 'UAP ID already registered' });
      }

      const newUser: User = {
        user_id: `u_${Date.now()}`,
        uap_id,
        full_name,
        phone_number,
        is_donor: Boolean(is_donor),
        account_status: 'active',
        password
      };
      memoryUsers.push(newUser);
      return res.status(201).json(newUser);
    }

    if (action === 'login') {
      const { uap_id, password } = req.body;
      if (!uap_id || !password) {
        return res.status(400).json({ error: 'Missing UAP ID or password' });
      }

      if (supabase) {
        try {
          const { data: user } = await supabase.from('users').select('*').eq('uap_id', uap_id).eq('password', password).single();
          if (user) {
            const { password: _, ...userWithoutPassword } = user;
            return res.status(200).json(userWithoutPassword);
          }
        } catch {
          // Fallback to memory
        }
      }

      const user = memoryUsers.find(u => u.uap_id === uap_id && u.password === password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid UAP ID or password' });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json(memoryUsers.map(({ password, ...u }) => u));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
