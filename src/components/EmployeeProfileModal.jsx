import React, { useState } from 'react';
import { X, User, Activity, ListChecks, FileText, Mail, Phone, Calendar, Shield, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';

import { isCounselorMatch } from '../data/mockData';

export default function EmployeeProfileModal({
  employee,
  onClose,
  activityLogs = [],
  leads = [],
  tasks = [],
  onUpdatePassword,
  onUpdateEmployee,
  currentUser = { role: 'Admin' },
  initialTab = 'activities'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [empIdInput, setEmpIdInput] = useState(employee?.id || '');
  const [nameInput, setNameInput] = useState(employee?.name || '');
  const [usernameInput, setUsernameInput] = useState(employee?.username || employee?.id || '');
  const [emailInput, setEmailInput] = useState(employee?.email || '');
  const [phoneInput, setPhoneInput] = useState(employee?.phone || '');
  const [roleInput, setRoleInput] = useState(employee?.role || 'Employee');
  const [newPasswordInput, setNewPasswordInput] = useState(employee?.password || 'emp123');
  const [showPassword, setShowPassword] = useState(false);
  const [profileSavedMessage, setProfileSavedMessage] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';

  // Filter activities for this employee (using flexible matching)
  const employeeActivities = activityLogs.filter(
    (log) => isCounselorMatch(log.employeeName, employee?.name)
  );

  // Filter leads assigned to this employee (using flexible matching)
  const employeeLeads = leads.filter(
    (l) => isCounselorMatch(l.counselor, employee?.name)
  );

  // Filter tasks assigned to this employee (using flexible matching)
  const employeeTasks = tasks.filter(
    (t) => isCounselorMatch(t.counselor, employee?.name)
  );


  const handleProfileSaveSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) return;

    if (onUpdateEmployee) {
      onUpdateEmployee(employee.id, {
        id: empIdInput.trim() || employee.id,
        name: nameInput.trim(),
        username: usernameInput.trim() || employee.id,
        email: emailInput.trim(),
        phone: phoneInput.trim(),
        role: roleInput,
        password: newPasswordInput.trim()
      });
    } else if (onUpdatePassword) {
      onUpdatePassword(employee.id, newPasswordInput.trim());
    }

    setProfileSavedMessage(true);
    setTimeout(() => setProfileSavedMessage(false), 3000);
  };


  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(12, 32, 23, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #0c2017 0%, #1b4332 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={employee.avatar}
              alt={employee.name}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #52b788'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{employee.name}</h2>
                <span
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    letterSpacing: '0.5px'
                  }}
                >
                  ID: {employee.id}
                </span>
                <span
                  style={{
                    backgroundColor: employee.role === 'Manager' ? '#f59e0b' : '#3b82f6',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase'
                  }}
                >
                  {employee.role}
                </span>
                <span className="badge badge-admitted" style={{ fontSize: '0.7rem' }}>
                  {employee.status || 'Active'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#b7e4c7', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={14} /> Username: {employee.username || employee.id}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={14} /> {employee.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={14} /> {employee.phone || '+91 98765 00000'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={14} /> Joined: {employee.joinedDate}
                </span>
              </div>
            </div>
          </div>

          <button className="btn-icon" style={{ color: '#ffffff' }} onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Tab Navigation Header */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            backgroundColor: '#f8faf9',
            padding: '0 1.5rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => setActiveTab('activities')}
            style={{
              padding: '0.85rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'activities' ? '3px solid var(--color-brand-emerald)' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'activities' ? 700 : 600,
              color: activeTab === 'activities' ? 'var(--color-brand-emerald)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <Activity size={16} /> Sheet Log ({employeeActivities.length})
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '0.85rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'leads' ? '3px solid var(--color-brand-emerald)' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'leads' ? 700 : 600,
              color: activeTab === 'leads' ? 'var(--color-brand-emerald)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <FileText size={16} /> Assigned Leads ({employeeLeads.length})
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '0.85rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'tasks' ? '3px solid var(--color-brand-emerald)' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'tasks' ? 700 : 600,
              color: activeTab === 'tasks' ? 'var(--color-brand-emerald)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <ListChecks size={16} /> Assigned Tasks ({employeeTasks.length})
          </button>

          <button
            onClick={() => setActiveTab('security')}
            style={{
              padding: '0.85rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'security' ? '3px solid #d97706' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'security' ? 700 : 600,
              color: activeTab === 'security' ? '#d97706' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <KeyRound size={16} /> Password & Security (Admin Power)
          </button>
        </div>


        {/* Tab Contents */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'activities' && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
                All Sheet & Profile Updates by {employee.name}
              </h3>
              {employeeActivities.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No updates recorded for this employee yet. When {employee.name} edits leads, notes, or tasks, history will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {employeeActivities.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#f8faf9',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#e0f2fe',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '2px',
                            flexShrink: 0
                          }}
                        >
                          <Activity size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {act.action}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {act.details}
                          </div>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {act.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'leads' && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
                Leads Managed in Sheet by {employee.name}
              </h3>
              {employeeLeads.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No active leads assigned to {employee.name}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {employeeLeads.map((lead) => (
                    <div
                      key={lead.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {lead.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({lead.id})</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Course: {lead.targetCourse} | Phone: {lead.phone}
                        </div>
                      </div>
                      <span className="badge badge-admitted" style={{ fontSize: '0.75rem' }}>
                        {lead.stage}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
                Tasks Schedule & Completion by {employee.name}
              </h3>
              {employeeTasks.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No tasks assigned to {employee.name}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {employeeTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: task.completed ? '#f0fdf4' : '#ffffff'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Student: {task.student} | Priority: {task.priority} | Due: {task.dueDate} at {task.dueTime}
                        </div>
                      </div>
                      <span className={`badge ${task.completed ? 'badge-admitted' : 'badge-contacted'}`} style={{ fontSize: '0.75rem' }}>
                        {task.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={18} color="#d97706" /> Admin Control: Edit Profile, Mobile No. & Login Credentials
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                As Admin, you can view and update mobile number, official email, name, role, and password for <strong>{employee.name}</strong> ({employee.id}).
              </p>

              {profileSavedMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #86efac',
                    color: '#15803d',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle2 size={18} /> Employee Profile & Mobile No. updated successfully!
                </div>
              )}

              <form onSubmit={handleProfileSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '520px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Employee ID (Code) *</label>
                    <input
                      type="text"
                      required
                      disabled={!isAdmin}
                      value={empIdInput}
                      onChange={(e) => setEmpIdInput(e.target.value)}
                      className="form-input"
                      placeholder="e.g. EMP-105"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Login Username *</label>
                    <input
                      type="text"
                      required
                      disabled={!isAdmin}
                      placeholder="e.g. rajesh105"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 00000"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Official Email *</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Role / Designation</label>
                    <select
                      className="form-select"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                    >
                      <option value="Manager">Manager</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>
                </div>

                {isAdmin ? (
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Set / Reset Login Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter new password..."
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className="form-input"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                          padding: '0.25rem'
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', color: '#92400e', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <KeyRound size={16} /> 🔒 Password changes are restricted to System Admin only. ({currentUser?.role || 'User'} role has read-only security permission).
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#d97706', alignSelf: 'flex-start' }}
                  disabled={!isAdmin}
                >

                  <Shield size={16} /> Save Profile & Password Changes
                </button>
                {!isAdmin && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                    * Only Admin login has the power to edit profile details and passwords.
                  </span>
                )}
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

