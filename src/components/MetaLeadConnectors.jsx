import React, { useState, useEffect, useCallback } from 'react';
import {
  Share2,
  Copy,
  CheckCircle2,
  Key,
  RefreshCw,
  Zap,
  ShieldCheck,
  Send,
  Sliders,
  Bell,
  HelpCircle,
  Sparkles,
  Layers,
  Facebook,
  Instagram,
  Check,
  Globe,
  AlertCircle
} from 'lucide-react';

export default function MetaLeadConnectors({ leads, onAddLead, counselors }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [customDomain, setCustomDomain] = useState(() => {
    return 'https://bhoomieducation-crm.vercel.app';
  });

  const getWebhookUrl = (platform) => `${customDomain}/api/webhooks/meta-leads?platform=${platform}`;

  // Connection Tokens and Webhook URLs
  const [fbConfig, setFbConfig] = useState({
    status: 'Active',
    apiKey: 'fb_live_sec_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 8),
    verifyToken: 'bhoomi_crm_meta_token_2026',
    autoAssignCounselor: 'Auto-Distribute (Round Robin)',
    leadCategory: 'NEET / JEE Enquiry',
    pageName: 'Bhoomi Education Official FB Page'
  });

  const [metaAccessToken, setMetaAccessToken] = useState('EAA2NPsW6AZAMBScsZBS5Mumg1rqZAcLztCpmNq9bZB57ZB8Yp1wZBiqI3hPkDch0YnS54wTwieYm2rTkvJWmLOukdH72ZBRPZBIRZABEHex11CjhISmsnZA8wylQm6wKleyvjQMBsGYzJE6CJMgJ3dmc4SwyZBMn0QChtA9CMv6BdisWAiKhsBUQuyg40f2Wev5ZAgZDZD');
  const [metaAssetId, setMetaAssetId] = useState('1008041794449442');
  const [credentialsSaved, setCredentialsSaved] = useState(true);
  const [metaFetchStatus, setMetaFetchStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [metaFetchError, setMetaFetchError] = useState(null);
  const [metaRealLeads, setMetaRealLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [bulkCounselor, setBulkCounselor] = useState('');
  const [autoCounselors, setAutoCounselors] = useState([]);

  const toggleAutoCounselor = (name) => {
    setAutoCounselors(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const applyAutoAssign = () => {
    if (autoCounselors.length === 0) return alert('Please select at least one counselor for Auto-Assign.');
    
    let roundRobinIndex = 0;
    const toUpdate = [];
    const updatedLeads = metaRealLeads.map(lead => {
      if (lead.counselor === 'Unassigned') {
        const counselorToAssign = autoCounselors[roundRobinIndex % autoCounselors.length];
        roundRobinIndex++;
        const updated = { ...lead, counselor: counselorToAssign };
        toUpdate.push(updated);
        return updated;
      }
      return lead;
    });
    
    setMetaRealLeads(updatedLeads);
    if (onAddLead && toUpdate.length > 0) {
      onAddLead(toUpdate);
    }
    alert(`Auto-assigned ${roundRobinIndex} leads among ${autoCounselors.join(', ')}.`);
  };

  const handleSelectDateGroup = (e, dateStr) => {
    const leadsForDate = metaRealLeads.filter(l => new Date(l.createdAt).toLocaleDateString('en-GB') === dateStr).map(l => l.id);
    if (e.target.checked) {
      setSelectedLeads(prev => [...new Set([...prev, ...leadsForDate])]);
    } else {
      setSelectedLeads(prev => prev.filter(id => !leadsForDate.includes(id)));
    }
  };

  const handleBulkAssign = () => {
    if (selectedLeads.length === 0) return alert('Please select at least one lead.');
    if (!bulkCounselor) return alert('Please select a counselor to assign.');
    
    const toUpdate = [];
    const updatedLeads = metaRealLeads.map(lead => {
      if (selectedLeads.includes(lead.id)) {
        const updated = { ...lead, counselor: bulkCounselor };
        toUpdate.push(updated);
        return updated;
      }
      return lead;
    });
    
    setMetaRealLeads(updatedLeads);
    setSelectedLeads([]);
    if (onAddLead && toUpdate.length > 0) {
      onAddLead(toUpdate);
    }
    alert(`Successfully assigned ${selectedLeads.length} leads to ${bulkCounselor}.`);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(metaRealLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (e, id) => {
    if (e.target.checked) {
      setSelectedLeads(prev => [...prev, id]);
    } else {
      setSelectedLeads(prev => prev.filter(leadId => leadId !== id));
    }
  };

  // Fetch REAL leads from Meta Graph API
  const fetchMetaLeads = useCallback(async () => {
    setMetaFetchStatus('loading');
    setMetaFetchError(null);
    try {
      const userToken = metaAccessToken;

      // Step 1: Get Page Access Token from User Token
      const accountsRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}&fields=id,name,access_token`
      );
      const accountsData = await accountsRes.json();

      if (accountsData.error) {
        setMetaFetchError(`Meta API Error: ${accountsData.error.message}`);
        setMetaFetchStatus('error');
        return;
      }

      const pages = accountsData.data || [];
      if (pages.length === 0) {
        setMetaFetchError('No Facebook Pages found for this account.');
        setMetaFetchStatus('error');
        return;
      }

      const allLeads = [];

      // Iterate through ALL pages the user has access to
      for (const page of pages) {
        const pageToken = page.access_token;
        const pageId = page.id;

        // Step 2: Get lead gen forms for this page
        const formsRes = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${pageToken}&fields=id,name,status&limit=200`
        );
        const formsData = await formsRes.json();

        if (formsData.error) continue; // Skip if error on this specific page

        const forms = formsData.data || [];

        // Step 3: Fetch leads from each form
        for (const form of forms) {
          const leadsRes = await fetch(
            `https://graph.facebook.com/v19.0/${form.id}/leads?access_token=${pageToken}&fields=id,created_time,field_data&limit=500`
          );
          const leadsData = await leadsRes.json();
          if (leadsData.data) {
            for (const lead of leadsData.data) {
              const fields = {};
              (lead.field_data || []).forEach(f => { fields[f.name] = f.values?.[0] || ''; });
              const firstName = fields['first_name'] || '';
              const lastName = fields['last_name'] || '';
              const name = fields['full_name'] || fields['name'] || `${firstName} ${lastName}`.trim() || 'Unknown';
              const phone = fields['phone_number'] || fields['phone'] || fields['mobile'] || '';
              const email = fields['email'] || '';
              const course = fields['course'] || fields['course_interested'] || fields['program'] || fields['what_course_are_you_interested_in'] || '';
              const city = fields['city'] || fields['location'] || '';

              allLeads.push({
                id: `LEAD-META-${lead.id}`,
                name,
                phone,
                email,
                targetCourse: course,
                course,
                batch: form.name,
                city,
                source: 'Facebook Lead Form',
                counselor: 'Unassigned',
                status: 'New Lead',
                stage: 'New Enquiry',
                createdAt: lead.created_time,
                notes: `Real Meta Lead from Form: ${form.name} | Page: ${page.name}`,
              });
            }
          }
        }
      }

      // Sort leads by created_time (newest first)
      allLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setMetaRealLeads(allLeads);
      setMetaFetchStatus('success');

    } catch (err) {
      setMetaFetchError(`Network error: ${err.message}`);
      setMetaFetchStatus('error');
    }
  }, [metaAccessToken, onAddLead]);

  // Auto-fetch on load
  useEffect(() => {
    fetchMetaLeads();
  }, []);


  const [igConfig, setIgConfig] = useState({
    status: 'Active',
    apiKey: 'ig_live_sec_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 8),
    verifyToken: 'bhoomi_crm_meta_token_2026',
    autoAssignCounselor: 'Auto-Distribute (Round Robin)',
    leadCategory: 'Instagram DM & Lead Ads',
    accountName: '@bhoomieducation_official'
  });

  // Simulator State
  const [simTarget, setSimTarget] = useState('facebook'); // 'facebook' or 'instagram'
  const [simData, setSimData] = useState({
    name: 'Aarav Mehta',
    phone: '+91 98765 43210',
    email: 'aarav.mehta@example.com',
    course: 'NEET Dropper Batch 2026',
    city: 'Jaipur'
  });

  const [testLog, setTestLog] = useState([
    {
      id: 1,
      platform: 'Facebook',
      time: 'Today, 09:15 AM',
      leadName: 'Rohan Sharma',
      phone: '+91 98123 45678',
      course: 'JEE Main + Advanced 2026',
      status: 'Success',
      payload: '{ "entry": [ { "changes": [ { "field": "leadgen", "value": { "leadgen_id": "10982736451" } } ] } ] }'
    },
    {
      id: 2,
      platform: 'Instagram',
      time: 'Today, 08:30 AM',
      leadName: 'Sneha Patel',
      phone: '+91 99887 76655',
      course: 'NEET Foundation (11th)',
      status: 'Success',
      payload: '{ "entry": [ { "changes": [ { "field": "ig_leadgen", "value": { "ad_id": "ig_ad_99211" } } ] } ] }'
    }
  ]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRotateKey = (platform) => {
    const newKey = (platform === 'facebook' ? 'fb_' : 'ig_') + 'live_sec_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 8);
    if (platform === 'facebook') {
      setFbConfig(prev => ({ ...prev, apiKey: newKey }));
    } else {
      setIgConfig(prev => ({ ...prev, apiKey: newKey }));
    }
  };

  const handleRunSimulator = (e) => {
    e.preventDefault();
    if (!simData.name || !simData.phone) {
      alert('Please fill Name and Phone number for simulation');
      return;
    }

    const newLead = {
      id: `LEAD-META-${Date.now()}`,
      name: simData.name,
      phone: simData.phone,
      email: simData.email || 'meta.lead@bhoomieducation.com',
      targetCourse: simData.course,
      course: simData.course,
      batch: `Batch ${simData.course.split(' ')[0]} (${simData.city || 'Online'})`,
      feeBudget: 'N/A',
      stage: 'New Lead',
      counselor: counselors[0]?.name || 'Niharika',
      city: simData.city || 'Online Meta Lead',
      source: simTarget === 'facebook' ? 'Facebook Lead Form' : 'Instagram Lead Ad',
      status: 'New Lead',
      createdAt: new Date().toISOString(),
      notes: `Automated Lead Ingestion via ${simTarget.toUpperCase()} Webhook Connector.`
    };

    if (onAddLead) {
      onAddLead(newLead);
    }

    const newLogItem = {
      id: Date.now(),
      platform: simTarget === 'facebook' ? 'Facebook' : 'Instagram',
      time: 'Just now',
      leadName: simData.name,
      phone: simData.phone,
      course: simData.course,
      status: 'Success',
      payload: JSON.stringify({
        source: simTarget === 'facebook' ? 'FB_LEAD_FORM' : 'IG_LEAD_AD',
        form_name: simData.course,
        fields: simData
      }, null, 2)
    };

    setTestLog(prev => [newLogItem, ...prev]);

    alert(`✅ Success! Test Lead "${simData.name}" has been received and added to Student Enquiries!`);
    setSimData({
      name: '',
      phone: '',
      email: '',
      course: 'NEET Dropper Batch 2026',
      city: 'Delhi'
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#e2e8f0' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,56,41,0.9) 0%, rgba(10,28,20,0.95) 100%)',
        border: '1px solid rgba(82, 183, 136, 0.3)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #1877F2 0%, #E4405F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(24, 119, 242, 0.4)'
          }}>
            <Share2 size={32} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                Meta Lead Ads Connectors
              </h1>
              <span style={{
                background: 'rgba(82, 183, 136, 0.2)',
                color: '#52b788',
                border: '1px solid rgba(82, 183, 136, 0.4)',
                padding: '0.2rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Zap size={13} /> Exclusive FB & IG Integration Hub
              </span>
            </div>
            <p style={{ color: '#94a3b8', margin: '0.35rem 0 0 0', fontSize: '0.95rem' }}>
              Connect Facebook Lead Forms & Instagram Ads directly to Bhoomi CRM. Instant lead ingestion with Webhook URLs.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', uppercase: 'true' }}>Total Meta Leads Captured</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#52b788', marginTop: '0.15rem' }}>
              {leads.filter(l => l.source && (l.source.toLowerCase().includes('facebook') || l.source.toLowerCase().includes('instagram') || l.source.toLowerCase().includes('meta'))).length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Connectors Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}>
        
        {/* 1. FACEBOOK LEAD ADS CONNECTOR CARD */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(24, 119, 242, 0.35)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #1877F2, #4267B2)'
          }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(24, 119, 242, 0.15)',
                border: '1px solid rgba(24, 119, 242, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Facebook size={26} color="#1877F2" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Facebook Lead Ads
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{fbConfig.pageName}</span>
              </div>
            </div>

            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <CheckCircle2 size={13} /> Connector Active
            </span>
          </div>

          {/* Configuration Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            {/* Production Domain Setting */}
            <div style={{
              background: 'rgba(2, 6, 23, 0.4)',
              border: '1px solid rgba(82, 183, 136, 0.25)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem'
            }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#52b788', display: 'block', marginBottom: '0.35rem' }}>
                🌐 Live Domain Host (For Live Server / Facebook App)
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                placeholder="https://your-live-domain.com"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(82, 183, 136, 0.4)',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '0.25rem' }}>
                Localhost Facebook ke sath directly work nahi karta. Real server URL ya Ngrok URL yahan paste karein.
              </span>
            </div>

            {/* Webhook URL */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Facebook Webhook Endpoint URL
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={getWebhookUrl('facebook')}
                  style={{
                    flex: 1,
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={() => handleCopy(fbConfig.webhookUrl, 'fb_url')}
                  style={{
                    background: copiedKey === 'fb_url' ? '#10b981' : 'rgba(24, 119, 242, 0.2)',
                    color: copiedKey === 'fb_url' ? '#ffffff' : '#60a5fa',
                    border: '1px solid rgba(24, 119, 242, 0.4)',
                    borderRadius: '8px',
                    padding: '0.65rem 1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {copiedKey === 'fb_url' ? <Check size={15} /> : <Copy size={15} />}
                  {copiedKey === 'fb_url' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Secret API Key */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1' }}>
                  X-Lead-Api-Key (Secret Key)
                </label>
                <button
                  onClick={() => handleRotateKey('facebook')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: '600'
                  }}
                >
                  <RefreshCw size={12} /> Regenerate Key
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={fbConfig.apiKey}
                  style={{
                    flex: 1,
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#f59e0b',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    fontWeight: '600'
                  }}
                />
                <button
                  onClick={() => handleCopy(fbConfig.apiKey, 'fb_key')}
                  style={{
                    background: copiedKey === 'fb_key' ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                    color: copiedKey === 'fb_key' ? '#ffffff' : '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '0.65rem 1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem'
                  }}
                >
                  {copiedKey === 'fb_key' ? <Check size={15} /> : <Copy size={15} />}
                  {copiedKey === 'fb_key' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Verify Token */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Meta Verify Token (For App Handshake)
              </label>
              <input
                type="text"
                readOnly
                value={fbConfig.verifyToken}
                style={{
                  width: '100%',
                  background: 'rgba(2, 6, 23, 0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Meta Page & Access Tokens Configuration Box */}
            <div style={{
              background: 'rgba(2, 6, 23, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1rem',
              marginTop: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🔑 Meta Page & Access Tokens</span>
                <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>Saved</span>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Meta Page / Asset ID</label>
                <input
                  type="text"
                  placeholder="e.g. 1008041794449442"
                  value={metaAssetId}
                  onChange={e => setMetaAssetId(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '0.45rem 0.65rem',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Page Access Token (Graph API Token)</label>
                <input
                  type="password"
                  placeholder="Paste Long-Lived Page Access Token"
                  value={metaAccessToken}
                  onChange={e => setMetaAccessToken(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '0.45rem 0.65rem',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCredentialsSaved(true);
                  alert('✅ Meta Access Token & Page Asset ID (1008041794449442) Saved & Linked Successfully into Bhoomi CRM!');
                }}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 0.85rem',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  marginTop: '0.25rem'
                }}
              >
                Save Meta Credentials
              </button>
            </div>

            {/* Settings note */}
            <div style={{
              background: 'rgba(24, 119, 242, 0.08)',
              border: '1px dashed rgba(24, 119, 242, 0.3)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              fontSize: '0.82rem',
              color: '#93c5fd',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start'
            }}>
              <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Paste this Webhook URL into <strong>Meta Business Suite / FB Developer Portal</strong> under <code>Webhooks -&gt; Leadgen</code> to stream Facebook Form leads into CRM instantly.
              </span>
            </div>

          </div>
        </div>

        {/* 2. INSTAGRAM LEAD ADS & ADS CONNECTOR CARD */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(228, 64, 95, 0.35)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #833AB4, #FD1D1D, #FCB045)'
          }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(228, 64, 95, 0.15)',
                border: '1px solid rgba(228, 64, 95, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Instagram size={26} color="#E4405F" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Instagram Lead Ads & DMs
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{igConfig.accountName}</span>
              </div>
            </div>

            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <CheckCircle2 size={13} /> Connector Active
            </span>
          </div>

          {/* Configuration Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            {/* Webhook URL */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Instagram Webhook Endpoint URL
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={getWebhookUrl('instagram')}
                  style={{
                    flex: 1,
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={() => handleCopy(igConfig.webhookUrl, 'ig_url')}
                  style={{
                    background: copiedKey === 'ig_url' ? '#10b981' : 'rgba(228, 64, 95, 0.2)',
                    color: copiedKey === 'ig_url' ? '#ffffff' : '#f472b6',
                    border: '1px solid rgba(228, 64, 95, 0.4)',
                    borderRadius: '8px',
                    padding: '0.65rem 1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {copiedKey === 'ig_url' ? <Check size={15} /> : <Copy size={15} />}
                  {copiedKey === 'ig_url' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Secret API Key */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1' }}>
                  X-Lead-Api-Key (Secret Key)
                </label>
                <button
                  onClick={() => handleRotateKey('instagram')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: '600'
                  }}
                >
                  <RefreshCw size={12} /> Regenerate Key
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={igConfig.apiKey}
                  style={{
                    flex: 1,
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#f59e0b',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    fontWeight: '600'
                  }}
                />
                <button
                  onClick={() => handleCopy(igConfig.apiKey, 'ig_key')}
                  style={{
                    background: copiedKey === 'ig_key' ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                    color: copiedKey === 'ig_key' ? '#ffffff' : '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '0.65rem 1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem'
                  }}
                >
                  {copiedKey === 'ig_key' ? <Check size={15} /> : <Copy size={15} />}
                  {copiedKey === 'ig_key' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Verify Token */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Meta Verify Token
              </label>
              <input
                type="text"
                readOnly
                value={igConfig.verifyToken}
                style={{
                  width: '100%',
                  background: 'rgba(2, 6, 23, 0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Settings note */}
            <div style={{
              background: 'rgba(228, 64, 95, 0.08)',
              border: '1px dashed rgba(228, 64, 95, 0.3)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              fontSize: '0.82rem',
              color: '#f472b6',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start'
            }}>
              <Instagram size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Instagram Story Ads and Feed Lead forms will push student contact info directly to your Bhoomi CRM Student Enquiries list in real-time.
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* LOWER SECTION: TEST LEAD SIMULATOR & LIVE LOG STREAM */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
        
        {/* TEST SIMULATOR */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(82, 183, 136, 0.25)',
          borderRadius: '16px',
          padding: '1.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Zap size={22} color="#52b788" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Live Lead Ingestion Simulator
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 0, marginBottom: '1.25rem' }}>
            Simulate a real Facebook or Instagram Lead Form submission right now to test instant CRM lead creation.
          </p>

          <form onSubmit={handleRunSimulator} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Select Source Platform
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSimTarget('facebook')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: simTarget === 'facebook' ? '2px solid #1877F2' : '1px solid rgba(255,255,255,0.1)',
                    background: simTarget === 'facebook' ? 'rgba(24, 119, 242, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: simTarget === 'facebook' ? '#ffffff' : '#94a3b8',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Facebook size={16} color="#1877F2" /> Facebook Lead Form
                </button>

                <button
                  type="button"
                  onClick={() => setSimTarget('instagram')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: simTarget === 'instagram' ? '2px solid #E4405F' : '1px solid rgba(255,255,255,0.1)',
                    background: simTarget === 'instagram' ? 'rgba(228, 64, 95, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: simTarget === 'instagram' ? '#ffffff' : '#94a3b8',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Instagram size={16} color="#E4405F" /> Instagram Lead Ad
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Mehta"
                  value={simData.name}
                  onChange={e => setSimData({ ...simData, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={simData.phone}
                  onChange={e => setSimData({ ...simData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                  Course Interested
                </label>
                <select
                  value={simData.course}
                  onChange={e => setSimData({ ...simData, course: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="NEET Dropper Batch 2026">NEET Dropper Batch 2026</option>
                  <option value="NEET Class 12th Batch">NEET Class 12th Batch</option>
                  <option value="JEE Dropper / Repeater Batch 2026">JEE Dropper / Repeater Batch 2026</option>
                  <option value="JEE Main + Advanced 2026">JEE Main + Advanced 2026</option>
                  <option value="Class 11th Foundation NEET">Class 11th Foundation NEET</option>
                  <option value="Class 12th Board + JEE">Class 12th Board + JEE</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kota / Jaipur"
                  value={simData.city}
                  onChange={e => setSimData({ ...simData, city: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '0.5rem',
                background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.25rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(82, 183, 136, 0.35)',
                fontSize: '0.9rem'
              }}
            >
              <Send size={16} /> Send Test Lead Payload to CRM
            </button>
          </form>
        </div>

        {/* REALTIME META LEADS DIRECT ASSIGNMENT TABLE */}
        <div style={{
          gridColumn: '1 / -1',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(82, 183, 136, 0.4)',
          borderRadius: '16px',
          padding: '1.75rem',
          marginTop: '1rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: metaFetchStatus === 'loading' ? '#f59e0b' : metaFetchStatus === 'success' ? '#52b788' : '#ef4444', boxShadow: `0 0 10px ${metaFetchStatus === 'loading' ? '#f59e0b' : metaFetchStatus === 'success' ? '#52b788' : '#ef4444'}`, animation: metaFetchStatus === 'loading' ? 'pulse 1s infinite' : 'none' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                ⚡ Real Meta Leads — From Facebook/Instagram Forms
              </h3>
            </div>
            
            {selectedLeads.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>{selectedLeads.length} Selected</span>
                <select
                  value={bulkCounselor}
                  onChange={e => setBulkCounselor(e.target.value)}
                  style={{ background: 'rgba(2, 6, 23, 0.8)', color: '#fff', border: '1px solid #10b981', padding: '0.4rem', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                >
                  <option value="">-- Select Counselor --</option>
                  {counselors.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                </select>
                <button onClick={handleBulkAssign} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  Assign in Bulk
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(2, 6, 23, 0.5)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>Auto-Assign Setup:</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {counselors.map(c => (
                  <label key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoCounselors.includes(c.name)} onChange={() => toggleAutoCounselor(c.name)} />
                    {c.name}
                  </label>
                ))}
              </div>
              <button onClick={applyAutoAssign} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                Run Auto-Assign
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {metaFetchStatus === 'loading' && <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>⏳ Fetching from Meta...</span>}
              {metaFetchStatus === 'success' && <span style={{ fontSize: '0.8rem', color: '#52b788' }}>✅ {metaRealLeads.length} Leads Fetched</span>}
              {metaFetchStatus === 'error' && <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>❌ {metaFetchError}</span>}
              <button
                onClick={fetchMetaLeads}
                style={{ background: 'rgba(82,183,136,0.15)', border: '1px solid #52b788', color: '#52b788', borderRadius: '8px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              >
                🔄 Refresh From Meta
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(2, 6, 23, 0.7)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={metaRealLeads.length > 0 && selectedLeads.length === metaRealLeads.length}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>Student Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Contact Info</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Source & Form</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Target Course</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Assign Counselor</th>
                </tr>
              </thead>
              <tbody>
                {metaFetchStatus === 'loading' ? (
                  <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#f59e0b' }}>⏳ Fetching real leads from Meta Graph API...</td></tr>
                ) : metaFetchStatus === 'error' ? (
                  <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>❌ {metaFetchError} — Check your Access Token & Page ID</td></tr>
                ) : metaRealLeads.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No leads found in your Meta Lead Forms. Click "Refresh From Meta" to check again.</td></tr>
                ) : (
                  metaRealLeads.reduce((acc, lead, index, arr) => {
                    const leadDate = new Date(lead.createdAt).toLocaleDateString('en-GB');
                    const prevLeadDate = index === 0 ? null : new Date(arr[index - 1].createdAt).toLocaleDateString('en-GB');

                    if (leadDate !== prevLeadDate) {
                      acc.push(
                        <tr key={`date-${leadDate}`} style={{ background: 'rgba(56, 189, 248, 0.1)', borderBottom: '1px solid rgba(56, 189, 248, 0.3)' }}>
                          <td colSpan="6" style={{ padding: '0.6rem 1rem', color: '#38bdf8', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="checkbox" 
                              onChange={(e) => handleSelectDateGroup(e, leadDate)} 
                              style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                            />
                            📅 Leads from {leadDate}
                          </td>
                        </tr>
                      );
                    }

                    acc.push(
                      <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: selectedLeads.includes(lead.id) ? 'rgba(16, 185, 129, 0.1)' : lead.counselor === 'Unassigned' ? 'rgba(234, 179, 8, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedLeads.includes(lead.id)}
                            onChange={(e) => handleSelectLead(e, lead.id)}
                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                          />
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#ffffff' }}>
                          {lead.name}
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>{lead.city || 'Online'}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ color: '#52b788', fontWeight: '600' }}>{lead.phone}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{lead.email}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            background: (lead.source && lead.source.toLowerCase().includes('instagram')) ? 'rgba(228, 64, 95, 0.2)' : 'rgba(24, 119, 242, 0.2)',
                            color: (lead.source && lead.source.toLowerCase().includes('instagram')) ? '#f472b6' : '#60a5fa',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {lead.source || 'Facebook Lead Form'}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>{lead.batch || 'Meta Form'}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#e2e8f0', fontWeight: '500' }}>
                          {lead.targetCourse || lead.course}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <select
                            value={lead.counselor || 'Unassigned'}
                            onChange={(e) => {
                              const updatedLead = { ...lead, counselor: e.target.value };
                              setMetaRealLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
                              if (onAddLead) onAddLead(updatedLead);
                            }}
                            style={{
                              background: lead.counselor === 'Unassigned' ? '#d97706' : '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="Unassigned">🟡 Unassigned</option>
                            {counselors.map(c => (
                              <option key={c.id || c.name} value={c.name}>🟢 {c.name} ({c.role || 'Counselor'})</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                    return acc;
                  }, [])
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT WEBHOOK ACTIVITY STREAM */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Layers size={22} color="#38bdf8" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                Live Ingestion Activity Log
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Realtime Feed</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, overflowY: 'auto', maxHeight: '320px' }}>
            {testLog.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.platform === 'Facebook' ? (
                    <Facebook size={20} color="#1877F2" />
                  ) : (
                    <Instagram size={20} color="#E4405F" />
                  )}
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>
                      {item.leadName} <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#94a3b8' }}>({item.phone})</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#52b788', marginTop: '0.1rem' }}>
                      {item.course}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: '700',
                    display: 'inline-block'
                  }}>
                    Received
                  </span>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
