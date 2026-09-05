const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - Fetch WhatsApp settings from Firebase
  if (req.method === 'GET') {
    try {
      const fbRes = await fetch(`${FIREBASE_URL}/whatsappSettings.json`);
      const settings = await fbRes.json();
      return res.status(200).json(settings || {});
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  // POST - Save WhatsApp settings to Firebase
  if (req.method === 'POST') {
    try {
      const { phoneNumberId, accessToken } = req.body || {};
      if (!phoneNumberId || !accessToken) {
        return res.status(400).json({ error: 'phoneNumberId and accessToken are required' });
      }

      const settings = { phoneNumberId: phoneNumberId.trim(), accessToken: accessToken.trim() };

      await fetch(`${FIREBASE_URL}/whatsappSettings.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      return res.status(200).json({ success: true, settings });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save settings' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
