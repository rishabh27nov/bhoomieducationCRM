import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { matchesStudentSearch, readWhatsAppResponse } from '../src/utils/studentSearch.js';
import { localApiMiddleware } from '../lib/devApi.js';

test('number search ignores spaces, hyphens and country code in stored number', () => {
  const student = { name: 'Student One', phone: '+91 93488-75208' };
  for (const query of ['9348875208', '93488 75208', '+91 9348875208', 'Student', ' 9348875208 ']) {
    assert.equal(matchesStudentSearch(student, query), true, query);
  }
  assert.equal(matchesStudentSearch(student, '0000000000'), false);
  assert.equal(matchesStudentSearch(student, 'unknown93488'), false);
});

test('empty proxy failure gives a service error instead of a JSON parsing error', async () => {
  await assert.rejects(readWhatsAppResponse(new Response('', { status: 502 })), /service could not be reached/);
  await assert.rejects(readWhatsAppResponse(new Response('{"error":"Access denied"}', { status: 403 })), /Access denied/);
});

test('Vite middleware serves assigned students without a port 5000 server', async t => {
  const employee = { id: 'E1', name: 'Supriya', password: 'test-password', role: 'Employee' };
  t.mock.method(globalThis, 'fetch', async url => ({ ok: true, json: async () => url.endsWith('/employees.json') ? [employee] : [{ id: 'L1', name: 'Student', phone: '9348875208', counselor: 'Supriya' }] }));
  const req = Readable.from([]);
  req.url = '/api/whatsapp/students';
  req.method = 'GET';
  req.headers = { authorization: 'Basic ' + Buffer.from(JSON.stringify({ id: employee.id, password: employee.password })).toString('base64') };
  const res = { setHeader() {}, end(body) { this.body = JSON.parse(body); } };
  await localApiMiddleware(req, res, () => assert.fail('Student Chat must not fall through to the proxy'));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.students[0].phone, '9348875208');
});
