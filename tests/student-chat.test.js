import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessPhone, phoneKey } from '../lib/studentChatAccess.js';
import studentsHandler from '../api/whatsapp/students.js';
import messagesHandler from '../api/whatsapp/messages.js';
import sendHandler from '../api/whatsapp/send.js';
import repliesHandler from '../api/whatsapp/replies.js';
import settingsHandler from '../api/whatsapp/settings.js';

const employee = { id: 'EMP-1', name: 'Asha Singh', password: 'own-password', role: 'Employee', status: 'Active' };
const other = { id: 'EMP-2', name: 'Asha Sharma', password: 'other-password', role: 'Employee', status: 'Active' };
const employees = [employee, other];
const own = { id: 'L1', name: 'Student One', counselor: employee.name, phone: '+91 98765 43210' };
const foreign = { id: 'L2', name: 'Student Two', counselor: other.name, phone: '+91 98765 43211' };
const auth = user => 'Basic ' + Buffer.from(JSON.stringify({ id: user.id, password: user.password })).toString('base64');
function response() {
  return { code: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
function mockDatabase(t, overrides = {}) {
  const data = { employees, leads: [own, foreign], whatsappMessages: { one: { id: 'one', leadPhone: own.phone, direction: 'incoming', timestamp: new Date().toISOString() }, two: { id: 'two', leadPhone: foreign.phone, direction: 'incoming', timestamp: '2026-01-02' } }, whatsappSettings: { accessToken: 'private-token', phoneNumberId: 'private-id', templates: ['welcome'] }, ...overrides };
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    calls.push({ url, options });
    if (url.startsWith('https://graph.facebook.com/')) return { ok: true, json: async () => ({ messages: [{ id: 'sent-one' }] }) };
    const node = new URL(url).pathname.split('/').at(-1).replace('.json', '');
    if (!Object.hasOwn(data, node) && !options.method) throw new Error('Unexpected read: ' + node);
    return { ok: true, json: async () => data[node] ?? null };
  });
  return calls;
}
test('exact ownership, full international number, shared numbers and ambiguous names fail closed', () => {
  assert.equal(phoneKey(own.phone), '919876543210');
  assert.equal(canAccessPhone(employee, own.phone, [own, foreign], employees), true);
  assert.equal(canAccessPhone(employee, foreign.phone, [own, foreign], employees), false);
  assert.equal(canAccessPhone(employee, own.phone, [own, { ...foreign, phone: own.phone }], employees), false);
  assert.equal(canAccessPhone(employee, own.phone, [{ ...own, counselor: 'Asha' }], employees), false);
  assert.equal(canAccessPhone(employee, own.phone, [own], [...employees, { ...other, name: employee.name }]), false);
  assert.equal(canAccessPhone(employee, '+44 98765 43210', [own], employees), false);
  assert.equal(canAccessPhone(employee, '', [own], employees), false);
});
test('student list and inbox contain only allotted students', async t => {
  mockDatabase(t);
  for (const [handler, field] of [[studentsHandler, 'students'], [repliesHandler, 'replies']]) {
    const res = response();
    await handler({ method: 'GET', headers: { authorization: auth(employee) } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body[field].length, 1);
  }
});
test('forged role, phone and lead ID cannot read, send or mark another student chat', async t => {
  const calls = mockDatabase(t);
  for (const [handler, method] of [[messagesHandler, 'GET'], [sendHandler, 'POST'], [repliesHandler, 'PATCH']]) {
    const res = response();
    await handler({ method, headers: { authorization: auth(employee) }, query: { phone: foreign.phone }, body: { phone: foreign.phone, message: 'test', role: 'Admin', leadId: own.id } }, res);
    assert.equal(res.code, 403);
  }
  assert.equal(calls.some(call => call.url.includes('graph.facebook') || call.url.includes('whatsappMessages')), false);
});
test('anonymous, incorrect password and deleted employee are rejected', async t => {
  mockDatabase(t);
  for (const authorization of ['', auth({ ...employee, password: 'emp123' }), auth({ ...employee, id: 'deleted' })]) {
    const res = response();
    await studentsHandler({ method: 'GET', headers: { authorization } }, res);
    assert.equal(res.code, 401);
  }
});
test('reassignment immediately revokes access to an already opened chat', async t => {
  mockDatabase(t, { leads: [{ ...own, counselor: other.name }] });
  const res = response();
  await messagesHandler({ method: 'GET', headers: { authorization: auth(employee) }, query: { phone: own.phone } }, res);
  assert.equal(res.code, 403);
});
test('own chat sends through Meta and records authenticated sender', async t => {
  const calls = mockDatabase(t);
  const res = response();
  await sendHandler({ method: 'POST', headers: { authorization: auth(employee) }, body: { phone: own.phone, message: 'Hello' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.message.senderId, employee.id);
  const sent = calls.find(call => call.url.includes('graph.facebook'));
  assert.equal(JSON.parse(sent.options.body).to, '919876543210');
});
test('employee can load template names but cannot see credentials or delete chats', async t => {
  mockDatabase(t);
  const res = response();
  await settingsHandler({ method: 'GET', headers: { authorization: auth(employee) } }, res);
  assert.deepEqual(res.body, { templates: ['welcome'] });
  const deletion = response();
  await repliesHandler({ method: 'DELETE', headers: { authorization: auth(employee) }, body: { phone: own.phone } }, deletion);
  assert.equal(deletion.code, 403);
});
