const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { phone, message } = req.body || {};

    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }

    // Fetch WhatsApp credentials from Firebase
    const settingsRes = await fetch(`${FIREBASE_URL}/whatsappSettings.json`);
    const settings = await settingsRes.json();

    if (!settings || !settings.phoneNumberId || !settings.accessToken) {
      return res.status(400).json({ 
        error: 'WhatsApp API credentials not configured. Please go to WhatsApp API Setup in settings.' 
      });
    }

    const { phoneNumberId, accessToken } = settings;

    // Clean phone number - ensure it has country code
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    // Send message via Meta WhatsApp Cloud API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message }
        })
      }
    );

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('Meta API Error:', metaResult);
      return res.status(400).json({ 
        error: `Failed to send via Meta API: ${metaResult?.error?.message || JSON.stringify(metaResult)}`,
        details: metaResult 
      });
    }

    // Save outgoing message to Firebase
    const outgoingMsg = {
      id: metaResult.messages?.[0]?.id || `MSG-OUT-${Date.now()}`,
      leadPhone: phone,
      text: message,
      timestamp: new Date().toISOString(),
      direction: 'outgoing',
      status: 'sent'
    };

    try {
      const msgsRes = await fetch(`${FIREBASE_URL}/whatsappMessages.json`);
      let currentMessages = await msgsRes.json();
      if (!Array.isArray(currentMessages)) currentMessages = [];
      currentMessages.push(outgoingMsg);

      await fetch(`${FIREBASE_URL}/whatsappMessages.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentMessages)
      });
    } catch (fbErr) {
      console.error('Firebase message save error:', fbErr);
    }

    return res.status(200).json({ success: true, message: outgoingMsg });

  } catch (err) {
    console.error('WhatsApp Send Error:', err);
    return res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
}
