import { phoneKey } from '../../lib/studentChatAccess.js';
import { authorize, firebaseUrl } from '../../lib/whatsappAccess.js';
import { messageKey, withDelivery, replyWindow } from '../../lib/whatsappDelivery.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const phone = req.query.phone;
  if (!phone) return res.status(400).json({ error: 'phone is required' });

  try {
    if (!await authorize(req, res, { phone })) return;
    const fbRes = await fetch(firebaseUrl('whatsappMessages', req));
    if (!fbRes.ok) throw new Error('Message history unavailable');
    const data = await fbRes.json();
    const messages = Array.isArray(data) ? data.filter(Boolean) : Object.values(data || {});
    const targetPhone = phoneKey(phone);
    const matchedMessages = messages
      .filter(message => message?.leadPhone && phoneKey(message.leadPhone) === targetPhone)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const deliveredMessages = await Promise.all(matchedMessages.map(async message => {
      if (message.direction !== 'outgoing') return message;
      const response = await fetch(firebaseUrl(`whatsappMessageStatuses/${messageKey(message.id)}`, req));
      if (!response.ok) throw new Error('Delivery status unavailable');
      return withDelivery(message, await response.json() || {});
    }));
    return res.status(200).json({ messages: deliveredMessages, replyWindow: replyWindow(messages, phone) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load chat messages' });
  }
}
