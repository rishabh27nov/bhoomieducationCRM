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
  notifications = [],
  countdownFormatted = '20:00',
  isIdle = false,
  isTransferring = false
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

      {/* Right Controls Container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* ⏱️ Dynamic Session Auto-Logout Countdown Badge (Appears when inactive) */}
        {isTransferring ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #93c5fd',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
            title="File Upload/Download Active: Session logout paused"
          >
            <Clock size={15} className="pulse-glow" color="#1d4ed8" />
            <span>Transferring File...</span>
          </div>
        ) : isIdle ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.78rem',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
            }}
            title="No cursor/user activity detected. Move mouse to reset 20-min timer."
          >
            <Clock size={15} color="#dc2626" />
            <span>Auto-Logout in: {countdownFormatted}</span>
          </div>
        ) : null}

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




