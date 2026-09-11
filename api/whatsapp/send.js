const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';
const firebaseMessageKey = (id) => String(id).replace(/[.#$\[\]/]/g, '_');
const deliveryKey = (template, phone) => `${firebaseMessageKey(template)}_${String(phone).slice(-10)}`;

const claimTemplateDelivery = async (template, phone) => {
  const url = `${FIREBASE_URL}/whatsappTemplateDeliveries/${deliveryKey(template, phone)}.json`;
  const now = Date.now();
  const recordRes = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' } });
  const existing = await recordRes.json();
  const etag = recordRes.headers.get('etag');
  if (existing?.status === 'sent') return { skipped: true, existing };
  if (existing?.status === 'processing' && new Date(existing.leaseExpiresAt).getTime() > now) return { skipped: true, existing };

  const claimed = { template, phone, status: 'processing', startedAt: new Date(now).toISOString(), leaseExpiresAt: new Date(now + 15 * 60 * 1000).toISOString() };
  const claimRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'if-match': etag || 'null_etag' },
    body: JSON.stringify(claimed)
  });
  return claimRes.ok ? { claimed: true, url } : { skipped: true };
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { phone, message, isTemplate, templateName, languageCode } = req.body || {};

    if (!phone) {
      return res.status(400).json({ error: 'phone is required' });
    }
    
    if (!isTemplate && !message) {
      return res.status(400).json({ error: 'message is required for non-template sends' });
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
    // If a CRM record has two numbers, use the first one for a single WhatsApp send.
    const selectedPhone = String(phone || '').split(/[\/,;|]/).map(value => value.trim()).find(Boolean);
    let cleanPhone = (selectedPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const resolvedTemplate = templateName || 'lakshya_admission_enquiry';

    let deliveryClaim = null;
    if (isTemplate) {
      deliveryClaim = await claimTemplateDelivery(resolvedTemplate, cleanPhone);
      if (deliveryClaim.skipped) {
        return res.status(200).json({ success: true, skipped: true, message: 'This template was already sent or is currently being sent to this number.' });
      }
    }

    // Prepare payload based on message type
    let payload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
    };

    if (isTemplate) {
      payload.type = 'template';
      payload.template = {
        name: resolvedTemplate,
        language: { code: languageCode || 'en' }
      };
    } else {
      payload.type = 'text';
      payload.text = { body: message };
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
        body: JSON.stringify(payload)
      }
    );

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      if (deliveryClaim?.url) {
        await fetch(deliveryClaim.url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template: resolvedTemplate, phone: cleanPhone, status: 'failed', failedAt: new Date().toISOString() }) });
      }
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
      text: isTemplate ? `[Template Sent: ${templateName || 'lakshya_admission_enquiry'}]` : message,
      timestamp: new Date().toISOString(),
      direction: 'outgoing',
      status: 'sent'
    };

    if (deliveryClaim?.url) {
      await fetch(deliveryClaim.url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: resolvedTemplate, phone: cleanPhone, status: 'sent', sentAt: new Date().toISOString(), messageId: outgoingMsg.id })
      });
    }

    try {
      await fetch(`${FIREBASE_URL}/whatsappMessages/${firebaseMessageKey(outgoingMsg.id)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outgoingMsg)
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
