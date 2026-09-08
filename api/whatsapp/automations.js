const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - Fetch automations
  if (req.method === 'GET') {
    try {
      const fbRes = await fetch(`${FIREBASE_URL}/whatsappAutomations.json`);
      const data = await fbRes.json();
      const automations = data ? Object.values(data) : [];
      return res.status(200).json(automations);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch automations' });
    }
  }

  // POST - Create new automation
  if (req.method === 'POST') {
    try {
      const newAutomation = req.body;
      if (!newAutomation.id) {
        return res.status(400).json({ error: 'Automation ID is required' });
      }

      await fetch(`${FIREBASE_URL}/whatsappAutomations/${newAutomation.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAutomation)
      });
      
      return res.status(200).json({ success: true, message: 'Automation scheduled' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save automation' });
    }
  }

  // DELETE - Remove automation
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID is required' });

      await fetch(`${FIREBASE_URL}/whatsappAutomations/${id}.json`, {
        method: 'DELETE'
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete automation' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
