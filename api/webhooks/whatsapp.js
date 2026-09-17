import { messageKey } from '../../lib/whatsappDelivery.js';
const ROOT = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';
async function write(path, data) {
  const response = await fetch(`${ROOT}/${path}.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!response.ok) throw new Error('Webhook persistence failed');
}
export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === (process.env.WHATSAPP_VERIFY_TOKEN || 'bhoomi_whatsapp_token')) return res.status(200).send(req.query['hub.challenge']);
    return res.status(403).json({ error: 'Verification failed' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    for (const entry of req.body?.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const message of value.messages || []) {
          if (!message.id || !message.from) continue;
          const contact = value.contacts?.find(item => item.wa_id === message.from);
          await write(`whatsappMessages/${messageKey(message.id)}`, {
            id: message.id, leadPhone: message.from, senderName: contact?.profile?.name || 'Unknown',
            text: message.text?.body || '[Media/Non-Text Message]', type: message.type || 'text',
            timestamp: new Date(Number(message.timestamp) * 1000 || Date.now()).toISOString(),
            direction: 'incoming', status: 'received'
          });
        }
        for (const receipt of value.statuses || []) {
          if (!receipt.id || !['sent', 'delivered', 'read', 'failed'].includes(receipt.status)) continue;
          await write(`whatsappMessageStatuses/${messageKey(receipt.id)}/${receipt.status}`, {
            status: receipt.status,
            timestamp: new Date(Number(receipt.timestamp) * 1000 || Date.now()).toISOString(),
            errors: (receipt.errors || []).map(error => ({ code: error.code || null, message: error.error_data?.details || error.message || error.title || 'Delivery failed' }))
          });
        }
      }
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('WhatsApp webhook persistence failed');
    return res.status(503).json({ error: 'Unable to save webhook. Please retry.' });
  }
}
