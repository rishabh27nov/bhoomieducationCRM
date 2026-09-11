import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, RefreshCw, Search, User } from 'lucide-react';

const digits = (value) => String(value || '').replace(/\D/g, '').slice(-10);

export default function WhatsAppReplies({ leads = [], onOpenChat }) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadReplies = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/whatsapp/replies?t=${Date.now()}`);
      const data = await res.json();
      setReplies(res.ok && Array.isArray(data.replies) ? data.replies : []);
    } catch (error) {
      console.error('Failed to load WhatsApp replies', error);
    } finally {
      if (isInitialLoad) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReplies(true);
    const interval = setInterval(() => loadReplies(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const leadByPhone = useMemo(() => new Map(leads.map(lead => [digits(lead.phone), lead])), [leads]);
  const filteredReplies = replies.filter(reply => {
    const lead = leadByPhone.get(digits(reply.leadPhone));
    const searchable = `${reply.senderName || ''} ${reply.leadPhone || ''} ${reply.text || ''} ${lead?.name || ''}`.toLowerCase();
    return searchable.includes(search.toLowerCase());
  });
  const formatDate = (timestamp) => new Date(timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.55rem' }}><MessageCircle color="#15803d" /> WhatsApp Replies</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>All incoming student replies saved from the Meta WhatsApp webhook.</p>
        </div>
        <button type="button" className="btn btn-secondary" disabled={refreshing} onClick={() => loadReplies(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><RefreshCw size={16} /> {refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>

      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={18} color="#64748b" style={{ position: 'absolute', top: '11px', left: '12px' }} />
        <input className="form-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, phone or reply text..." style={{ paddingLeft: '2.5rem' }} />
      </div>

      {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading replies...</div> : filteredReplies.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#64748b' }}>No student replies saved yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredReplies.map(reply => {
            const lead = leadByPhone.get(digits(reply.leadPhone));
            return (
              <button key={reply.id} type="button" onClick={() => lead && onOpenChat(lead)} style={{ textAlign: 'left', width: '100%', cursor: lead ? 'pointer' : 'default', border: '1px solid #d1fae5', borderRadius: '10px', background: '#fff', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: '#dcfce7', color: '#15803d', display: 'grid', placeItems: 'center' }}><User size={19} /></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#0f172a' }}>{lead?.name || reply.senderName || 'Unknown student'}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatDate(reply.timestamp)}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.15rem' }}>{reply.leadPhone || 'No phone'}{lead ? ' · Click to open student chat' : ''}</div>
                  <div style={{ color: '#1e293b', marginTop: '0.55rem', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{reply.text || '[Media reply]'}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
