import { messageKey, withDelivery } from './whatsappDelivery.js';

// A successful API request is not proof that the recipient received a message.
export function campaignDelivery(log, receipts = {}) {
  const recipients = log.recipientResults?.length ? log.recipientResults : [
    ...(log.successfulLeads || []).map(lead => ({ ...lead, status: lead.status || 'accepted' })),
    ...(log.failedLeads || []).map(lead => ({ ...lead, status: 'failed' }))
  ];
  const resolved = recipients.map(lead => {
    const events = lead.messageId ? receipts[messageKey(lead.messageId)] : null;
    const result = withDelivery(lead, events || {});
    if (result.status === 'failed' && result.deliveryErrors?.length) {
      return { ...result, error: result.deliveryErrors.map(error => `${error.code ? `${error.code}: ` : ''}${error.message}`).join('; ') };
    }
    return result;
  });
  const successfulLeads = resolved.filter(lead => ['delivered', 'read'].includes(lead.status));
  const failedLeads = resolved.filter(lead => lead.status === 'failed');
  const unconfirmedLeads = resolved.filter(lead => !['delivered', 'read', 'failed', 'pending', 'skipped'].includes(lead.status));
  return { ...log, recipientResults: resolved, successfulLeads, failedLeads, unconfirmedLeads,
    successfulCount: successfulLeads.length, failedCount: failedLeads.length || (recipients.length ? 0 : Number(log.failedCount) || 0),
    unconfirmedCount: unconfirmedLeads.length || (recipients.length ? 0 : Number(log.successfulCount) || 0) };
}
