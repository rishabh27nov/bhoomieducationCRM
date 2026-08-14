import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Calendar, HelpCircle, UserCheck, Shield, LogOut, CheckCircle2, AlertTriangle, Clock, X, Sparkles, FolderOpen } from 'lucide-react';


export default function Navbar({
  onOpenAddLead,
  searchQuery,
  setSearchQuery,
  currentUser,
  setCurrentUser,
  employees = [],
  onLogout,
  tasks = [],
  leads = [],
  notifications = []
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState([]);
  const [, setTick] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];

  // Auto-sync ticker every 1 second so notifications update INSTANTLY without refresh or relog
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to check if task or notification belongs to logged-in user account
  const isMyAccount = (counselorName) => {
    if (!currentUser || !counselorName) return false;
    if (currentUser.role === 'Admin') return true; // Admin sees all system alerts
    return counselorName.toLowerCase() === currentUser.name.toLowerCase();
  };

  // Read latest tasks/leads/notifications from localStorage for instant cross-tab/cross-action updates
  const currentTasks = (() => {
    try {
      const saved = localStorage.getItem('lakshya_tasks');
      return saved ? JSON.parse(saved) : tasks;
    } catch {
      return tasks;
    }
  })();

  const currentLeads = (() => {
    try {
      const saved = localStorage.getItem('lakshya_leads');
      return saved ? JSON.parse(saved) : leads;
    } catch {
      return leads;
    }
  })();

  const currentCustomNotifs = (() => {
    try {
      const saved = localStorage.getItem('lakshya_notifications');
      return saved ? JSON.parse(saved) : notifications;
    } catch {
      return notifications;
    }
  })();

  // Generate personalized 2-stage notifications for logged-in user account
  const myTasks = currentTasks.filter((t) => !t.completed && isMyAccount(t.counselor));
  const myLeads = currentLeads.filter((l) => isMyAccount(l.counselor));

  const generatedNotifications = [];

  // 1. Instant Custom Notifications dispatched by Admin Actions (Lead Assigned, Profile Updated, Password Reset)
  currentCustomNotifs.forEach((cn) => {
    if (cn.targetUser === 'ALL' || isMyAccount(cn.targetUser)) {
      generatedNotifications.push({
        id: cn.id,
        stage: 1,
        type: cn.type || 'CustomAlert',
        title: cn.title,
        student: cn.targetUser,
        details: cn.details,
        time: cn.time,
        priority: 'High',
        counselor: cn.targetUser
      });
    }
  });

  // 2. STAGE 1: Same Day Reminder (Morning / Today Due Alert)
  myTasks.forEach((t) => {
    const isToday = t.dueDate === 'Today' || t.dueDate === todayStr;
    if (isToday) {
      generatedNotifications.push({
        id: `notif-s1-${t.id}`,
        stage: 1,
        type: 'SameDayReminder',
        title: `📅 Same-Day Task Reminder`,
        student: t.student,
        details: `Follow-up "${t.title}" is scheduled for TODAY for student ${t.student}.`,
        time: `Today at ${t.dueTime}`,
        priority: t.priority,
        counselor: t.counselor
      });
    }
  });

  // 3. STAGE 2: Exact Time Alarm (Exact Date & Time Alarm Alert)
  myTasks.forEach((t) => {
    const isToday = t.dueDate === 'Today' || t.dueDate === todayStr;
    const isHighOrUrgent = t.priority === 'High' || t.priority === 'Urgent';
    if (isToday && (isHighOrUrgent || t.dueTime)) {
      generatedNotifications.push({
        id: `notif-s2-${t.id}`,
        stage: 2,
        type: 'ExactTimeAlarm',
        title: `🚨 EXACT TIME ALARM ALERT!`,
        student: t.student,
        details: `URGENT ALARM: Scheduled time (${t.dueTime}) reached! Execute ${t.type} for ${t.student} NOW!`,
        time: `${t.dueTime}`,
        priority: 'Urgent',
        counselor: t.counselor
      });
    }
  });

  // 4. New Assigned Lead Notification
  myLeads.slice(0, 3).forEach((l) => {
    generatedNotifications.push({
      id: `notif-lead-${l.id}`,
      stage: 1,
      type: 'LeadAssigned',
      title: `📄 New Lead Assigned to Sheet`,
      student: l.name,
      details: `Student ${l.name} (${l.targetCourse}) assigned to your counselor profile.`,
      time: l.lastContact || 'Recently',
      priority: 'Normal',
      counselor: l.counselor
    });
  });


  // Filter out dismissed notifications
  const activeNotifications = generatedNotifications.filter(
    (n) => !dismissedNotifIds.includes(n.id)
  );

  const dismissNotif = (id) => {
    setDismissedNotifIds((prev) => [...prev, id]);
  };

  return (
    <header style={{
      height: '70px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
    }}>
      {/* Global Search Bar */}
      <div style={{ position: 'relative', width: '340px' }}>
        <Search
          size={18}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Search student, staff, course..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '2.5rem', backgroundColor: '#f8faf9', border: '1px solid #e2e8f0' }}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        
        {/* Secure Active User Session Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: currentUser?.role === 'Admin' ? '#fef3c7' : '#e0f2fe',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: currentUser?.role === 'Admin' ? '1px solid #f59e0b' : '1px solid #0284c7',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: currentUser?.role === 'Admin' ? '#92400e' : '#0369a1'
          }}
          title="Account Locked & Protected. Logout to switch users."
        >
          {currentUser?.role === 'Admin' ? (
            <Shield size={16} color="#d97706" />
          ) : (
            <UserCheck size={16} color="#0284c7" />
          )}
          <span>
            Logged in: {currentUser?.name} ({currentUser?.role || 'User'})
          </span>
        </div>

        {/* 🔔 Interactive Notification Center (Account Personalized) */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            style={{
              position: 'relative',
              backgroundColor: isNotifOpen ? '#f0fdf4' : 'transparent',
              color: activeNotifications.length > 0 ? 'var(--color-brand-emerald)' : 'var(--text-muted)'
            }}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            title={`Notifications Center for ${currentUser?.name}`}
          >
            <Bell size={20} className={activeNotifications.some((n) => n.type === 'ExactTimeAlarm') ? 'pulse-glow' : ''} />
            {activeNotifications.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: activeNotifications.some((n) => n.type === 'ExactTimeAlarm') ? '#ef4444' : '#d97706',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                }}
              >
                {activeNotifications.length}
              </span>
            )}
          </button>

          {/* Personalized Notifications Dropdown Panel */}
          {isNotifOpen && (
            <div
              className="glass-card animate-fade-in"
              style={{
                position: 'absolute',
                right: 0,
                top: '50px',
                width: '380px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-light)',
                zIndex: 100,
                overflow: 'hidden'
              }}
            >
              {/* Dropdown Header */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  background: 'linear-gradient(135deg, #0c2017 0%, #143829 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={16} color="#3a8a66" /> Account Notifications for {currentUser?.name}
                </div>
                <button
                  className="btn-icon"
                  style={{ color: '#ffffff', padding: '0.2rem' }}
                  onClick={() => setIsNotifOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Notifications List */}
              <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeNotifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
                    No unread notifications for {currentUser?.name}. You are all caught up!
                  </div>
                ) : (
                  activeNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: notif.type === 'ExactTimeAlarm' ? '#fef2f2' : notif.type === 'SameDayReminder' ? '#fffbe6' : '#f0fdf4',
                        border: notif.type === 'ExactTimeAlarm' ? '1px solid #fecaca' : notif.type === 'SameDayReminder' ? '1px solid #fef08a' : '1px solid #b7e4c7',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: notif.type === 'ExactTimeAlarm' ? '#b91c1c' : notif.type === 'SameDayReminder' ? '#92400e' : '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {notif.title}
                        </span>

                        <button
                          className="btn-icon"
                          style={{ padding: '0.15rem', color: 'var(--text-muted)' }}
                          onClick={() => dismissNotif(notif.id)}
                          title="Mark as Read"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        {notif.details}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        <span>Account: <strong>{notif.counselor}</strong></span>
                        <span>⏰ {notif.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Academic Session Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'var(--color-brand-soft)',
          padding: '0.4rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--color-brand-dark)'
        }}>
          <Calendar size={15} color="var(--color-brand-primary)" />
          <span>Session: 2026-2027</span>
        </div>



        {/* Logout Button */}
        {onLogout && (
          <button
            className="btn btn-secondary"
            onClick={onLogout}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444' }}
            title="Log Out"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}


        {/* Primary Action Button (Admin Power Only) */}
        {currentUser?.role === 'Admin' && (
          <button className="btn btn-primary" onClick={onOpenAddLead} title="Create New Student Enquiry (Admin Power)">
            <Plus size={18} />
            <span>New Enquiry</span>
          </button>
        )}
      </div>
    </header>
  );
}




