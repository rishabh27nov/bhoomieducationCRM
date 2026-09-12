import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Database, ExternalLink, GraduationCap, Mail, MessageCircle, Phone, RefreshCw, Search, Users } from 'lucide-react';
import BulkWhatsAppModal from './BulkWhatsAppModal';
import WhatsAppChatModal from './WhatsAppChatModal';

// Add future Google Sheet sources here. Each source remains separate by name and data is never merged silently.
const EXCEL_SOURCES = [{
  id: 'book_demo_class',
  name: 'Book Demo Class',
  description: 'Seminar and demo-class registrations',
  api: '/api/excel-data',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1U9uXXvZ4_m5_peUSgKXu-KIPLWCnUXFFHv6u2TdBbdQ/edit?gid=0#gid=0'
}];

const dateKey = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value || '').split(' ')[0] : parsed.toLocaleDateString('en-CA');
};

const studentId = (student, index) => `${student.email || student.phone || student.fullName || 'student'}-${student.createdAt || index}`;

export default function ExcelDataManager() {
  const [activeSourceId, setActiveSourceId] = useState(EXCEL_SOURCES[0].id);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [query, setQuery] = useState('');
  const [registeredDate, setRegisteredDate] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [chatStudent, setChatStudent] = useState(null);
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);

  const activeSource = EXCEL_SOURCES.find(source => source.id === activeSourceId) || EXCEL_SOURCES[0];

  const loadStudents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await fetch(`${activeSource.api}?t=${Date.now()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load Excel data.');
      setStudents(data.students || []);
      setUpdatedAt(data.updatedAt || new Date().toISOString());
    } catch (requestError) {
      setError(requestError.message || 'Could not load Excel data.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeSource.api]);

  useEffect(() => {
    setSelectedIds([]);
    setRegisteredDate('all');
    loadStudents();
    const timer = window.setInterval(() => loadStudents(true), 60000);
    return () => window.clearInterval(timer);
  }, [loadStudents, activeSourceId]);

  const registeredDates = useMemo(() => [...new Set(students.map(student => dateKey(student.createdAt)).filter(Boolean))]
    .sort((left, right) => new Date(right) - new Date(left)), [students]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return students.filter(student => {
      const matchesDate = registeredDate === 'all' || dateKey(student.createdAt) === registeredDate;
      const matchesQuery = !normalizedQuery || [student.fullName, student.fatherName, student.email, student.phone, student.currentClass, student.exam]
        .some(value => String(value || '').toLowerCase().includes(normalizedQuery));
      return matchesDate && matchesQuery;
    }).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }, [students, query, registeredDate]);

  const selectedStudents = filteredStudents.filter((student, index) => selectedIds.includes(studentId(student, index)));
  const toggleStudent = (student, index) => {
    const id = studentId(student, index);
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };
  const toggleAll = () => {
    const visibleIds = filteredStudents.map(studentId);
    setSelectedIds(current => visibleIds.every(id => current.includes(id)) ? current.filter(id => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])]);
  };
  const asLead = (student, index = 0) => ({ id: `EXCEL-${activeSourceId}-${studentId(student, index)}`, name: student.fullName || 'Student', phone: student.phone || '', email: student.email || '', source: activeSource.name });

  return <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1500px', margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
      <div><h1 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Database color="#15803d" /> Excel Data</h1><p style={{ color: '#64748b', margin: '0.45rem 0 0' }}>Live Excel registrations, arranged source-wise and date-wise. Refreshes automatically every minute.</p></div>
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}><a href={activeSource.sheetUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><ExternalLink size={17} /> Open Sheet</a><button type="button" className="btn-primary" onClick={() => loadStudents()} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh now</button></div>
    </div>

    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '13px', padding: '0.9rem', marginBottom: '1.25rem' }}>
      <div style={{ color: '#64748b', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>Excel Sources</div>
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>{EXCEL_SOURCES.map(source => <button key={source.id} type="button" onClick={() => setActiveSourceId(source.id)} style={{ textAlign: 'left', minWidth: '210px', border: source.id === activeSourceId ? '2px solid #15803d' : '1px solid #cbd5e1', background: source.id === activeSourceId ? '#ecfdf5' : '#fff', borderRadius: '10px', padding: '0.7rem 0.85rem', cursor: 'pointer' }}><div style={{ fontWeight: 800, color: '#14532d' }}>{source.name}</div><div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{source.description}</div></button>)}</div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}><StatCard icon={<Users size={21} />} label={`${activeSource.name} Students`} value={students.length} color="#15803d" /><StatCard icon={<GraduationCap size={21} />} label="NEET" value={students.filter(student => /neet/i.test(student.exam || '')).length} color="#2563eb" /><StatCard icon={<GraduationCap size={21} />} label="JEE" value={students.filter(student => /jee/i.test(student.exam || '')).length} color="#7c3aed" /></div>

    {error && <div style={{ background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}><AlertCircle size={20} /><div><strong>Excel data is not available yet.</strong><div style={{ marginTop: '0.25rem', fontSize: '0.88rem' }}>{error}</div></div></div>}

    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}><div><div style={{ fontWeight: 800, color: '#1e293b' }}>{activeSource.name} <span style={{ color: '#64748b', fontWeight: 500 }}>({filteredStudents.length})</span></div><div style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '0.18rem' }}>Latest registrations shown first</div></div><div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}><label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.45rem 0.55rem', color: '#475569' }}><CalendarDays size={16} /><select value={registeredDate} onChange={event => setRegisteredDate(event.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent' }}><option value="all">All registration dates</option>{registeredDates.map(date => <option key={date} value={date}>{date}</option>)}</select></label><label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.45rem 0.65rem', minWidth: '230px' }}><Search size={17} color="#64748b" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, phone, class..." style={{ border: 'none', outline: 'none', width: '100%' }} /></label></div></div>
      {selectedStudents.length > 0 && <div style={{ padding: '0.7rem 1rem', background: '#ecfdf5', borderBottom: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}><strong style={{ color: '#166534' }}>{selectedStudents.length} selected</strong><button type="button" className="btn-primary" onClick={() => setIsBulkWhatsAppOpen(true)} style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}><MessageCircle size={17} /> WhatsApp selected students</button></div>}
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1160px' }}><thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', fontSize: '0.76rem', textTransform: 'uppercase' }}><th style={{ padding: '0.85rem 0.7rem' }}><input type="checkbox" checked={filteredStudents.length > 0 && filteredStudents.every((student, index) => selectedIds.includes(studentId(student, index)))} onChange={toggleAll} title="Select all visible students" /></th>{['Student', 'Contact', 'Father / Guardian', 'Class', '10th %', 'Exam', 'Selected date', 'Registered', 'WhatsApp'].map(header => <th key={header} style={{ padding: '0.85rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>{header}</th>)}</tr></thead><tbody>{filteredStudents.map((student, index) => <tr key={studentId(student, index)} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}><td style={{ padding: '0.9rem 0.7rem' }}><input type="checkbox" checked={selectedIds.includes(studentId(student, index))} onChange={() => toggleStudent(student, index)} /></td><td style={{ padding: '0.9rem 0.75rem', fontWeight: 800 }}>{student.fullName || '-'}</td><td style={{ padding: '0.9rem 0.75rem', fontSize: '0.84rem' }}><div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', color: '#166534' }}><Phone size={13} />{student.phone || '-'}</div><div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginTop: '0.3rem', color: '#64748b' }}><Mail size={13} />{student.email || '-'}</div></td><td style={{ padding: '0.9rem 0.75rem' }}>{student.fatherName || '-'}</td><td style={{ padding: '0.9rem 0.75rem' }}>{student.currentClass || '-'}</td><td style={{ padding: '0.9rem 0.75rem' }}>{student.class10Percentage || '-'}</td><td style={{ padding: '0.9rem 0.75rem' }}><span style={{ background: '#ecfdf5', color: '#166534', padding: '0.25rem 0.55rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.76rem' }}>{student.exam || '-'}</span></td><td style={{ padding: '0.9rem 0.75rem' }}>{student.selectedDate || '-'}</td><td style={{ padding: '0.9rem 0.75rem', fontSize: '0.82rem' }}>{student.createdAt || '-'}</td><td style={{ padding: '0.9rem 0.75rem' }}><button type="button" onClick={() => setChatStudent(asLead(student, index))} disabled={!student.phone} title="Open WhatsApp chat" style={{ border: 'none', background: student.phone ? '#dcfce7' : '#f1f5f9', color: student.phone ? '#15803d' : '#94a3b8', borderRadius: '8px', padding: '0.42rem', cursor: student.phone ? 'pointer' : 'not-allowed', display: 'grid', placeItems: 'center' }}><MessageCircle size={18} /></button></td></tr>)}</tbody></table></div>
      {!loading && !error && filteredStudents.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No registrations found for this date or search.</div>}{loading && <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading live Excel data...</div>}{updatedAt && <div style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', borderTop: '1px solid #f1f5f9' }}>Last synced: {new Date(updatedAt).toLocaleString('en-IN')}</div>}
    </div>
    {chatStudent && <WhatsAppChatModal lead={chatStudent} onClose={() => setChatStudent(null)} />}
    {isBulkWhatsAppOpen && <BulkWhatsAppModal selectedLeads={selectedStudents.map(asLead)} onClose={() => setIsBulkWhatsAppOpen(false)} onSuccess={() => setSelectedIds([])} />}
  </div>;
}

function StatCard({ icon, label, value, color }) { return <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}><div style={{ color, background: `${color}15`, padding: '0.65rem', borderRadius: '10px' }}>{icon}</div><div><div style={{ color: '#64748b', fontSize: '0.8rem' }}>{label}</div><div style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: 800 }}>{value}</div></div></div>; }
