const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';
const lastTenDigits = (value) => String(value || '').replace(/\D/g, '').slice(-10);

export default async function handler(req, res) {
  try {
    if (req.method === 'PATCH') {
      const phone = req.body?.phone;
      if (!phone) return res.status(400).json({ error: 'phone is required' });

      const fbRes = await fetch(`${FIREBASE_URL}/whatsappMessages.json`);
      const data = await fbRes.json();
      const messagesById = Array.isArray(data)
        ? Object.fromEntries(data.map((message, index) => [index, message]).filter(([, message]) => message))
        : (data || {});
      const targetPhone = lastTenDigits(phone);
      const unreadEntries = Object.entries(messagesById).filter(([, message]) =>
        message?.direction === 'incoming' && !message.readAt && lastTenDigits(message.leadPhone) === targetPhone
      );
      const readAt = new Date().toISOString();
      await Promise.all(unreadEntries.map(([id]) => fetch(`${FIREBASE_URL}/whatsappMessages/${id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readAt })
      })));
      return res.status(200).json({ success: true, markedRead: unreadEntries.length, readAt });
    }

    if (req.method === 'DELETE') {
      const phone = req.body?.phone;
      if (!phone) return res.status(400).json({ error: 'phone is required' });

      const fbRes = await fetch(`${FIREBASE_URL}/whatsappMessages.json`);
      const data = await fbRes.json();
      const messagesById = Array.isArray(data)
        ? Object.fromEntries(data.map((message, index) => [index, message]).filter(([, message]) => message))
        : (data || {});
      const targetPhone = lastTenDigits(phone);
      const matchingEntries = Object.entries(messagesById).filter(([, message]) =>
        lastTenDigits(message?.leadPhone) === targetPhone
      );
      await Promise.all(matchingEntries.map(([id]) => fetch(`${FIREBASE_URL}/whatsappMessages/${id}.json`, {
        method: 'DELETE'
      })));
      return res.status(200).json({ success: true, deleted: matchingEntries.length });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
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
