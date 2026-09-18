import test from 'node:test';
import assert from 'node:assert/strict';
import { studentCategory, bulkRecipients, resolveRecipientCategory, ACADEMIC_STAGES } from '../lib/studentCategory.js';
import { getPipelineStagesForLead } from '../src/data/mockData.js';
import executeAutomations from '../api/whatsapp/execute-automations.js';

const employees = [{ name: 'Academic Teacher', category: 'Academic' }];
const students = [
  { id: 'b2c', leadType: 'B2C', currentClass: 'Class 12', phone: '9000000001' },
  { id: 'b2b2c', leadType: 'B2B2C', currentClass: 'Class 12', phone: '9000000002' },
  { id: 'social', source: 'Instagram', currentClass: 'Class 12', phone: '9000000003' },
  { id: 'academic', studentCategory: 'Academic', currentClass: 'Class 12', phone: '9000000004' },
  { id: 'legacy', counselor: 'Academic Teacher', currentClass: 'Class 12', phone: '9000000005' }
];

test('Class 12 Sales audience excludes Academic students until opted in', () => {
  const classified = students.map(student => ({ ...student, studentCategory: studentCategory(student, employees) }));
  assert.deepEqual(bulkRecipients(classified).map(student => student.id), ['b2c', 'b2b2c', 'social']);
  assert.equal(bulkRecipients(classified, true).length, 5);
  assert.equal(studentCategory({ counselor: 'Academic Teacher', studentCategory: 'Sales' }, employees), 'Sales');
});

test('Academic pipeline is independent of the original Sales segment', () => {
  for (const segment of ['B2C', 'B2B2C']) {
    assert.deepEqual(getPipelineStagesForLead(segment, 'Academic'), ACADEMIC_STAGES);
    assert.ok(!getPipelineStagesForLead(segment, 'Sales').includes('Classes Ongoing'));
  }
});

test('old campaign retries resolve Academic recipients by phone and preserve shared-phone opt-in', () => {
  assert.equal(resolveRecipientCategory({ phone: '+91 9000000004' }, students), 'Academic');
  assert.equal(resolveRecipientCategory({ id: 'social', phone: '9000000004' }, students), 'Academic');
  assert.equal(resolveRecipientCategory({ phone: '9000000001' }, students), 'Sales');
});

for (const includeAcademic of [false, true]) {
  test(`scheduled messages respect Academic opt-in: ${includeAcademic}`, async t => {
    const previousSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test-secret';
    t.after(() => { if (previousSecret === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previousSecret; });
    const automation = { id: 'test', status: 'pending', stage: 'Seminar', template: 'test', scheduledTime: '2000-01-01', includeAcademic };
    const sentPhones = [];
    t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
      const path = new URL(url).pathname;
      let data = {};
      if (url.includes('graph.facebook.com')) sentPhones.push(JSON.parse(options.body).to);
      else if (path.endsWith('/whatsappAutomations.json')) data = { test: automation };
      else if (path.endsWith('/whatsappAutomations/test.json')) data = automation;
      else if (path.endsWith('/whatsappSettings.json')) data = { phoneNumberId: 'fake', accessToken: 'fake' };
      else if (path.endsWith('/leads.json')) data = students.map(student => ({ ...student, stage: 'Seminar' }));
      else if (path.endsWith('/employees.json')) data = employees;
      return { ok: true, headers: { get: () => 'test-etag' }, json: async () => data };
    });
    const response = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
    await executeAutomations({ method: 'POST', headers: { authorization: 'Bearer test-secret' } }, response);
    assert.equal(response.code, 200);
    assert.deepEqual(sentPhones, students.slice(0, includeAcademic ? 5 : 3).map(student => `91${student.phone}`));
  });
}
