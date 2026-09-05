import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, User, Phone } from 'lucide-react';

export default function WhatsAppChat({ lead }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load mock messages for now (or fetch from the new endpoint when ready)
  useEffect(() => {
    // In a real scenario, we would fetch from /api/whatsapp/messages?phone=lead.phone
    // For now, we seed with a mock history to show the UI
    setMessages([
      { id: 1, direction: 'incoming', text: 'Hi, I saw your ad on Facebook.', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, direction: 'outgoing', text: 'Hello! Welcome to Bhoomi Education. How can we help you?', timestamp: new Date(Date.now() - 3500000).toISOString(), status: 'read' },
    ]);
  }, [lead]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    
    // Optimistic UI update
    const newMsg = {
      id: Date.now(),
      direction: 'outgoing',
      text: inputText,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    try {
      // Post to our local server endpoint (which will forward to Meta)
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: lead.phone, message: newMsg.text })
      });
      // In real life, we would listen to webhooks for 'delivered' and 'read' receipts
    } catch (err) {
      console.error('Failed to send WhatsApp message', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '400px',
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
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
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
