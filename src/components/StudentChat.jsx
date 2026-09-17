import React, { useEffect, useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { whatsappFetch } from '../utils/whatsappApi';
import WhatsAppChat from './WhatsAppChat';
import { matchesStudentSearch, readWhatsAppResponse } from '../utils/studentSearch';

export default function StudentChat() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await whatsappFetch('/api/whatsapp/students');
        const data = await readWhatsAppResponse(response);
        if (!Array.isArray(data.students)) throw new Error('Could not load students. Please retry.');
        if (active) { setStudents(data.students); setError(''); }
      } catch (err) {
        if (active) { setStudents([]); setError(err.message); }
      } finally { if (active) setLoading(false); }
    };
    load();
    const timer = setInterval(load, 5000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  const selected = students.find(student => student.id === selectedId);
  const filtered = students.filter(student => matchesStudentSearch(student, search));
  return <div style={{ padding: '1.5rem' }}>
    <h2 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><MessageCircle /> Student Chat</h2>
    <p style={{ color: '#64748b', margin: '0.5rem 0 1rem' }}>WhatsApp conversations with your allotted students.</p>
    {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'stretch' }}>
      <aside style={{ flex: '1 1 260px', maxWidth: '360px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={18} /><input aria-label="Search allotted students" className="form-input" placeholder="Search name or phone" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <div style={{ maxHeight: '65vh', overflowY: 'auto', marginTop: '1rem' }}>
          {loading ? <p>Loading students...</p> : error ? <p style={{ color: '#64748b' }}>Student list could not be loaded. Retrying automatically...</p> : !filtered.length && <p style={{ color: '#64748b' }}>{search ? 'No matching students.' : 'No allotted students with an available WhatsApp number. Ask your admin to check the allocation.'}</p>}
          {filtered.map(student => <button key={student.id} onClick={() => setSelectedId(student.id)} style={{ display: 'block', width: '100%', padding: '0.85rem', textAlign: 'left', border: 'none', borderBottom: '1px solid #e2e8f0', background: selectedId === student.id ? '#dcfce7' : '#fff', cursor: 'pointer' }}>
            <strong>{student.name}</strong><div style={{ color: '#64748b', marginTop: '4px' }}>{student.phone}</div>
          </button>)}
        </div>
      </aside>
      <section style={{ flex: '3 1 350px', minWidth: 0 }}>
        {selected ? <WhatsAppChat key={`${selected.id}:${selected.phone}`} lead={selected} expanded /> : <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>Select a student to view messages and send a WhatsApp reply.</div>}
      </section>
    </div>
  </div>;
}
