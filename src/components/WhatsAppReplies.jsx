import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, RefreshCw, Search, Trash2, User } from 'lucide-react';

const digits = (value) => String(value || '').replace(/\D/g, '').slice(-10);

export default function WhatsAppReplies({ leads = [], onOpenChat }) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingPhone, setDeletingPhone] = useState('');

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
  const conversations = useMemo(() => {
    const grouped = new Map();
    replies.forEach(reply => {
      const phoneKey = digits(reply.leadPhone) || reply.id;
      const existing = grouped.get(phoneKey);
      const lead = leadByPhone.get(phoneKey);
      if (!existing) {
        grouped.set(phoneKey, {
          phoneKey,
          lead,
          contact: lead || { id: `whatsapp-${phoneKey}`, name: reply.senderName || 'WhatsApp contact', phone: reply.leadPhone },
          latest: reply,
          replyCount: 1,
          unreadCount: reply.readAt ? 0 : 1,
          searchText: `${reply.senderName || ''} ${reply.leadPhone || ''} ${reply.text || ''} ${lead?.name || ''}`.toLowerCase()
        });
        return;
      }
      existing.replyCount += 1;
      if (!reply.readAt) existing.unreadCount += 1;
      existing.searchText += ` ${reply.text || ''}`.toLowerCase();
      if (new Date(reply.timestamp).getTime() > new Date(existing.latest.timestamp).getTime()) existing.latest = reply;
    });
    return [...grouped.values()]
      .filter(conversation => conversation.searchText.includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.latest.timestamp) - new Date(a.latest.timestamp));
  }, [replies, leadByPhone, search]);

  const formatDate = (timestamp) => new Date(timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const openConversation = (conversation) => {
    onOpenChat(conversation.contact);
    if (!conversation.unreadCount) return;
    const readAt = new Date().toISOString();
    setReplies(current => current.map(reply => digits(reply.leadPhone) === conversation.phoneKey && !reply.readAt ? { ...reply, readAt } : reply));
    fetch('/api/whatsapp/replies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: conversation.contact.phone || conversation.latest.leadPhone })
    }).catch(error => console.error('Failed to mark WhatsApp replies as read', error));
  };

  const deleteConversation = async (conversation) => {
    const contactName = conversation.lead?.name || conversation.latest.senderName || 'this student';
    const confirmed = window.confirm(`Delete the saved CRM chat with ${contactName}? This removes ${conversation.replyCount} saved message(s) from Firebase. It cannot delete messages from the student's actual WhatsApp.`);
    if (!confirmed) return;
    setDeletingPhone(conversation.phoneKey);
    try {
      const response = await fetch('/api/whatsapp/replies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: conversation.contact.phone || conversation.latest.leadPhone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete the chat.');
      setReplies(current => current.filter(reply => digits(reply.leadPhone) !== conversation.phoneKey));
    } catch (error) {
      alert(error.message || 'Could not delete the chat.');
    } finally {
      setDeletingPhone('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.55rem' }}><MessageCircle color="#15803d" /> WhatsApp Replies</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>One conversation per student. Open a row to see every message and reply.</p>
        </div>
        <button type="button" className="btn btn-secondary" disabled={refreshing} onClick={() => loadReplies(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><RefreshCw size={16} /> {refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>

      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={18} color="#64748b" style={{ position: 'absolute', top: '11px', left: '12px' }} />
        <input className="form-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, phone or reply text..." style={{ paddingLeft: '2.5rem' }} />
      </div>

      {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading replies...</div> : conversations.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#64748b' }}>No student replies saved yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {conversations.map(conversation => {
            const { latest, lead, replyCount, unreadCount } = conversation;
            return (
              <div key={conversation.phoneKey} role="button" tabIndex={0} onClick={() => openConversation(conversation)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openConversation(conversation); }} style={{ textAlign: 'left', width: '100%', cursor: 'pointer', border: '1px solid #d1fae5', borderRadius: '10px', background: '#fff', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: '#dcfce7', color: '#15803d', display: 'grid', placeItems: 'center' }}><User size={19} /></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#0f172a' }}>{lead?.name || latest.senderName || 'WhatsApp contact'}</strong>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatDate(latest.timestamp)}</span><button type="button" onClick={(event) => { event.stopPropagation(); deleteConversation(conversation); }} disabled={deletingPhone === conversation.phoneKey} title="Delete saved CRM chat" style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: '7px', padding: '0.35rem', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Trash2 size={15} /></button></div>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.15rem' }}>{latest.leadPhone || 'No phone'} · Click to open chat</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginTop: '0.55rem' }}>
                    <div style={{ color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.45 }}>{latest.text || '[Media reply]'}</div>
                    <span style={{ color: '#64748b', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{replyCount} message{replyCount === 1 ? '' : 's'}</span>
                    {unreadCount > 0 && <span title={`${unreadCount} unread replies`} style={{ flexShrink: 0, minWidth: '24px', height: '24px', padding: '0 0.45rem', borderRadius: '999px', background: '#15803d', color: '#fff', fontSize: '0.75rem', fontWeight: 800, display: 'grid', placeItems: 'center' }}>{unreadCount}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
