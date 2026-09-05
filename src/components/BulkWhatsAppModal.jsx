import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Send, AlertCircle, CheckCircle2, AlertTriangle, Phone } from 'lucide-react';

export default function BulkWhatsAppModal({ selectedLeads, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [useTemplate, setUseTemplate] = useState(true); // Default to true since it's the safest way to message first-time users

  const totalLeads = selectedLeads.length;

  // Simple delay function to prevent API rate limiting
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSendBulk = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !useTemplate) || totalLeads === 0) return;

    setIsSending(true);
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < selectedLeads.length; i++) {
      const lead = selectedLeads[i];
      try {
        const payload = useTemplate 
          ? { phone: lead.phone, isTemplate: true, templateName: 'lakshya_admission_enquiry', languageCode: 'en' }
          : { phone: lead.phone, message: message };

        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failedCount++;
          const errorData = await response.json();
          console.error(`Failed to send to ${lead.phone}:`, errorData);
          alert(`Failed to send to ${lead.phone}:\n${errorData.error || 'Unknown Error'}`);
        }
      } catch (err) {
        failedCount++;
        console.error(`Failed to send to ${lead.phone}`, err);
      }

      setResults({ success: successCount, failed: failedCount });
      setProgress(((i + 1) / totalLeads) * 100);
      
      // Wait 500ms between messages to avoid spamming the API
      await delay(500);
    }

    setIsSending(false);
    setIsFinished(true);
    if (onSuccess) onSuccess(successCount);
  };

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '550px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={24} color="#15803d" /> Send Bulk WhatsApp
          </h2>
          <button className="btn-icon" onClick={onClose} disabled={isSending}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #b7e4c7', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertCircle size={20} color="#15803d" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>
                Broadcasting to {totalLeads} selected {totalLeads === 1 ? 'student' : 'students'}.
              </div>
              <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '0.25rem' }}>
                Messages will be sent one by one with a small delay to prevent blocking. Do not close this window until finished.
              </div>
            </div>
          </div>

          {!isFinished ? (
            <form onSubmit={handleSendBulk}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <input 
                    type="checkbox" 
                    checked={useTemplate} 
                    onChange={(e) => {
                      setUseTemplate(e.target.checked);
                      if (e.target.checked) setMessage('');
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    Send Approved Template <span style={{ color: '#15803d' }}>(Required for new students)</span>
                  </span>
                </label>
                
                {useTemplate ? (
                  <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#475569', fontStyle: 'italic' }}>
                    Hello! 🎓<br/><br/>
                    Welcome to <b>Lakshya Education</b> - Bhoomi Connect!<br/><br/>
                    Thank you for your enquiry about our NEET/JEE coaching programs. Our counselor will get in touch with you shortly.<br/><br/>
                    For any queries, feel free to reply to this message or call us:<br/>
                    📞 +91 88002 15851<br/><br/>
                    Team Lakshya Education
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                      Custom Message (Only works if student messaged you first)
                    </label>
                    <textarea
                      className="form-input"
                      rows={5}
                      required={!useTemplate}
                      placeholder="Hello, we are starting a new batch..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={isSending}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                )}
              </div>

              {isSending && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    <span>Sending progress...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#15803d', transition: 'width 0.3s ease' }}></div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    <span style={{ color: '#15803d', fontWeight: 600 }}>✅ Sent: {results.success}</span>
                    {results.failed > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>❌ Failed: {results.failed}</span>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSending}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSending || (!useTemplate && !message.trim())}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#15803d' }}
                >
                  {isSending ? 'Sending...' : <><Send size={16} /> Send to {totalLeads}</>}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '60px', height: '60px', backgroundColor: '#f0fdf4', borderRadius: '50%', marginBottom: '1rem' }}>
                <CheckCircle2 size={32} color="#15803d" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Broadcast Complete!
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Successfully sent {results.success} messages. 
                {results.failed > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}> ({results.failed} failed)</span>}
              </p>
              <button className="btn btn-primary" onClick={onClose}>
                Close Window
              </button>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
