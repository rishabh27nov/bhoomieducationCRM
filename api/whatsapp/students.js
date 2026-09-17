import { authorize } from '../../lib/whatsappAccess.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const access = await authorize(req, res);
    if (!access) return;
    return res.status(200).json({ students: access.leads.filter(lead => access.canAccess(lead.phone)).map(({ id, name, phone, counselor }) => ({ id, name, phone, counselor })) });
  } catch {
    return res.status(503).json({ error: 'Could not load allotted students. Please retry.' });
  }
}
