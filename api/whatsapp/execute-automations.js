const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const now = Date.now();

    // 1. Fetch Automations
    const authRes = await fetch(`${FIREBASE_URL}/whatsappAutomations.json`);
    const automationsData = await authRes.json();
    if (!automationsData) {
      return res.status(200).json({ success: true, message: 'No automations found.' });
    }

    const automations = Object.values(automationsData);
    
    // Find due automations
    const dueAutomations = automations.filter(a => 
      a.status === 'pending' && new Date(a.scheduledTime).getTime() <= now
    );

    if (dueAutomations.length === 0) {
      return res.status(200).json({ success: true, message: 'No due automations.' });
    }

    // 2. Fetch Settings and Leads
    const [settingsRes, leadsRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/whatsappSettings.json`),
      fetch(`${FIREBASE_URL}/leads.json`)
    ]);

    const settings = await settingsRes.json();
    const leadsList = await leadsRes.json();

    if (!settings || !settings.phoneNumberId || !settings.accessToken) {
      return res.status(400).json({ error: 'WhatsApp API credentials missing.' });
    }

    if (!leadsList || !Array.isArray(leadsList)) {
      return res.status(200).json({ success: true, message: 'No leads found.' });
    }

    const { phoneNumberId, accessToken } = settings;
    const results = [];

    // 3. Execute Automations
    for (const automation of dueAutomations) {
      // Find matching leads
      const targetLeads = leadsList.filter(l => l.stage === automation.stage && l.phone);

      let successCount = 0;
      let failCount = 0;

      for (const lead of targetLeads) {
        let cleanPhone = lead.phone.replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

        const payload = {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: {
            name: automation.template,
            language: { code: 'en' }
          }
        };

        try {
          const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          if (metaRes.ok) successCount++;
          else failCount++;
        } catch (e) {
          failCount++;
        }
        
        // Small delay to prevent rate limit
        await new Promise(r => setTimeout(r, 100));
      }

      // Mark automation as completed
      automation.status = 'completed';
      automation.executedAt = new Date().toISOString();
      automation.stats = { success: successCount, failed: failCount, total: targetLeads.length };

      await fetch(`${FIREBASE_URL}/whatsappAutomations/${automation.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automation)
      });

      results.push({ id: automation.id, stats: automation.stats });
    }

    return res.status(200).json({ success: true, executed: results.length, results });

  } catch (error) {
    console.error('Automation error:', error);
    return res.status(500).json({ error: 'Failed to execute automations.' });
  }
}
