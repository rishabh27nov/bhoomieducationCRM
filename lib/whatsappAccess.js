import { timingSafeEqual } from 'node:crypto';
import { ADMIN_CREDENTIALS, INSTITUTE_CREDENTIALS } from '../src/data/mockData.js';
import { values, canAccessPhone } from './studentChatAccess.js';

export const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';
export async function readData(node) {
  const response = await fetch(`${FIREBASE_URL}/${node}.json`);
  if (!response.ok) throw new Error('Database unavailable');
  return response.json();
}
const equal = (a, b) => {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
};
export async function authorize(req, res, { phone, adminOnly = false } = {}) {
  res.setHeader('Cache-Control', 'no-store');
  const employees = values(await readData('employees'));
  const header = req.headers.authorization || '';
  let user;
  if (header.startsWith('Basic ')) {
    let credentials;
    try { credentials = JSON.parse(Buffer.from(header.slice(6), 'base64').toString('utf8')); } catch {}
    if (credentials) {
      const accounts = [...employees, ADMIN_CREDENTIALS, INSTITUTE_CREDENTIALS];
      user = accounts.find(account => String(account.id || account.username) === String(credentials.id) && equal(account.password, credentials.password));
    }
  } else if (header.startsWith('Bearer ')) {
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyAZVHMqc7oYLRUbcqIfzLYYUhZspVjolXU', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: header.slice(7) })
    });
    const identity = (await response.json()).users?.[0];
    if (response.ok && identity?.emailVerified && !identity.disabled) {
      const email = identity.email.toLowerCase();
      user = employees.find(account => String(account.email || '').toLowerCase() === email);
      if ([ADMIN_CREDENTIALS.email, 'bhoomieducation44@gmail.com'].includes(email)) user = ADMIN_CREDENTIALS;
      else if (email === INSTITUTE_CREDENTIALS.email) user = INSTITUTE_CREDENTIALS;
    }
  }
  if (!user || (user.status && user.status !== 'Active')) {
    res.status(401).json({ error: 'Please log in again with your current account credentials.' });
    return null;
  }
  const isAdmin = ['Admin', 'Institute'].includes(user.role);
  if (adminOnly && !isAdmin) {
    res.status(403).json({ error: 'Administrator access required.' });
    return null;
  }
  const leads = values(await readData('leads'));
  const canAccess = target => canAccessPhone(user, target, leads, employees);
  if (phone !== undefined && !canAccess(phone)) {
    res.status(403).json({ error: 'You can only chat with students currently allotted to you. Shared or unassigned numbers require admin review.' });
    return null;
  }
  return { user, employees, leads, canAccess, isAdmin };
}
