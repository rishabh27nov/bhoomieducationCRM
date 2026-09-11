const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const fbRes = await fetch(`${FIREBASE_URL}/whatsappMessages.json`);
    const data = await fbRes.json();
    const messages = Array.isArray(data) ? data.filter(Boolean) : Object.values(data || {});
    const replies = messages
      .filter(message => message?.direction === 'incoming')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return res.status(200).json({ replies });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load WhatsApp replies' });
  }
}
