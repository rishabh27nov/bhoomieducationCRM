export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET Verification Handshake for Meta (Facebook & Instagram) Webhooks
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] || req.query['mode'];
    const token = req.query['hub.verify_token'] || req.query['verify_token'];
    const challenge = req.query['hub.challenge'] || req.query['challenge'];

    if (mode === 'subscribe' && token === 'bhoomi_crm_meta_token_2026') {
      console.log('✅ Meta Webhook Verified Successfully!');
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ error: 'Verification failed. Token mismatch.' });
  }

  // POST Incoming Lead Ingestion Payload
  if (req.method === 'POST') {
    try {
      const payload = req.body || {};
      const platform = req.query.platform === 'instagram' ? 'Instagram Lead Ad' : 'Facebook Lead Form';

      console.log(`📩 Received ${platform} Payload:`, JSON.stringify(payload));

      // Extract lead details if sent from Meta LeadGen event
      let leadName = 'Meta Lead Student';
      let leadPhone = '+91 98765 43210';
      let leadEmail = 'meta.lead@bhoomieducation.com';
      let leadCourse = 'NEET / JEE Enquiry';

      if (payload.entry && payload.entry[0] && payload.entry[0].changes) {
        const changeVal = payload.entry[0].changes[0]?.value;
        
        // 1. Direct Field Data Extraction
        if (changeVal?.field_data) {
          changeVal.field_data.forEach(f => {
            if (f.name === 'full_name' || f.name === 'name') leadName = f.values[0];
            if (f.name === 'phone_number' || f.name === 'phone') leadPhone = f.values[0];
            if (f.name === 'email') leadEmail = f.values[0];
            if (f.name === 'course' || f.name === 'select_course') leadCourse = f.values[0];
          });
        }
        
        // 2. Real Graph API leadgen_id resolution if Meta sends leadgen_id
        const leadgenId = changeVal?.leadgen_id;
        if (leadgenId) {
          try {
            const pageToken = process.env.META_PAGE_ACCESS_TOKEN || '';
            if (pageToken) {
              const graphRes = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${pageToken}`);
              const graphData = await graphRes.json();
              if (graphData && graphData.field_data) {
                graphData.field_data.forEach(f => {
                  if (f.name === 'full_name' || f.name === 'name') leadName = f.values[0];
                  if (f.name === 'phone_number' || f.name === 'phone') leadPhone = f.values[0];
                  if (f.name === 'email') leadEmail = f.values[0];
                  if (f.name === 'course' || f.name === 'select_course') leadCourse = f.values[0];
                });
              }
            }
          } catch (e) {
            console.error("Meta Graph API fetch error:", e);
          }
        }
      }

      const newLead = {
        id: `LEAD-META-${Date.now()}`,
        name: payload.name || leadName,
        phone: payload.phone || leadPhone,
        email: payload.email || leadEmail,
        course: payload.course || leadCourse,
        city: payload.city || 'Online Meta Lead',
        source: platform,
        status: 'New Lead',
        createdAt: new Date().toISOString(),
        notes: `Auto-ingested via Live Meta Lead Ads Webhook.`
      };

      // Push to Firebase Realtime Database lakshya_crm_central_db node
      const newLeadId = `LEAD-META-${Date.now()}`;
      const firebaseLeadObject = {
        id: newLeadId,
        name: payload.name || leadName,
        phone: payload.phone || leadPhone,
        email: payload.email || leadEmail,
        targetCourse: payload.course || leadCourse,
        course: payload.course || leadCourse,
        batch: `Batch ${(payload.course || leadCourse).split(' ')[0]} (Online)`,
        feeBudget: payload.feeBudget || 'N/A',
        stage: 'New Lead',
        counselor: 'Niharika',
        city: payload.city || 'Online Meta Lead',
        source: platform,
        status: 'New Lead',
        createdAt: new Date().toISOString(),
        notes: `Auto-ingested via Live Meta Lead Ads Webhook.`
      };

      const firebaseDbUrl = `https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db/leads/${newLeadId}.json`;
      fetch(firebaseDbUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firebaseLeadObject)
      }).catch(e => console.error("Firebase sync error:", e));

      return res.status(200).json({
        success: true,
        message: 'Lead received successfully by Bhoomi CRM',
        lead: newLead,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(200).json({ success: true });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
