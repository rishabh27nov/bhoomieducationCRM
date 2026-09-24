import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeIncomingLeads } from '../lib/mergeIncomingLeads.js';

test('Meta re-import with missing optional fields produces Firebase-safe data', () => {
  const result = mergeIncomingLeads([{ id: 'meta1', name: 'Student' }], [
    { id: 'meta1', counselor: 'Counselor', email: undefined, extra: { missing: undefined } }
  ]);
  assert.deepEqual(result, [{ id: 'meta1', name: 'Student', counselor: 'Counselor', extra: {} }]);
});

test('re-import preserves existing CRM work and adds new students without mutation', () => {
  const original = [{ id: '1', notes: 'Called', stage: 'Follow Up', counselor: 'A', status: 'Open' }];
  const result = mergeIncomingLeads(original, [
    { id: '1', notes: '', stage: 'New', counselor: 'B', status: 'New' }, { id: '2', name: 'New student' }
  ]);
  assert.equal(result.length, 2);
  assert.deepEqual(result[1], original[0]);
  assert.equal(original.length, 1);
});
