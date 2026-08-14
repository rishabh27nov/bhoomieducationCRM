import React, { useState } from 'react';
import {
  Users,
  CheckSquare,
  Clock,
  Activity,
  Plus,
  Sparkles,
  TrendingUp,
  FileText,
  CheckCircle2,
  Calendar
} from 'lucide-react';

import { isCounselorMatch } from '../data/mockData';

export default function EmployeeDashboard({
  currentUser,
  leads = [],
  tasks = [],
  activityLogs = [],
  onUpdateLeadStage,
  onAddNote,
  onOpenAddLead
}) {
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [newStageInput, setNewStageInput] = useState('Counseling Scheduled');
  const [noteInput, setNoteInput] = useState('');

  // Filter items specifically assigned to this logged-in employee (with flexible name matching)
  const myLeads = leads.filter(
    (l) => isCounselorMatch(l.counselor, currentUser?.name)
  );

  const myTasks = tasks.filter(
    (t) => isCounselorMatch(t.counselor, currentUser?.name)
  );

  const myActivities = activityLogs.filter(
    (a) => isCounselorMatch(a.employeeName, currentUser?.name)
  );

  const enrolledCount = myLeads.filter((l) => l.stage === 'Fee Paid & Enrolled' || l.stage === 'Admitted' || l.stage === 'Enrolled').length;
  const conversionRate = myLeads.length > 0 ? Math.round((enrolledCount / myLeads.length) * 100) : 0;


  const handleQuickUpdate = (e) => {
    e.preventDefault();
    if (!selectedLeadId) return;

    if (newStageInput) {
      onUpdateLeadStage(selectedLeadId, newStageInput);
    }
    if (noteInput.trim()) {
      onAddNote(selectedLeadId, noteInput.trim());
    }

    setNoteInput('');
    alert('Sheet update saved successfully into your profile history!');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #0c2017 0%, #1b4332 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #52b788' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Welcome, {currentUser?.name}!</h1>
              <span
                style={{
                  backgroundColor: currentUser?.role === 'Manager' ? '#f59e0b' : '#3b82f6',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px'
                }}
              >
                {currentUser?.role || 'Employee'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#b7e4c7', marginTop: '4px' }}>
              Here is your personal student counseling desk, sheet status updates, and task reminders.
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#b7e4c7',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          🔒 Lead Creation Power: Admin Only
        </div>
      </div>


      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>My Active Leads</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-brand-emerald)', marginTop: '0.25rem' }}>
            {myLeads.length} Students
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Admissions Enrolled</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            {enrolledCount} Enrolled
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>My Conversion Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>
            {conversionRate}%
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pending Tasks</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
            {myTasks.filter((t) => !t.completed).length} Pending
          </div>
        </div>
      </div>

      {/* Main Grid: Quick Update Form & My Sheet Leads */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Quick Sheet Update Form */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--color-brand-emerald)" /> Quick Sheet Update (Logged to Profile)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Select one of your assigned student leads to update their counseling stage or record a quick note.
          </p>

          <form onSubmit={handleQuickUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Select Student Lead *</label>
              <select
                className="form-select"
                required
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
              >
                <option value="">-- Choose Assigned Student ({myLeads.length}) --</option>
                {myLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.targetCourse}) - Stage: {lead.stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>New Stage Status</label>
              <select
                className="form-select"
                value={newStageInput}
                onChange={(e) => setNewStageInput(e.target.value)}
              >
                <option value="New Enquiry">New Enquiry</option>
                <option value="Counseling Scheduled">Counseling Scheduled</option>
                <option value="Demo Class Attended">Demo Class Attended</option>
                <option value="Scholarship Test Given">Scholarship Test Given</option>
                <option value="Fee Paid & Enrolled">Fee Paid & Enrolled</option>
                <option value="Not Interested / Lost">Not Interested / Lost</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Add Counseling Note</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="e.g. Attended demo class today. Interested in 2-year NEET dropper batch..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Save Sheet Update
            </button>
          </form>
        </div>

        {/* My Activity Updates Log */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--color-brand-emerald)" /> My Sheet Activity Log
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            All sheet updates recorded under your profile history for Admin review.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
            {myActivities.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent activity logged yet. Use the Quick Sheet Update form to record updates.
              </div>
            ) : (
              myActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#f8faf9',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    <span>{act.action}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{act.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {act.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
