const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
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

  // POST - Create new automation(s)
  if (req.method === 'POST') {
    try {
      const payload = req.body;
      const automations = Array.isArray(payload) ? payload : [payload];

      for (const auto of automations) {
        if (!auto.id) {
          return res.status(400).json({ error: 'Automation ID is required' });
        }
        await fetch(`${FIREBASE_URL}/whatsappAutomations/${auto.id}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auto)
        });
      }
      
      return res.status(200).json({ success: true, message: 'Automation(s) scheduled' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save automation' });
    }
  }

  // PATCH - Edit a future pending automation without changing its cycle details.
  if (req.method === 'PATCH') {
    try {
      const { id, template, scheduledTime } = req.body || {};
      if (!id || !template || !scheduledTime) {
        return res.status(400).json({ error: 'ID, template and scheduled time are required' });
      }

      const existingRes = await fetch(`${FIREBASE_URL}/whatsappAutomations/${id}.json`);
      const existing = await existingRes.json();
      if (!existing) return res.status(404).json({ error: 'Automation not found' });
      if (existing.status !== 'pending') {
        return res.status(409).json({ error: 'Only pending automations can be edited' });
      }

      const updatedAutomation = {
        ...existing,
        template: template.trim(),
        scheduledTime,
        updatedAt: new Date().toISOString()
      };
      await fetch(`${FIREBASE_URL}/whatsappAutomations/${id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAutomation)
      });
      return res.status(200).json({ success: true, automation: updatedAutomation });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update automation' });
    }
  }

  // DELETE - Remove automation
  if (req.method === 'DELETE') {
    try {
      const { id, cycleId } = req.query;
      
      if (cycleId) {
        // Bulk delete by cycleId
        const fbRes = await fetch(`${FIREBASE_URL}/whatsappAutomations.json`);
        const data = await fbRes.json();
        if (data) {
          const promises = Object.values(data)
            .filter(a => a.cycleId === cycleId)
            .map(a => fetch(`${FIREBASE_URL}/whatsappAutomations/${a.id}.json`, { method: 'DELETE' }));
          await Promise.all(promises);
        }
      } else if (id) {
        // Delete by specific ID
        await fetch(`${FIREBASE_URL}/whatsappAutomations/${id}.json`, {
          method: 'DELETE'
        });
      } else {
        return res.status(400).json({ error: 'ID or cycleId is required' });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete automation' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
