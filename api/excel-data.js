const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzB9yYyoZvf3S00NYfpOoG1qncFwQgYrEbbJ_3v3-Qc5RVlw02rhRUy8qcZx3v21IkA/exec';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=students&ts=${Date.now()}`, {
      headers: { Accept: 'application/json' }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || 'Google Sheet could not be reached.');
    if (!Array.isArray(payload?.students)) {
      return res.status(422).json({
        error: 'The Google Apps Script is connected, but it is not returning student rows yet.',
        setupRequired: true
      });
    }
    return res.status(200).json({ students: payload.students, updatedAt: payload.updatedAt || new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ error: error.message || 'Could not load Google Sheet data.' });
  }
}
