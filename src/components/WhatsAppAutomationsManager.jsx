import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Send, CheckCircle, Clock3, Trash2, AlertCircle, FileText, Plus, ListTree } from 'lucide-react';
import { PIPELINE_STAGES } from '../data/mockData';
import CampaignReportsModal from './CampaignReportsModal';

export default function WhatsAppAutomationsManager({ currentUser, leads = [] }) {
  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sentTemplatesMap, setSentTemplatesMap] = useState({});
  const [showReports, setShowReports] = useState(false);
  
  const [cycleData, setCycleData] = useState({
    name: '',
    stage: '',
    messages: [
      { id: Date.now(), template: '', date: '', time: '' }
    ]
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

  const handleAddMessage = () => {
    setCycleData({
      ...cycleData,
      messages: [...cycleData.messages, { id: Date.now(), template: '', date: '', time: '' }]
    });
  };

  const handleMessageChange = (id, field, value) => {
    setCycleData({
      ...cycleData,
      messages: cycleData.messages.map(msg => msg.id === id ? { ...msg, [field]: value } : msg)
    });
  };

  const handleRemoveMessage = (id) => {
    setCycleData({
      ...cycleData,
      messages: cycleData.messages.filter(msg => msg.id !== id)
    });
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    if (!cycleData.name || !cycleData.stage) {
      alert("Please fill in Cycle Name and Target Stage.");
      return;
    }

    if (cycleData.messages.length === 0) {
      alert("Please add at least one template to the cycle.");
      return;
    }

    const cycleId = `CYCLE-${Date.now()}`;
    const newAutomations = [];

    for (let i = 0; i < cycleData.messages.length; i++) {
      const msg = cycleData.messages[i];
      if (!msg.template || !msg.date || !msg.time) {
        alert(`Please fill all fields for Message ${i + 1}.`);
        return;
      }
      
      const scheduledTime = new Date(`${msg.date}T${msg.time}`).toISOString();
      if (new Date(scheduledTime).getTime() <= Date.now()) {
        alert(`Scheduled time for Message ${i + 1} must be in the future.`);
        return;
      }

      newAutomations.push({
        id: `AUTO-${Date.now()}-${i}`,
        cycleId,
        cycleName: cycleData.name,
        template: msg.template,
        stage: cycleData.stage,
        scheduledTime,
        status: 'pending',
        createdBy: currentUser?.name || 'Admin',
        createdAt: new Date().toISOString()
      });
    }

    try {
      const res = await fetch('/api/whatsapp/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAutomations)
      });
      if (res.ok) {
        setCycleData({
          name: '',
          stage: '',
          messages: [{ id: Date.now(), template: '', date: '', time: '' }]
        });
        fetchData();
      }
    } catch (err) {
      alert('Failed to schedule cycle.');
    }
  };

  const handleDeleteCycle = async (cycleId) => {
    if (!window.confirm("Delete this entire Sequence Cycle? All scheduled messages inside it will be cancelled.")) return;
    try {
      const res = await fetch(`/api/whatsapp/automations?cycleId=${cycleId}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Failed to delete cycle.');
    }
  };

  const handleDeleteSingle = async (id) => {
    if (!window.confirm("Delete this single automation?")) return;
    try {
      const res = await fetch(`/api/whatsapp/automations?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  // Group automations by cycleId
  const groupedAutomations = {};
  const standaloneAutomations = [];

  automations.forEach(auto => {
    if (auto.cycleId) {
      if (!groupedAutomations[auto.cycleId]) {
        groupedAutomations[auto.cycleId] = {
          cycleId: auto.cycleId,
          cycleName: auto.cycleName,
          stage: auto.stage,
          createdAt: auto.createdAt,
          messages: []
        };
      }
      groupedAutomations[auto.cycleId].messages.push(auto);
    } else {
      standaloneAutomations.push(auto);
    }
  });

  const sortedCycles = Object.values(groupedAutomations).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            WhatsApp Campaign Cycles
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Create automated message sequences (drip campaigns) for specific pipeline stages.
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

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Create Cycle Form */}
        <div style={{ flex: '1 1 400px', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListTree size={18} color="var(--color-brand-primary)" /> Create New Cycle
          </h2>
          
          <form onSubmit={handleCreateCycle} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Cycle Name</label>
                <input 
                  type="text"
                  className="form-input" 
                  placeholder="e.g. 7-Day Challenge Sequence"
                  value={cycleData.name}
                  onChange={e => setCycleData({...cycleData, name: e.target.value})}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Target Pipeline Stage</label>
                <select 
                  className="form-input" 
                  value={cycleData.stage} 
                  onChange={e => setCycleData({...cycleData, stage: e.target.value})}
                  required
                >
                  <option value="">-- Select Stage --</option>
                  {PIPELINE_STAGES.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {cycleData.stage && (
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-emerald)', backgroundColor: '#ecfdf5', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                Target Audience: {leads.filter(l => l.stage === cycleData.stage).length} total leads currently in {cycleData.stage}
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '1rem' }}>Messages in Cycle</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cycleData.messages.map((msg, index) => (
                  <div key={msg.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Step {index + 1}</span>
                      {cycleData.messages.length > 1 && (
                        <button type="button" onClick={() => handleRemoveMessage(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <select 
                          className="form-input" 
                          value={msg.template} 
                          onChange={e => handleMessageChange(msg.id, 'template', e.target.value)}
                          required
                          style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                        >
                          <option value="">-- Select Template --</option>
                          {templates.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={msg.date}
                            onChange={e => handleMessageChange(msg.id, 'date', e.target.value)}
                            required
                            style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="time" 
                            className="form-input" 
                            value={msg.time}
                            onChange={e => handleMessageChange(msg.id, 'time', e.target.value)}
                            required
                            style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={handleAddMessage}
                style={{ 
                  marginTop: '1rem', width: '100%', padding: '0.5rem', 
                  backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '6px', 
                  color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                }}
              >
                <Plus size={16} /> Add Another Template
              </button>

            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              <CheckCircle size={16} /> Save Cycle
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '6px' }}>
               <AlertCircle size={14} color="#3b82f6" />
               <span style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: 600 }}>Note: Requires CRM to be open in browser to trigger accurately.</span>
            </div>
          </form>
        </div>

        {/* Cycles List */}
        <div style={{ flex: '2 1 600px', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} color="var(--color-brand-emerald)" /> Active Cycles & Automations
          </h2>

          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading...</div>
          ) : (automations.length === 0) ? (
            <div style={{ padding: '3rem', textAlign: 'center', border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              <ListTree size={32} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 700, color: '#64748b' }}>No Cycles Scheduled</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>Create a new sequence using the form.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {sortedCycles.map(cycle => (
                <div key={cycle.cycleId} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{cycle.cycleName}</h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Target: <strong>{cycle.stage}</strong></div>
                    </div>
                    <button 
                      onClick={() => handleDeleteCycle(cycle.cycleId)}
                      className="btn-icon" 
                      style={{ color: '#ef4444', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}
                      title="Delete Entire Cycle"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {cycle.messages.sort((a,b) => new Date(a.scheduledTime) - new Date(b.scheduledTime)).map((msg, idx) => {
                      const isPending = msg.status === 'pending';
                      const scheduledDate = new Date(msg.scheduledTime);
                      const isPastDue = isPending && scheduledDate.getTime() <= Date.now();

                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: isPending ? '#fff' : '#f0fdf4', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Step {idx + 1}</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{msg.template}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isPastDue ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                              <Clock size={12} /> {scheduledDate.toLocaleString()}
                              {isPastDue && " (Running Soon...)"}
                            </div>
                            {msg.stats && (
                              <div style={{ fontSize: '0.7rem', marginTop: '0.2rem', color: '#64748b' }}>
                                Executed: {msg.stats.success} Sent, {msg.stats.failed} Failed
                              </div>
                            )}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: isPending ? '#eff6ff' : '#dcfce3', color: isPending ? '#1d4ed8' : '#166534', border: isPending ? '1px solid #bfdbfe' : '1px solid #b7e4c7' }}>
                              {isPending ? 'PENDING' : 'COMPLETED'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {standaloneAutomations.length > 0 && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.9rem', color: '#64748b' }}>
                    Legacy Automations (Without Cycle)
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {standaloneAutomations.map(auto => {
                      const isPending = auto.status === 'pending';
                      const scheduledDate = new Date(auto.scheduledTime);
                      const isPastDue = isPending && scheduledDate.getTime() <= Date.now();
                      return (
                        <div key={auto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{auto.template} <span style={{fontSize: '0.7rem', color: '#94a3b8'}}>({auto.stage})</span></div>
                            <div style={{ fontSize: '0.75rem', color: isPastDue ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                              <Clock size={12} /> {scheduledDate.toLocaleString()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: isPending ? '#eff6ff' : '#dcfce3', color: isPending ? '#1d4ed8' : '#166534' }}>
                              {isPending ? 'PENDING' : 'COMPLETED'}
                            </span>
                            <button onClick={() => handleDeleteSingle(auto.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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
