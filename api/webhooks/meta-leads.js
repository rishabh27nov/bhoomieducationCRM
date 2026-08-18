export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET Verification Handshake for Meta (Facebook & Instagram) Webhooks
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] || req.query['mode'];
    const token = req.query['hub.verify_token'] || req.query['verify_token'];
    const challenge = req.query['hub.challenge'] || req.query['challenge'];

    if (mode === 'subscribe' && token === 'bhoomi_crm_meta_token_2026') {
      console.log('✅ Meta Webhook Verified Successfully!');
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ error: 'Verification failed. Token mismatch.' });
  }

  // POST Incoming Lead Ingestion Payload
  if (req.method === 'POST') {
    try {
      const payload = req.body || {};
      const platform = req.query.platform === 'instagram' ? 'Instagram Lead Ad' : 'Facebook Lead Form';

      console.log(`📩 Received ${platform} Payload:`, JSON.stringify(payload));

      return res.status(200).json({
        success: true,
        message: 'Lead received successfully by Bhoomi CRM',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(200).json({ success: true });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
