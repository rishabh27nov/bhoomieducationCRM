import React from 'react';
import { KPI_SUMMARY, INITIAL_LEADS, INITIAL_TASKS } from '../data/mockData';
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  DollarSign,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function Dashboard({
  setActiveTab,
  onSelectLead,
  leads = [],
  employees = [],
  tasks = []
}) {
  const displayLeads = leads;
  const displayTasks = tasks;
  const recentLeads = displayLeads.slice(0, 4);
  const pendingTasks = displayTasks.filter(t => !t.completed);

  const activeCounselingCount = displayLeads.filter(
    (l) => l.stage === 'Counseling' || l.stage === 'Demo Attended' || l.stage === 'Applied'
  ).length;
  const admittedCount = displayLeads.filter((l) => l.stage === 'Admitted').length;


  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Hero Welcome Banner */}
      <div style={{
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, #0c2017 0%, #143829 60%, #225740 100%)',
        color: '#ffffff',
        padding: '2rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(12, 32, 23, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Subtle Background Glow */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(82, 183, 136, 0.2) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: 'rgba(82,183,136,0.15)', border: '1px solid rgba(82,183,136,0.3)', color: '#74c69d', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Sparkles size={14} color="#fef08a" /> Lakshya NEET & JEE Coaching Academy
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Bridging Dreams and Destiny
          </h1>
          <p style={{ color: '#a7f3d0', fontSize: '0.95rem', maxWidth: '600px' }}>
            Welcome back! You have <strong>4 pending student follow-ups</strong> and <strong>18 new L-SAT scholarship test inquiries</strong> awaiting demo class allocation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setActiveTab('leads')}>
            View All Enquiries
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1 */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Student Enquiries</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {displayLeads.length}
              </div>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={14} /> Live Student Database
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Counseling & Demos</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {activeCounselingCount}
              </div>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
              <BookOpen size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            NEET & JEE Coaching Program
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Admissions Enrolled</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brand-emerald)', marginTop: '0.25rem' }}>
                {admittedCount}
              </div>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: '#dcfce7', color: '#15803d' }}>
              <Award size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
            Confirmed Paid Admissions
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Faculty & Staff Members</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {employees.length || 4}
              </div>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fef3c7', color: '#b45309' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>
            Active Staff IDs
          </div>
        </div>

      </div>

      {/* Main Content Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Section: Target Programs Breakdown & Recent Enquiries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Program Distribution */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Coaching Programs Enrolments</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student preference distribution for NEET & JEE 2026</p>
              </div>
              <button className="btn-icon" onClick={() => setActiveTab('analytics')}>
                <ChevronRight size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                const total = displayLeads.length || 1;
                const neetCount = displayLeads.filter(l => l.targetCourse && l.targetCourse.toLowerCase().includes('neet')).length;
                const jeeCount = displayLeads.filter(l => l.targetCourse && l.targetCourse.toLowerCase().includes('jee')).length;
                const foundationCount = displayLeads.filter(l => l.targetCourse && l.targetCourse.toLowerCase().includes('foundation')).length;
                const otherCount = displayLeads.length - (neetCount + jeeCount + foundationCount);

                const progs = [
                  { program: 'NEET Coaching Programs', count: neetCount, percent: displayLeads.length ? Math.round((neetCount / total) * 100) : 0, color: '#059669' },
                  { program: 'JEE Coaching Programs', count: jeeCount, percent: displayLeads.length ? Math.round((jeeCount / total) * 100) : 0, color: '#2563eb' },
                  { program: 'Foundation Batches', count: foundationCount, percent: displayLeads.length ? Math.round((foundationCount / total) * 100) : 0, color: '#d97706' },
                  { program: 'Other Coaching Courses', count: Math.max(0, otherCount), percent: displayLeads.length ? Math.round((Math.max(0, otherCount) / total) * 100) : 0, color: '#7c3aed' }
                ];

                return progs.map((prog, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <span>{prog.program}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{prog.count} Students ({prog.percent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${prog.percent}%`, height: '100%', backgroundColor: prog.color, borderRadius: '9999px' }}></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Recent Leads Table Preview */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Recent Student Enquiries</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Newly arrived prospective coaching leads</p>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setActiveTab('leads')}>
                View All Leads
              </button>
            </div>

            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Target Course</th>
                    <th>Stage</th>
                    <th>Assigned Counselor</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map(lead => (
                    <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => onSelectLead(lead)}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lead.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.phone} • {lead.email}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{lead.targetCourse}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.batch}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${lead.stage.toLowerCase().replace(/ /g, '')}`}>
                          <span className="badge-dot"></span>
                          {lead.stage}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{lead.counselor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Section: Counselor Reminders & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Action Tasks */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Today's Follow-ups</h3>
              <span className="badge badge-counseling">{pendingTasks.length} Pending</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {pendingTasks.map(task => (
                <div key={task.id} style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f8faf9',
                  border: '1px solid var(--border-light)',
                  borderLeft: task.priority === 'High' ? '4px solid #ef4444' : '4px solid #f59e0b'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={13} /> {task.dueTime}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-brand-emerald)' }}>
                      {task.student}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-soft"
              style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('tasks')}
            >
              Open Task Manager
            </button>
          </div>

          {/* Quick Counselor Notice */}
          <div style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #1b4332 0%, #081c15 100%)',
            color: '#ffffff'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74c69d', fontWeight: 700, marginBottom: '0.5rem' }}>
              Lakshya Announcement
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              L-SAT (Lakshya Scholarship Admission Test) Next Batch
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
              Scholarship test scheduled for Sunday at 10 AM. Up to 100% tuition fee waiver for top 10 rankers in NEET & JEE Advanced!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
