const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const now = Date.now();

    // 1. Fetch Automations
    const authRes = await fetch(`${FIREBASE_URL}/whatsappAutomations.json?t=${now}`);
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

    // 2. Fetch Settings, Leads, and SentTemplates tracking
    const [settingsRes, leadsRes, stRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/whatsappSettings.json?t=${now}`),
      fetch(`${FIREBASE_URL}/leads.json?t=${now}`),
      fetch(`${FIREBASE_URL}/sentTemplates.json?t=${now}`)
    ]);

    const settings = await settingsRes.json();
    const leadsList = await leadsRes.json();
    const sentTemplatesMap = (await stRes.json()) || {};

    if (!settings || !settings.phoneNumberId || !settings.accessToken) {
      return res.status(400).json({ error: 'WhatsApp API credentials missing.' });
    }

    if (!leadsList || !Array.isArray(leadsList)) {
      return res.status(200).json({ success: true, message: 'No leads found.' });
    }

    const { phoneNumberId, accessToken } = settings;
    const results = [];
    const newChatMessages = []; // To store chat history

    // 3. Execute Automations
    for (const automation of dueAutomations) {
      // Find matching leads who haven't received this template yet (using dedicated sentTemplates node)
      const targetLeads = leadsList.filter(l => 
        l && 
        l.stage === automation.stage && 
        l.phone && 
        !((sentTemplatesMap[l.id] || [])).includes(automation.template)
      );

      let successCount = 0;
      let failCount = 0;
      let lastError = null;
      const successfulLeads = [];
      const failedLeads = [];

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
          
          if (metaRes.ok) {
            successCount++;
            successfulLeads.push({ name: lead.name, phone: lead.phone });
            
            // Track sent template using lead's ID as key (reliable, no index issues)
            const currentTemplates = lead.sentTemplates || [];
            if (!currentTemplates.includes(automation.template)) {
              const updatedSentTemplates = [...currentTemplates, automation.template];
              // Update by searching and patching the specific lead's sentTemplates field
              await fetch(`${FIREBASE_URL}/sentTemplates/${lead.id}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSentTemplates)
              });
            }

            // Log for chat history
            newChatMessages.push({
              id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              direction: 'outgoing',
              leadPhone: lead.phone,
              text: `[Automated Template: ${automation.template}]`,
              timestamp: new Date().toISOString(),
              status: 'sent'
            });
          } else {
            failCount++;
            const errData = await metaRes.json();
            lastError = errData?.error?.message || 'Unknown Meta API Error';
            failedLeads.push({ name: lead.name, phone: lead.phone, error: lastError });
          }
        } catch (e) {
          failCount++;
          lastError = e.message;
          failedLeads.push({ name: lead.name, phone: lead.phone, error: lastError });
        }
        
        // Small delay to prevent rate limit
        await new Promise(r => setTimeout(r, 100));
      }

      // Mark automation as completed
      automation.status = 'completed';
      automation.executedAt = new Date().toISOString();
      automation.stats = { 
        success: successCount, 
        failed: failCount, 
        total: targetLeads.length,
        ...(lastError && { lastError })
      };

      await fetch(`${FIREBASE_URL}/whatsappAutomations/${automation.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automation)
      });

      // Log Campaign Report
      const campaignLog = {
        id: `auto_run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        campaignType: 'Automation',
        template: automation.template,
        targetAudience: targetLeads.length,
        successfulCount: successCount,
        failedCount: failCount,
        successfulLeads,
        failedLeads
      };

      await fetch(`${FIREBASE_URL}/whatsappCampaignLogs/${campaignLog.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignLog)
      });

      results.push({ id: automation.id, stats: automation.stats });
    }

    // Save all new chat messages to Firebase
    if (newChatMessages.length > 0) {
      try {
        const getMsgs = await fetch(`${FIREBASE_URL}/whatsappMessages.json`);
        let currentMsgs = await getMsgs.json();
        if (!Array.isArray(currentMsgs)) currentMsgs = [];
        
        const combinedMsgs = [...currentMsgs, ...newChatMessages];
        
        await fetch(`${FIREBASE_URL}/whatsappMessages.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(combinedMsgs)
        });
      } catch (err) {
        console.error('Failed to log chat messages:', err);
      }
    }

    return res.status(200).json({ success: true, executed: results.length, results });

  } catch (error) {
    console.error('Automation error:', error);
    return res.status(500).json({ error: 'Failed to execute automations.' });
  }
}
