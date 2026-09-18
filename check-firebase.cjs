// Read-only by default. --write-test verifies and removes an isolated test record.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const config = readFileSync(join(__dirname, 'src/firebase.js'), 'utf8');
const databaseURL = config.match(/databaseURL:\s*["']([^"']+)/)?.[1];
if (!databaseURL) throw new Error('Firebase database URL not found');
const base = `${databaseURL}/lakshya_crm_central_db`;
async function request(path, method = 'GET', body) {
  const response = await fetch(`${base}/${path}.json`, {
    method, signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  if (!response.ok) throw new Error(`Firebase ${method} failed: HTTP ${response.status}`);
  return response.json();
}
async function check() {
  const [leadData, employeeData] = await Promise.all([request('leads'), request('employees')]);
  const leads = Object.values(leadData || {}).filter(Boolean);
  const employees = Object.values(employeeData || {}).filter(Boolean);
  console.log(JSON.stringify({
    connection: 'OK', leads: leads.length, employees: employees.length,
    savedStudentCategories: {
      Academic: leads.filter(l => l.studentCategory === 'Academic').length,
      Sales: leads.filter(l => l.studentCategory === 'Sales').length,
      notAssigned: leads.filter(l => !l.studentCategory).length
    },
    savedEmployeeCategories: {
      Academic: employees.filter(e => e.category === 'Academic').length,
      Sales: employees.filter(e => e.category === 'Sales').length,
      notAssigned: employees.filter(e => !e.category).length
    }
  }, null, 2));
  if (process.argv.includes('--write-test')) {
    const path = `_diagnostics/category_check_${randomUUID()}`;
    const record = { studentCategory: 'Academic', category: 'Sales', salesSegment: 'B2B2C', stage: 'Onboarding', includeAcademic: true };
    try {
      await request(path, 'PUT', record);
      assert.deepEqual(await request(path), record);
      await request(path, 'PATCH', { studentCategory: 'Sales', category: 'Academic', salesSegment: '' });
      assert.deepEqual(await request(path), { ...record, studentCategory: 'Sales', category: 'Academic', salesSegment: '' });
      console.log('Isolated write/read/update verification: PASS');
    } finally {
      await request(path, 'DELETE');
      assert.equal(await request(path), null);
      console.log('Temporary verification record removed.');
    }
  }
}
check().catch(error => { console.error(error.message); process.exitCode = 1; });
