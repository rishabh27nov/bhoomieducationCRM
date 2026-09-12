import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, Users, Download, FileText, Loader2, Bell } from 'lucide-react';
import { db as firebaseDB, storage, ref, onValue, update, storageRef, uploadBytes, getDownloadURL } from '../firebase';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function EmployeeChat({ currentUser, employees = [], onSharedDocument, unreadCount = 0, onMarkRead }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const chatRef = ref(firebaseDB, 'lakshya_crm_central_db/employeeChatMessages');
    return onValue(chatRef, snapshot => {
      const data = snapshot.val();
      setMessages(Object.values(data || {}).filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (unreadCount > 0) onMarkRead?.();
  }, [unreadCount, onMarkRead]);

  const enableBrowserAlerts = async () => {
    if (!('Notification' in window)) return alert('Browser notifications are not supported on this device.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') alert('Notifications were not enabled. Please allow them from your browser settings.');
  };

  const getMentionedEmployees = (messageText) => employees
    .filter(employee => messageText.toLowerCase().includes(`@${String(employee.name || '').toLowerCase()}`))
    .map(employee => ({ id: employee.id, name: employee.name }));

  const saveMessage = async ({ messageText = '', attachment = null }) => {
    const id = `EMP-CHAT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const message = {
      id,
      senderId: currentUser?.id || currentUser?.email || 'employee',
      senderName: currentUser?.name || 'Employee',
      senderRole: currentUser?.role || 'Employee',
      text: messageText.trim(),
      mentions: getMentionedEmployees(messageText),
      attachment,
      timestamp: new Date().toISOString()
    };
    await update(ref(firebaseDB, 'lakshya_crm_central_db/employeeChatMessages'), { [id]: message });
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    const messageText = text;
    setText('');
    try {
      await saveMessage({ messageText });
    } catch (error) {
      setText(messageText);
      alert('Message could not be saved. Please try again.');
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('Maximum file size is 25 MB.');
      return;
    }
    setUploading(true);
    try {
      const storagePath = `employee-chat/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const uploaded = await uploadBytes(storageRef(storage, storagePath), file);
      const fileUrl = await getDownloadURL(uploaded.ref);
      const attachment = { name: file.name, fileUrl, size: file.size, type: file.type || 'file' };
      await saveMessage({ attachment });
      onSharedDocument?.({
        id: `DOC-CHAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `Chat file: ${file.name}`,
        fileName: file.name,
        category: 'Other',
        uploadedBy: currentUser?.name || 'Employee',
        uploadDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.name.split('.').pop()?.toLowerCase() || 'file',
        status: 'Shared in Employee Chat',
        fileUrl,
        sharedInChat: true
      });
    } catch (error) {
      console.error('Employee chat file upload failed', error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const mentionMatch = text.match(/(^|\s)@([^\s@]*)$/);
  const mentionQuery = mentionMatch?.[2]?.toLowerCase() || '';
  const mentionCandidates = mentionMatch
    ? employees.filter(employee => String(employee.name || '').toLowerCase().includes(mentionQuery)).slice(0, 6)
    : [];
  const insertMention = (employee) => {
    setText(current => current.replace(/(^|\s)@[^\s@]*$/, `$1@${employee.name} `));
    requestAnimationFrame(() => messageInputRef.current?.focus());
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', height: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.55rem' }}><Users color="#15803d" /> Employee Chat</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>Internal team chat. Shared files also appear in Document Upload Hub.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
          <button type="button" onClick={enableBrowserAlerts} title="Enable desktop chat notifications" style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', borderRadius: '999px', padding: '0.4rem 0.65rem', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', gap: '0.3rem', alignItems: 'center' }}><Bell size={14} /> Alerts</button>
          <span style={{ background: '#dcfce7', color: '#166534', borderRadius: '999px', padding: '0.4rem 0.75rem', fontWeight: 700, fontSize: '0.78rem' }}>{employees.length} team members</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, background: '#efeae2', border: '1px solid #d1d5db', borderRadius: '14px', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {messages.length === 0 && <div style={{ margin: 'auto', color: '#64748b', textAlign: 'center' }}>No team messages yet. Start the conversation.</div>}
        {messages.map(message => {
          const isMine = String(message.senderId) === String(currentUser?.id || currentUser?.email || 'employee');
          return <div key={message.id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%', background: isMine ? '#dcf8c6' : '#fff', borderRadius: '10px', padding: '0.65rem 0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
            {!isMine && <div style={{ color: '#075e54', fontWeight: 800, fontSize: '0.78rem', marginBottom: '0.3rem' }}>{message.senderName} <span style={{ color: '#64748b', fontWeight: 500 }}>· {message.senderRole}</span></div>}
            {message.text && <div style={{ color: '#1f2937', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{message.text}</div>}
            {message.mentions?.length > 0 && <div style={{ marginTop: '0.35rem', color: '#075e54', fontSize: '0.72rem', fontWeight: 800 }}>{message.mentions.map(mention => `@${mention.name}`).join(' ')}</div>}
            {message.attachment && <a href={message.attachment.fileUrl} target="_blank" rel="noreferrer" style={{ marginTop: message.text ? '0.55rem' : 0, display: 'flex', alignItems: 'center', gap: '0.45rem', textDecoration: 'none', color: '#075e54', background: 'rgba(255,255,255,0.7)', padding: '0.5rem', borderRadius: '7px', fontWeight: 700, fontSize: '0.82rem' }}><FileText size={17} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{message.attachment.name}</span> <Download size={15} /></a>}
            <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.65rem', marginTop: '0.3rem' }}>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>;
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ position: 'relative', display: 'flex', gap: '0.65rem', alignItems: 'center', background: '#fff', border: '1px solid #d1d5db', padding: '0.7rem', borderRadius: '12px' }}>
        {mentionCandidates.length > 0 && <div style={{ position: 'absolute', left: '3rem', bottom: 'calc(100% + 0.5rem)', width: '300px', maxHeight: '220px', overflowY: 'auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 12px 28px rgba(15,23,42,0.18)', zIndex: 3, padding: '0.35rem' }}>
          {mentionCandidates.map(employee => <button key={employee.id || employee.name} type="button" onClick={() => insertMention(employee)} style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: '0.6rem 0.7rem', borderRadius: '7px', color: '#1e293b', fontWeight: 700 }}><span style={{ color: '#15803d' }}>@</span>{employee.name} <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>· {employee.role || 'Employee'}</span></button>)}
        </div>}
        <input ref={fileInputRef} type="file" onChange={handleFile} style={{ display: 'none' }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Share file (max 25 MB)" style={{ border: 'none', background: 'transparent', color: '#15803d', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '0.4rem' }}>{uploading ? <Loader2 size={21} className="animate-spin" /> : <Paperclip size={21} />}</button>
        <input ref={messageInputRef} className="form-input" value={text} onChange={event => setText(event.target.value)} placeholder="Write a message to your team... Use @ to tag someone" style={{ flex: 1, border: 'none', boxShadow: 'none' }} />
        <button type="submit" disabled={!text.trim() || uploading} title="Send message" style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#15803d', color: '#fff', cursor: text.trim() ? 'pointer' : 'not-allowed', display: 'grid', placeItems: 'center' }}><Send size={18} /></button>
      </form>
    </div>
  );
}
