import React from 'react';
import LakshyaLogo from './LakshyaLogo';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderOpen,
  CheckSquare,
  BarChart3,
  Contact,
  Settings,
  Sparkles,
  Award,
  CalendarCheck,
  UploadCloud,
  UserCog,
  Share2,
  Phone
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  employeeCount = 0,
  taskCount = 0,
  batchCount = 0,
  currentUser
}) {
  const isEmployeeRole = currentUser?.role === 'Employee';

  let menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Student Enquiries', icon: Users },
    { id: 'meta_connectors', label: 'Meta (FB & IG) Ads', icon: Share2, badge: 'LIVE' },
    { id: 'whatsapp_setup', label: 'WhatsApp API Setup', icon: Phone, badge: 'API' },
    { id: 'applications', label: 'Batches & Admissions', icon: BookOpen, badge: batchCount > 0 ? String(batchCount) : null },
    { id: 'employees', label: 'Faculty & Team', icon: Contact, badge: employeeCount > 0 ? String(employeeCount) : null },
    { id: 'vault', label: 'Student Academic Vault', icon: FolderOpen },
    { id: 'tasks', label: 'Counseling Tasks', icon: CheckSquare, badge: taskCount > 0 ? String(taskCount) : null },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
    { id: 'attendance', label: 'Calendar Attendance', icon: CalendarCheck, badge: 'NEW' },
    { id: 'documents', label: 'Document Upload', icon: UploadCloud, badge: 'UPLOAD' },
    { id: 'employee_settings', label: 'Employee Settings', icon: UserCog, badge: 'EDIT' },
  ];

  // Employee role sidebar items: dashboard, student enquries, faculty and team, councling task, calender attendence, document upload, employe setting
  if (isEmployeeRole) {
    const allowedEmployeeTabIds = [
      'dashboard',
      'leads',
      'employees',
      'tasks',
      'attendance',
      'documents',
      'employee_settings'
    ];
    menuItems = menuItems.filter((item) => allowedEmployeeTabIds.includes(item.id));
  }

  const userAvatar = currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  const userName = currentUser?.name || "System Admin";
  const userRole = currentUser?.role || "Admin";

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      backgroundColor: 'var(--bg-sidebar)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      borderRight: '1px solid rgba(82, 183, 136, 0.15)',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
      zIndex: 20
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'linear-gradient(180deg, rgba(20,56,41,0.5) 0%, rgba(10,28,20,0) 100%)'
      }}>
        <LakshyaLogo size={40} showTagline={true} />
      </div>

      {/* Main Navigation */}
      <nav style={{ padding: '1rem 0.65rem', flex: 1 }}>
        <div style={{
          fontSize: '0.64rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#52b788',
          padding: '0 0.6rem 0.6rem 0.6rem'
        }}>
          NEET & JEE Coaching Portal
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: isActive ? '#1b4332' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(27, 67, 50, 0.4)' : 'none',
                    borderLeft: isActive ? '4px solid #52b788' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={18} color={isActive ? '#52b788' : 'currentColor'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? '#52b788' : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? '#081c15' : '#cbd5e1'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Target Achievement Widget */}
      <div style={{
        margin: '1rem 0.85rem',
        padding: '1rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(34,87,64,0.4) 0%, rgba(12,32,23,0.8) 100%)',
        border: '1px solid rgba(82,183,136,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d8f3dc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} color="#fef08a" /> Session 2026 Target
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#52b788' }}>92%</span>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, #52b788, #74c69d)', borderRadius: '9999px' }}></div>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Target: 150 Admissions</span>
          <span>132 Enrolled</span>
        </div>
      </div>

      {/* Bottom Profile Footer */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={userAvatar}
            alt={userName}
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #52b788' }}
          />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>{userName}</div>
            <div style={{ fontSize: '0.7rem', color: '#74c69d' }}>{userRole} Account</div>
          </div>
        </div>

        <button className="btn-icon" style={{ color: '#94a3b8' }} title="Employee Settings" onClick={() => setActiveTab('employee_settings')}>
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
}
