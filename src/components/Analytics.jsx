import React from 'react';
import { COUNSELORS, KPI_SUMMARY, isCounselorMatch } from '../data/mockData';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  Award,
  Users,
  Calendar
} from 'lucide-react';

export default function Analytics({ employees = [], leads = [] }) {
  // Compute performance for each employee dynamically (with flexible counselor matching)
  const staffMetrics = employees.map((counselor) => {
    const assignedLeads = leads.filter(
      (l) => isCounselorMatch(l.counselor, counselor.name)
    );
    const convertedCount = assignedLeads.filter(
      (l) => l.stage === 'Fee Paid & Enrolled' || l.stage === 'Admitted' || l.stage === 'Enrolled'
    ).length;
    const activeCount = assignedLeads.length;

    const convRate = activeCount > 0 ? `${Math.round((convertedCount / activeCount) * 100)}%` : '0%';


    return {
      ...counselor,
      calculatedActive: activeCount,
      calculatedConversion: convRate
    };
  });


  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            NEET & JEE Admissions Analytics
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Faculty performance metrics, lead conversion ratios, and program enrolment trends
          </p>
        </div>
      </div>

      {/* Counselor Performance Cards */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
          Counselor & Faculty Conversion Performance ({staffMetrics.length} Team Members)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {staffMetrics.map((counselor) => (
            <div key={counselor.id} style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8faf9',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={counselor.avatar} alt={counselor.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-brand-emerald)' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{counselor.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role: {counselor.role}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span>Active Leads: <strong>{counselor.calculatedActive}</strong></span>
                <span style={{ color: 'var(--color-brand-emerald)', fontWeight: 700 }}>Conversion: {counselor.calculatedConversion}</span>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Lead Acquisition Channels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Coaching Lead Acquisition Channels</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { source: 'School Seminars & Walk-ins', count: '92 Leads (37%)', percent: 37, color: '#10b981' },
              { source: 'Newspaper Advertisements & Banners', count: '60 Leads (24%)', percent: 24, color: '#3b82f6' },
              { source: 'Google & Website Demo Requests', count: '52 Leads (21%)', percent: 21, color: '#8b5cf6' },
              { source: 'Student & Alumni Referrals', count: '44 Leads (18%)', percent: 18, color: '#f59e0b' },
            ].map((channel, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  <span>{channel.source}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{channel.count}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${channel.percent}%`, height: '100%', backgroundColor: channel.color, borderRadius: '9999px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Session Admission Target</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Target vs Enrolled Students for Session 2026-2027</p>

            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-brand-primary)' }}>
                92%
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-brand-emerald)' }}>
                132 of 150 Target Admissions Enrolled
              </div>
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#f8faf9', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Batch admissions running full. L-SAT Scholarship batch filling rapidly.
          </div>
        </div>

      </div>

    </div>
  );
}
