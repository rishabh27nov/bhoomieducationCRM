import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Phone, Key, HelpCircle } from 'lucide-react';

export default function WhatsAppSettingsManager({ currentUser, centralDb, saveToCentralDB }) {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    // Fetch from local server
    fetch('http://localhost:5000/api/data')
      .then(res => res.json())
      .then(data => {
        if (data && data.whatsappSettings) {
          setPhoneNumberId(data.whatsappSettings.phoneNumberId || '');
          setAccessToken(data.whatsappSettings.accessToken || '');
        }
      })
      .catch(err => console.error('Failed to fetch WhatsApp settings', err));
  }, []);

  const handleSave = async () => {
    if (currentUser?.role !== 'Admin') {
      alert('Only Administrators can modify WhatsApp settings.');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const updatedSettings = {
      phoneNumberId: phoneNumberId.trim(),
      accessToken: accessToken.trim(),
    };

    try {
      const response = await fetch('http://localhost:5000/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappSettings: updatedSettings })
      });
      
      if (!response.ok) throw new Error('Save failed');

      setSaveMessage({ type: 'success', text: 'WhatsApp API Credentials saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (currentUser?.role !== 'Admin') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Only Administrators can view and modify WhatsApp API settings.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          WhatsApp Cloud API Setup
        </h2>
        <p style={{ color: '#64748b' }}>
          Configure your official Meta WhatsApp Cloud API credentials to enable bulk messaging and chat automation.
        </p>
      </div>

      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #b7e4c7',
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start'
      }}>
        <AlertCircle color="#15803d" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ color: '#15803d', fontWeight: 700, marginBottom: '0.5rem' }}>How to get these credentials?</h4>
          <ol style={{ color: '#166534', margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Go to the <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Meta for Developers</a> portal.</li>
            <li>Create an App (Type: Business) and add the WhatsApp product.</li>
            <li>Navigate to <strong>WhatsApp &gt; API Setup</strong> in the left sidebar.</li>
            <li>Copy the <strong>Phone Number ID</strong> and the <strong>Temporary/Permanent Access Token</strong> and paste them below.</li>
          </ol>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Phone Number ID */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
            <Phone size={18} color="#64748b" /> Phone Number ID
          </label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="e.g. 102938475610293"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#52b788'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={14} /> Found in WhatsApp &gt; API Setup &gt; Step 1.
          </div>
        </div>

        {/* Access Token */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
            <Key size={18} color="#64748b" /> Access Token (Temporary or Permanent)
          </label>
          <textarea
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="EAAI..."
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'monospace',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#52b788'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            Make sure to use a System User Token for permanent access in production.
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
          
          <div>
            {saveMessage && (
              <span style={{ 
                color: saveMessage.type === 'success' ? '#15803d' : '#dc2626',
                fontWeight: 600,
                fontSize: '0.9rem',
                backgroundColor: saveMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                display: 'inline-block'
              }}>
                {saveMessage.type === 'success' ? '✅ ' : '❌ '}{saveMessage.text}
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !phoneNumberId || !accessToken}
            className="btn"
            style={{
              backgroundColor: '#15803d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: (isSaving || !phoneNumberId || !accessToken) ? 'not-allowed' : 'pointer',
              opacity: (isSaving || !phoneNumberId || !accessToken) ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(21, 128, 61, 0.2)'
            }}
          >
            {isSaving ? 'Saving...' : 'Save Credentials'}
          </button>
        </div>

      </div>
    </div>
  );
}
