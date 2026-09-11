const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

export default async function handler(req, res) {
  const { id } = req.query || {};
  if (req.method === 'GET') {
    const data = await (await fetch(`${FIREBASE_URL}/whatsappCycleTemplates.json`)).json();
    return res.status(200).json(data ? Object.values(data) : []);
  }
  if (req.method === 'POST' || req.method === 'PUT') {
    const cycle = req.body || {};
    if (!cycle.name || !cycle.stage || !Array.isArray(cycle.messages) || cycle.messages.length === 0) return res.status(400).json({ error: 'Cycle name, stage and templates are required' });
    const cycleId = id || cycle.id || `CYCLE-TEMPLATE-${Date.now()}`;
    const record = { ...cycle, id: cycleId, updatedAt: new Date().toISOString(), ...(req.method === 'POST' && { createdAt: new Date().toISOString() }) };
    await fetch(`${FIREBASE_URL}/whatsappCycleTemplates/${cycleId}.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
    return res.status(200).json({ success: true, cycle: record });
  }
  if (req.method === 'DELETE' && id) {
    await fetch(`${FIREBASE_URL}/whatsappCycleTemplates/${id}.json`, { method: 'DELETE' });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
