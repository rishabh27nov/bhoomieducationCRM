export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ GET - Webhook Verification Handshake from Meta
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = 'bhoomi_whatsapp_token';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WhatsApp Webhook Verified Successfully!');
      return res.status(200).send(challenge);
    }

    console.log('❌ WhatsApp Webhook Verification Failed. Token mismatch.');
    return res.status(403).json({ error: 'Verification failed. Token mismatch.' });
  }

  // ✅ POST - Handle Incoming WhatsApp Messages & Status Updates
  if (req.method === 'POST') {
    try {
      const payload = req.body || {};
      console.log('📩 Incoming WhatsApp Webhook:', JSON.stringify(payload));

      const firebaseDbUrl = `https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db/whatsappMessages.json`;

      // Parse incoming message from Meta's WhatsApp Cloud API payload format
      if (
        payload.entry &&
        payload.entry[0]?.changes &&
        payload.entry[0].changes[0]?.value?.messages
      ) {
        const value = payload.entry[0].changes[0].value;
        const msgObj = value.messages[0];
        const contact = value.contacts?.[0];
        const senderPhone = msgObj.from; // e.g. "919876543210"
        const senderName = contact?.profile?.name || 'Unknown';

        const incomingMessage = {
          id: msgObj.id,
          leadPhone: senderPhone,
          senderName: senderName,
          text: msgObj.text?.body || '[Media/Non-Text Message]',
          type: msgObj.type || 'text',
          timestamp: new Date().toISOString(),
          direction: 'incoming',
          status: 'received'
        };

        console.log('💬 Incoming Message from', senderName, ':', incomingMessage.text);

        // Save to Firebase
        try {
          const getRes = await fetch(firebaseDbUrl);
          let currentMessages = await getRes.json();
          if (!Array.isArray(currentMessages)) currentMessages = [];
          currentMessages.push(incomingMessage);
          await fetch(firebaseDbUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentMessages)
          });
          console.log('✅ Incoming message saved to Firebase');
        } catch (fbErr) {
          console.error('Firebase sync error:', fbErr);
        }
      }

      // Handle message status updates (sent, delivered, read)
      if (
        payload.entry &&
        payload.entry[0]?.changes &&
        payload.entry[0].changes[0]?.value?.statuses
      ) {
        const status = payload.entry[0].changes[0].value.statuses[0];
        console.log(`📋 Message Status Update: ${status.id} → ${status.status}`);
        // Status updates: sent, delivered, read, failed
      }

      // Always return 200 immediately so Meta doesn't retry
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('WhatsApp Webhook Error:', err);
      // Always return 200 to prevent Meta from retrying endlessly
      return res.status(200).json({ success: true });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
