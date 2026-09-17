import { whatsappFetch } from '../utils/whatsappApi';
import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, User, Phone } from 'lucide-react';

export default function WhatsAppChat({ lead, expanded = false }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  useEffect(() => {
    let active = true;
    setMessages([]); setInputText(''); setError(''); setAccessDenied(false);
    const fetchMessages = async () => {
      try {
        const res = await whatsappFetch('/api/whatsapp/messages?phone=' + encodeURIComponent(lead.phone || ''));
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setMessages([]); setAccessDenied([401, 403].includes(res.status));
          throw new Error(data.error || 'Could not load messages.');
        }
        setAccessDenied(false); setMessages(data.messages || []); setError('');
      } catch (err) { if (active) setError(err.message); }
    };
    fetchMessages();
    whatsappFetch('/api/whatsapp/settings').then(res => res.json()).then(data => {
      if (active) setTemplates(Array.isArray(data.templates) ? data.templates : []);
    }).catch(() => {});
    const interval = setInterval(fetchMessages, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [lead.id, lead.phone]);

  const send = async (isTemplate = false) => {
    if (isLoading || accessDenied || (!isTemplate && !inputText.trim())) return;
    setIsLoading(true); setError('');
    const text = inputText.trim();
    try {
      const res = await whatsappFetch('/api/whatsapp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: lead.phone, message: text, isTemplate, templateName: template })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if ([401, 403].includes(res.status)) { setAccessDenied(true); setMessages([]); }
        throw new Error(data.error || 'Message could not be sent.');
      }
      if (data.skipped) setError(data.message);
      else if (data.message) setMessages(previous => [...previous.filter(message => message.id !== data.message.id), data.message]);
      if (!isTemplate) setInputText('');
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };
  const handleSendMessage = e => { e.preventDefault(); send(); };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: expanded ? 'min(65vh, 560px)' : '300px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      backgroundColor: '#efeae2', // WhatsApp default background color
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#075e54',
        color: 'white',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#128c7e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <User size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{lead.name}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={10} /> {lead.phone}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
        backgroundSize: 'contain'
      }}>
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <span style={{ backgroundColor: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
            This chat is connected via Official Meta WhatsApp API
          </span>
        </div>

        {messages.map(msg => (
          <div key={msg.id} style={{
            alignSelf: msg.direction === 'outgoing' ? 'flex-end' : 'flex-start',
            maxWidth: '75%',
            backgroundColor: msg.direction === 'outgoing' ? '#dcf8c6' : '#ffffff',
            padding: '6px 8px 8px 8px',
            borderRadius: '8px',
            boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '0.9rem', color: '#303030', wordWrap: 'break-word' }}>{msg.text}</span>
            <div style={{
              alignSelf: 'flex-end',
              fontSize: '0.65rem',
              color: '#999',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {formatTime(msg.timestamp)}
              {msg.direction === 'outgoing' && (
                <CheckCircle2 size={12} color={msg.status === 'read' ? '#34b7f1' : '#999'} />
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <div role="alert" style={{ padding: '0.6rem', color: '#b91c1c', background: '#fff1f2' }}>{error}</div>}
      {templates.length > 0 && <div style={{ padding: '0.6rem', background: '#f8fafc', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <select aria-label="WhatsApp template" value={template} onChange={e => setTemplate(e.target.value)} disabled={isLoading || accessDenied}>
          <option value="">Choose an approved template</option>
          {templates.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <button type="button" className="btn" disabled={!template || isLoading || accessDenied} onClick={() => send(true)}>Send template</button>
        <small style={{ width: '100%', color: '#64748b' }}>To start a conversation, send an approved template. Free-text replies depend on WhatsApp's messaging window.</small>
      </div>}
      {/* Input Area */}
      <form onSubmit={handleSendMessage} style={{
        display: 'flex',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        gap: '10px'
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a WhatsApp message..."
          style={{
            flex: 1,
            padding: '10px 15px',
            borderRadius: '20px',
            border: 'none',
            outline: 'none',
            fontSize: '0.9rem'
          }}
          disabled={isLoading || accessDenied}
        />
        <button
          type="submit"
          disabled={isLoading || accessDenied || !inputText.trim()}
          style={{
            backgroundColor: '#128c7e',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            opacity: inputText.trim() ? 1 : 0.5
          }}
        >
          <Send size={18} style={{ marginLeft: '3px' }} />
        </button>
      </form>
    </div>
  );
}
