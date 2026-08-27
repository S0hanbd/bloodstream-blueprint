import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, memoryDonors, memoryUsers, supabase } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method === 'GET') {
    if (supabase) {
      try {
        const { data: users } = await supabase.from('users').select('*').eq('account_status', 'active');
        const { data: donors } = await supabase.from('donors').select('*');
        if (users && donors) {
          const activeDonors = donors.filter(d => users.some(u => u.user_id === d.user_id));
          const totalBags = donors.reduce((sum, d) => sum + (d.total_donations || 0), 0);
          return res.status(200).json({
            totalBags,
            totalUsers: users.length,
            totalDonors: activeDonors.length
          });
        }
      } catch {
        // Fallback
      }
    }

    const activeUsers = memoryUsers.filter(u => u.account_status === 'active');
    const activeDonors = memoryDonors.filter(d => activeUsers.some(u => u.user_id === d.user_id));
    const totalBags = memoryDonors.reduce((sum, d) => sum + (d.total_donations || 0), 0);

    return res.status(200).json({
      totalBags,
      totalUsers: activeUsers.length,
      totalDonors: activeDonors.length
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
