import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Send, CheckCircle, Clock3, Trash2, AlertCircle, FileText } from 'lucide-react';
import { PIPELINE_STAGES } from '../data/mockData';
import CampaignReportsModal from './CampaignReportsModal';

export default function WhatsAppAutomationsManager({ currentUser, leads = [] }) {
  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sentTemplatesMap, setSentTemplatesMap] = useState({});
  const [showReports, setShowReports] = useState(false);
  
  const [formData, setFormData] = useState({
    template: '',
    stage: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [autoRes, setRes, stRes] = await Promise.all([
        fetch(`/api/whatsapp/automations?t=${Date.now()}`),
        fetch(`/api/whatsapp/settings?t=${Date.now()}`),
        fetch(`https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db/sentTemplates.json?t=${Date.now()}`)
      ]);
      
      const autoData = await autoRes.json();
      setAutomations(Array.isArray(autoData) ? autoData : []);
      const stData = await stRes.json();
      setSentTemplatesMap(stData && typeof stData === 'object' ? stData : {});

      const setData = await setRes.json();
      if (setData && setData.templates) {
        if (Array.isArray(setData.templates)) setTemplates(setData.templates);
        else setTemplates(setData.templates.split(',').map(t => t.trim()));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.template || !formData.stage || !formData.date || !formData.time) {
      alert("Please fill all fields.");
      return;
    }

    const scheduledTime = new Date(`${formData.date}T${formData.time}`).toISOString();
    if (new Date(scheduledTime).getTime() <= Date.now()) {
      alert("Scheduled time must be in the future.");
      return;
    }

    const newAutomation = {
      id: `AUTO-${Date.now()}`,
      template: formData.template,
      stage: formData.stage,
      scheduledTime,
      status: 'pending',
      createdBy: currentUser?.name || 'Admin',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/whatsapp/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAutomation)
      });
      if (res.ok) {
        setFormData({ template: '', stage: '', date: '', time: '' });
        fetchData();
      }
    } catch (err) {
      alert('Failed to schedule automation.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scheduled automation?")) return;
    try {
      const res = await fetch(`/api/whatsapp/automations?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            WhatsApp Automations
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Schedule template messages to be sent automatically to specific pipeline stages.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowReports(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#3b82f6', color: '#3b82f6' }}
        >
          <FileText size={16} /> View Campaign Reports
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Create Form */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--color-brand-primary)" /> Schedule New Message
          </h2>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>WhatsApp Template</label>
              <select 
                className="form-input" 
                value={formData.template} 
                onChange={e => setFormData({...formData, template: e.target.value})}
                required
              >
                <option value="">-- Select Approved Template --</option>
                {templates.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Target Pipeline Stage</label>
              <select 
                className="form-input" 
                value={formData.stage} 
                onChange={e => setFormData({...formData, stage: e.target.value})}
                required
              >
                <option value="">-- Select Stage --</option>
                {PIPELINE_STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              {formData.stage && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-emerald)', marginTop: '0.4rem', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '4px' }}>
                  {(() => {
                    const stageLeads = leads.filter(l => l.stage === formData.stage);
                    const eligibleLeads = stageLeads.filter(l => {
                      const sent = sentTemplatesMap[l.id] || [];
                      return !sent.includes(formData.template);
                    });
                    const alreadySent = stageLeads.length - eligibleLeads.length;
                    return `Target Audience: ${eligibleLeads.length} Students ${alreadySent > 0 ? `(${alreadySent} already sent)` : ''}`;
                  })()}
                </div>
              )}
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Message will be sent ONLY to leads who haven't received this template yet.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              <Clock3 size={16} /> Schedule Automation
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '6px' }}>
               <AlertCircle size={14} color="#3b82f6" />
               <span style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: 600 }}>Note: Requires CRM to be open in browser to trigger accurately.</span>
            </div>
          </form>
        </div>

        {/* Automations List */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} color="var(--color-brand-emerald)" /> Scheduled Automations
          </h2>

          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading...</div>
          ) : automations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              <Clock3 size={32} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 700, color: '#64748b' }}>No Automations Scheduled</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>Create a schedule using the form.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {automations.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(auto => {
                const isPending = auto.status === 'pending';
                const scheduledDate = new Date(auto.scheduledTime);
                const isPastDue = isPending && scheduledDate.getTime() <= Date.now();

                return (
                  <div key={auto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: isPending ? '#f8fafc' : '#f0fdf4' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{auto.template}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: isPending ? '#eff6ff' : '#dcfce3', color: isPending ? '#1d4ed8' : '#166534', border: isPending ? '1px solid #bfdbfe' : '1px solid #b7e4c7' }}>
                          {isPending ? 'PENDING' : 'COMPLETED'}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Target: <strong style={{ color: 'var(--color-brand-emerald)' }}>{auto.stage}</strong>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isPastDue ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <Clock size={12} /> 
                        {scheduledDate.toLocaleString()}
                        {isPastDue && " (Running Soon...)"}
                      </div>

                      {auto.stats && (
                        <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600 }}>
                          <span style={{ color: '#166534' }}>Executed: {auto.stats.success} Sent</span>,{' '}
                          <span style={{ color: auto.stats.failed > 0 ? '#ef4444' : '#166534' }}>{auto.stats.failed} Failed</span>{' '}
                          <span style={{ color: '#64748b' }}>(Total: {auto.stats.total})</span>
                          
                          {auto.stats.lastError && (
                             <div style={{ marginTop: '0.3rem', color: '#ef4444', fontSize: '0.65rem', backgroundColor: '#fef2f2', padding: '0.3rem', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                               Error: {auto.stats.lastError}
                             </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handleDelete(auto.id)}
                      className="btn-icon" 
                      style={{ color: '#ef4444', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)' }}
                      title="Delete Automation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showReports && (
        <CampaignReportsModal onClose={() => setShowReports(false)} />
      )}
    </div>
  );
}
