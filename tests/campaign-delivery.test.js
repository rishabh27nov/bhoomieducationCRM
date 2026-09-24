import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignDelivery } from '../lib/campaignDelivery.js';

test('accepted requests and legacy successes are never counted as delivered', () => {
  const report = campaignDelivery({ successfulCount: 2, successfulLeads: [
    { name: 'Dev', messageId: 'm1', status: 'sent' }, { name: 'Legacy' }
  ] }, { m1: { sent: { status: 'sent' } } });
  assert.equal(report.successfulCount, 0);
  assert.equal(report.unconfirmedCount, 2);
  assert.equal(campaignDelivery({ successfulCount: 15 }).unconfirmedCount, 15);
});

test('webhook failures move accepted recipients to failed with the reason', () => {
  const report = campaignDelivery({ recipientResults: [
    { messageId: 'm1', status: 'accepted' }, { messageId: 'm2', status: 'accepted' },
    { status: 'pending' }, { status: 'skipped' }
  ] }, {
    m1: { failed: { status: 'failed', errors: [{ code: 131026, message: 'Undeliverable' }] } },
    m2: { delivered: { status: 'delivered' }, sent: { status: 'sent' } }
  });
  assert.equal(report.failedCount, 1);
  assert.equal(report.failedLeads[0].error, '131026: Undeliverable');
  assert.equal(report.successfulCount, 1);
  assert.equal(report.unconfirmedCount, 0);
  assert.equal(report.recipientResults.filter(lead => lead.status === 'pending').length, 1);
});

test('read receipts keep delivery confirmed despite delayed failures', () => {
  const report = campaignDelivery({ successfulLeads: [{ messageId: 'm.1' }] }, {
    m_1: { read: { status: 'read' }, failed: { status: 'failed' } }
  });
  assert.equal(report.successfulCount, 1);
  assert.equal(report.failedCount, 0);
});
