import { phoneKey } from './studentChatAccess.js';
export const messageKey = id => String(id).replace(/[.#$\[\]/]/g, '_');
export function replyWindow(messages, phone, now = Date.now()) {
  const latest = Object.values(messages || {}).filter(message => message?.direction === 'incoming' && phoneKey(message.leadPhone) === phoneKey(phone))
    .reduce((last, message) => Math.max(last, Date.parse(message.timestamp) || 0), 0);
  return { open: latest > 0 && latest <= now && now - latest < 24 * 60 * 60 * 1000, lastIncomingAt: latest ? new Date(latest).toISOString() : null };
}
export function withDelivery(message, events = {}) {
  // Separate receipts survive send-write races and out-of-order retries.
  const receipt = events.read || events.delivered || events.failed || events.sent;
  return receipt ? { ...message, status: receipt.status, statusUpdatedAt: receipt.timestamp, deliveryErrors: receipt.errors || [] } : message;
}
