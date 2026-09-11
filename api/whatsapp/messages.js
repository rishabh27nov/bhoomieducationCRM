const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

const getPrimaryPhone = (phone) => String(phone || '')
  .split(/[\/,;|]/)
  .map(number => number.trim())
  .find(Boolean) || '';

const lastTenDigits = (phone) => getPrimaryPhone(phone).replace(/\D/g, '').slice(-10);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const phone = req.query.phone;
  if (!phone) return res.status(400).json({ error: 'phone is required' });

  try {
    const fbRes = await fetch(`${FIREBASE_URL}/whatsappMessages.json`);
    const data = await fbRes.json();
    const messages = Array.isArray(data) ? data.filter(Boolean) : Object.values(data || {});
    const targetPhone = lastTenDigits(phone);
    const matchedMessages = messages
      .filter(message => message?.leadPhone && lastTenDigits(message.leadPhone) === targetPhone)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return res.status(200).json({ messages: matchedMessages });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load chat messages' });
  }
}
