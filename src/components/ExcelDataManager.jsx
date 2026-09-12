import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Database, ExternalLink, GraduationCap, Mail, Phone, RefreshCw, Search, Users } from 'lucide-react';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1U9uXXvZ4_m5_peUSgKXu-KIPLWCnUXFFHv6u2TdBbdQ/edit?gid=0#gid=0';

export default function ExcelDataManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [query, setQuery] = useState('');

  const loadStudents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/excel-data?t=${Date.now()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load Excel data.');
      setStudents(data.students || []);
      setUpdatedAt(data.updatedAt || new Date().toISOString());
    } catch (requestError) {
      setError(requestError.message || 'Could not load Excel data.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
    const timer = window.setInterval(() => loadStudents(true), 60000);
    return () => window.clearInterval(timer);
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return students;
    return students.filter(student => [student.fullName, student.fatherName, student.email, student.phone, student.currentClass, student.exam]
      .some(value => String(value || '').toLowerCase().includes(normalizedQuery)));
  }, [students, query]);

  return <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1500px', margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Database color="#15803d" /> Excel Data</h1>
        <p style={{ color: '#64748b', margin: '0.45rem 0 0' }}>Live student registrations from your connected Google Sheet. Refreshes automatically every minute.</p>
      </div>
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        <a href={SHEET_URL} target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><ExternalLink size={17} /> Open Sheet</a>
        <button type="button" className="btn-primary" onClick={() => loadStudents()} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh now</button>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
      <StatCard icon={<Users size={21} />} label="Live Students" value={students.length} color="#15803d" />
      <StatCard icon={<GraduationCap size={21} />} label="NEET" value={students.filter(student => /neet/i.test(student.exam || '')).length} color="#2563eb" />
      <StatCard icon={<GraduationCap size={21} />} label="JEE" value={students.filter(student => /jee/i.test(student.exam || '')).length} color="#7c3aed" />
    </div>

    {error && <div style={{ background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}><AlertCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} /><div><strong>Excel data is not available yet.</strong><div style={{ marginTop: '0.25rem', fontSize: '0.88rem' }}>{error} Add the provided `action=students` block in Google Apps Script, deploy a new Web App version, then press Refresh.</div></div></div>}

    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, color: '#1e293b' }}>Student registrations <span style={{ color: '#64748b', fontWeight: 500 }}>({filteredStudents.length})</span></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.45rem 0.65rem', minWidth: '260px' }}><Search size={17} color="#64748b" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, phone, class..." style={{ border: 'none', outline: 'none', width: '100%' }} /></label>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1040px' }}>
          <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', fontSize: '0.76rem', textTransform: 'uppercase' }}>
            {['Student', 'Contact', 'Father / Guardian', 'Class', '10th %', 'Exam', 'Selected date', 'Registered'].map(header => <th key={header} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e2e8f0' }}>{header}</th>)}
          </tr></thead>
          <tbody>{filteredStudents.map((student, index) => <tr key={`${student.email || student.phone || student.fullName}-${index}`} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
            <td style={{ padding: '0.9rem 1rem', fontWeight: 800 }}>{student.fullName || '—'}</td>
            <td style={{ padding: '0.9rem 1rem', fontSize: '0.84rem' }}><div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', color: '#166534' }}><Phone size={13} />{student.phone || '—'}</div><div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginTop: '0.3rem', color: '#64748b' }}><Mail size={13} />{student.email || '—'}</div></td>
            <td style={{ padding: '0.9rem 1rem' }}>{student.fatherName || '—'}</td><td style={{ padding: '0.9rem 1rem' }}>{student.currentClass || '—'}</td><td style={{ padding: '0.9rem 1rem' }}>{student.class10Percentage || '—'}</td><td style={{ padding: '0.9rem 1rem' }}><span style={{ background: '#ecfdf5', color: '#166534', padding: '0.25rem 0.55rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.76rem' }}>{student.exam || '—'}</span></td><td style={{ padding: '0.9rem 1rem' }}>{student.selectedDate || '—'}</td><td style={{ padding: '0.9rem 1rem', fontSize: '0.82rem' }}>{student.createdAt || '—'}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!loading && !error && filteredStudents.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No student registrations found.</div>}
      {loading && <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading live Excel data…</div>}
      {updatedAt && <div style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', borderTop: '1px solid #f1f5f9' }}>Last synced: {new Date(updatedAt).toLocaleString('en-IN')}</div>}
    </div>
  </div>;
}

function StatCard({ icon, label, value, color }) {
  return <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}><div style={{ color, background: `${color}15`, padding: '0.65rem', borderRadius: '10px' }}>{icon}</div><div><div style={{ color: '#64748b', fontSize: '0.8rem' }}>{label}</div><div style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: 800 }}>{value}</div></div></div>;
}
