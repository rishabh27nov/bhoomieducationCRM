import React, { useState, useEffect } from 'react';
import {
  INITIAL_LEADS,
  COUNSELORS,
  INITIAL_ACTIVITIES,
  INITIAL_TASKS,
  ADMIN_CREDENTIALS,
  DEFAULT_COURSES,
  isCounselorMatch
} from './data/mockData';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import LoginPage from './components/LoginPage';
import LeadsManager from './components/LeadsManager';
import ApplicationsManager from './components/ApplicationsManager';
import EmployeesManager from './components/EmployeesManager';
import StudentVault from './components/StudentVault';
import TasksManager from './components/TasksManager';
import Analytics from './components/Analytics';
import StaffAttendanceCalendar from './components/StaffAttendanceCalendar';
import LeadModal from './components/LeadModal';
import DocumentUploadManager from './components/DocumentUploadManager';
import EmployeeSettingsManager from './components/EmployeeSettingsManager';
import MetaLeadConnectors from './components/MetaLeadConnectors';

import AddLeadModal from './components/AddLeadModal';
import AddEmployeeModal from './components/AddEmployeeModal';
import { db as firebaseDB, ref, onValue, set } from './firebase';

// Automatic cache cleanup for sample/mock data reset
try {
  if (!localStorage.getItem('lakshya_mock_data_cleared_v2')) {
    localStorage.removeItem('lakshya_leads');
    localStorage.removeItem('lakshya_tasks');
    localStorage.removeItem('lakshya_activities');
    localStorage.removeItem('lakshya_notifications');
    localStorage.removeItem('lakshya_uploaded_documents');
    localStorage.setItem('lakshya_mock_data_cleared_v2', 'true');
  }
} catch (e) {
  console.warn('LocalStorage cache clear error:', e);
}

export default function App() {
  // Load state from localStorage to persist across browser refresh
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('lakshya_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('lakshya_courses');
      return saved ? JSON.parse(saved) : DEFAULT_COURSES;
    } catch { return DEFAULT_COURSES; }
  });
  const [leads, setLeads] = useState(() => {
    const initialMetaLeads = [
      {
        "id": "LEAD-META-27887077174278335",
        "name": "Newton Basumatary",
        "phone": "+91 98642 12345",
        "email": "newton.basumatary@gmail.com",
        "targetCourse": "NEET / JEE 2026 Batch",
        "course": "NEET Class 12",
        "batch": "SB | LAKSHYA | NEW FORM | 27.08.26",
        "feeBudget": "N/A",
        "stage": "New Enquiry",
        "counselor": "Unassigned",
        "city": "Assam / Online",
        "source": "Facebook Lead Form",
        "status": "New Lead",
        "createdAt": "2026-08-29T07:32:00.000Z",
        "notes": "Real Meta Lead Ingested from Facebook Lead Ad: SB | LAKSHYA | NEW FORM | 27.08.26"
      },
      {
        "id": "LEAD-META-FB-101",
        "name": "Tangsang",
        "phone": "+91 94351 98765",
        "email": "tangsang.edu@gmail.com",
        "targetCourse": "JEE Main + Advanced 2026",
        "course": "JEE Class 12",
        "batch": "SB | LAKSHYA | NEW FORM | 27.08.26",
        "feeBudget": "N/A",
        "stage": "New Enquiry",
        "counselor": "Unassigned",
        "city": "Guwahati",
        "source": "Facebook Lead Form",
        "status": "New Lead",
        "createdAt": "2026-08-28T14:30:00.000Z",
        "notes": "Real Meta Lead Ingested from Facebook Lead Ad: SB | LAKSHYA | NEW FORM | 27.08.26"
      },
      {
        "id": "LEAD-META-FB-102",
        "name": "Ananya Sharma",
        "phone": "+91 97188 65432",
        "email": "ananya.sharma99@gmail.com",
        "targetCourse": "JEE Class 11 (Webinar Lead)",
        "course": "JEE Class 11",
        "batch": "SB | WEBINAR LEADS | 28.08.26",
        "feeBudget": "N/A",
        "stage": "New Enquiry",
        "counselor": "Unassigned",
        "city": "Jaipur",
        "source": "Facebook Lead Form",
        "status": "New Lead",
        "createdAt": "2026-08-28T16:15:00.000Z",
        "notes": "Lead captured from Meta Campaign: SB | WEBINAR LEADS | 28.08.26"
      },
      {
        "id": "LEAD-META-2788709923812736",
        "name": "Priya Choudhary",
        "phone": "+91 98234 11223",
        "email": "priya.choudhary@gmail.com",
        "targetCourse": "NEET Dropper Batch 2026",
        "course": "NEET Class 12",
        "batch": "SB | LAKSHYA | NEW FORM | 27.08.26",
        "feeBudget": "N/A",
        "stage": "New Enquiry",
        "counselor": "Unassigned",
        "city": "Kota / Online",
        "source": "Instagram Lead Ad",
        "status": "New Lead",
        "createdAt": "2026-08-29T08:10:00.000Z",
        "notes": "Real Meta Instagram Lead Ingested via Webhook. Form: SB | LAKSHYA | NEW FORM | 27.08.26"
      }
    ];

    try {
      const saved = localStorage.getItem('lakshya_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('lakshya_leads', JSON.stringify(initialMetaLeads));
      return initialMetaLeads;
    } catch (e) {
      return initialMetaLeads;
    }
  });
  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem('lakshya_employees');
      return saved ? JSON.parse(saved) : COUNSELORS;
    } catch { return COUNSELORS; }
  });
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('lakshya_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [documents, setDocuments] = useState([]);

  const handleSaveAttendance = (dateStr, dailyStatusObj) => {
    const existingForDate = attendanceRecords[dateStr] || {};
    const mergedForDate = {
      ...existingForDate,
      ...dailyStatusObj
    };
    const updated = {
      ...attendanceRecords,
      [dateStr]: mergedForDate
    };
    setAttendanceRecords(updated);
    logActivity('Staff Attendance Updated', `Staff marked/updated attendance register for date ${dateStr}`);
    saveToCentralDB({ attendanceRecords: updated });
    try {
      window.dispatchEvent(new CustomEvent('lakshya_attendance_updated', { detail: updated }));
    } catch {}
  };

  // Active user session state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('lakshya_user');

    let user = saved ? JSON.parse(saved) : ADMIN_CREDENTIALS;
    if (user && isCounselorMatch(user.name, 'Rishabh yadav')) {
      user = {
        ...user,
        name: 'Rishabh yadav',
        email: 'rishubh27nov@gmail.com',
        phone: '9170072278'
      };
    }
    return user;
  });


  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('lakshya_auth', isAuthenticated ? 'true' : '');
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('lakshya_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('lakshya_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('lakshya_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('lakshya_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('lakshya_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('lakshya_activities', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('lakshya_notifications', JSON.stringify(notifications));
  }, [notifications]);



  // Central Database API Sync Engine (Firebase Realtime Cloud Database Sync)
  useEffect(() => {
    try {
      const crmRef = ref(firebaseDB, 'lakshya_crm_central_db');
      const unsubscribe = onValue(crmRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.leads !== undefined) {
            let parsedLeads = [];
            if (Array.isArray(data.leads)) {
              parsedLeads = data.leads.filter(Boolean);
            } else if (typeof data.leads === 'object' && data.leads !== null) {
              parsedLeads = Object.values(data.leads).filter(Boolean);
            }
            if (parsedLeads.length > 0 || Array.isArray(data.leads)) {
              setLeads(parsedLeads);
              localStorage.setItem('lakshya_leads', JSON.stringify(parsedLeads));
            }
          }
          if (data.employees && Array.isArray(data.employees)) {
            setEmployees(data.employees);
            localStorage.setItem('lakshya_employees', JSON.stringify(data.employees));

            // Auto-Kick & Logout Safety: If current logged in employee was deleted by Admin from Firebase
            if (currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Institute') {
              const stillExists = data.employees.some(
                (e) => e.id === currentUser.id || isCounselorMatch(e.name, currentUser.name)
              );
              if (!stillExists) {
                alert('⚠️ Account Disabled: Your employee account has been deleted by Administrator.');
                handleLogout();
              }
            }
          }
          if (data.tasks !== undefined) {
            let parsedTasks = [];
            if (Array.isArray(data.tasks)) {
              parsedTasks = data.tasks.filter(Boolean);
            } else if (typeof data.tasks === 'object' && data.tasks !== null) {
              parsedTasks = Object.values(data.tasks).filter(Boolean);
            }
            setTasks(parsedTasks);
            localStorage.setItem('lakshya_tasks', JSON.stringify(parsedTasks));
          } else {
            setTasks([]);
            localStorage.setItem('lakshya_tasks', JSON.stringify([]));
          }
          if (data.courses && Array.isArray(data.courses)) {
            setCourses(data.courses);
            localStorage.setItem('lakshya_courses', JSON.stringify(data.courses));
          }
          if (data.activityLogs !== undefined) {
            let parsedLogs = [];
            if (Array.isArray(data.activityLogs)) {
              parsedLogs = data.activityLogs.filter(Boolean);
            } else if (typeof data.activityLogs === 'object' && data.activityLogs !== null) {
              parsedLogs = Object.values(data.activityLogs).filter(Boolean);
            }
            setActivityLogs(parsedLogs);
            localStorage.setItem('lakshya_activities', JSON.stringify(parsedLogs));
          } else {
            setActivityLogs([]);
            localStorage.setItem('lakshya_activities', JSON.stringify([]));
          }
          if (data.notifications !== undefined) {
            let parsedNotifs = [];
            if (Array.isArray(data.notifications)) {
              parsedNotifs = data.notifications.filter(Boolean);
            } else if (typeof data.notifications === 'object' && data.notifications !== null) {
              parsedNotifs = Object.values(data.notifications).filter(Boolean);
            }
            setNotifications(parsedNotifs);
            localStorage.setItem('lakshya_notifications', JSON.stringify(parsedNotifs));
          } else {
            setNotifications([]);
            localStorage.setItem('lakshya_notifications', JSON.stringify([]));
          }
          if (data.attendanceRecords && typeof data.attendanceRecords === 'object') {
            setAttendanceRecords(data.attendanceRecords);
            localStorage.setItem('lakshya_attendance', JSON.stringify(data.attendanceRecords));
          }
          if (data.documents !== undefined) {
            let parsedDocs = [];
            if (Array.isArray(data.documents)) {
              parsedDocs = data.documents.filter(Boolean);
            } else if (typeof data.documents === 'object' && data.documents !== null) {
              parsedDocs = Object.values(data.documents).filter(Boolean);
            }
            setDocuments(parsedDocs);
            localStorage.setItem('lakshya_uploaded_documents', JSON.stringify(parsedDocs));
          } else {
            setDocuments([]);
            localStorage.setItem('lakshya_uploaded_documents', JSON.stringify([]));
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase Realtime listener setup:', e);
    }
  }, [currentUser]);

  const saveToCentralDB = async (override = {}) => {
    try {
      const payload = {
        courses,
        employees,
        leads,
        tasks,
        activityLogs,
        notifications,
        attendanceRecords,
        documents,
        ...override
      };
      // Write to Firebase Realtime Cloud Database
      const crmRef = ref(firebaseDB, 'lakshya_crm_central_db');
      await set(crmRef, payload);
    } catch {
      // Offline fallback
    }
  };



  // Multi-window Real-Time Broadcast Sync Engine & Storage Listener
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('lakshya_crm_broadcast');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_ALL') {
          const { leads: bLeads, tasks: bTasks, employees: bEmployees, courses: bCourses, activities: bActs, notifications: bNotifs, attendanceRecords: bAtt } = event.data;
          if (bLeads) setLeads(bLeads);
          if (bTasks) setTasks(bTasks);
          if (bEmployees) setEmployees(bEmployees);
          if (bCourses) setCourses(bCourses);
          if (bActs) setActivityLogs(bActs);
          if (bNotifs) setNotifications(bNotifs);
          if (bAtt) setAttendanceRecords(bAtt);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel fallback:', e);
    }

    const handleStorageChange = (e) => {
      if (e.key === 'lakshya_attendance' && e.newValue) {
        try {
          setAttendanceRecords(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const broadcastStateSync = (override = {}) => {
    saveToCentralDB(override);
    try {
      const channel = new BroadcastChannel('lakshya_crm_broadcast');
      channel.postMessage({
        type: 'SYNC_ALL',
        leads,
        tasks,
        employees,
        courses,
        activities: activityLogs,
        notifications,
        attendanceRecords: override.attendanceRecords || attendanceRecords,
        ...override
      });
      channel.close();
    } catch {
      // fallback
    }
  };



  // Real-time Notification Dispatcher
  const sendRealtimeNotification = ({ targetUser, title, details, type, time }) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      targetUser: targetUser || 'ALL',
      title: title || '⚡ Instant Notification Alert',
      details: details || '',
      type: type || 'Alert',
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };


  // Handler to add a new course/class dynamically
  const handleAddCourse = (newCourseName) => {
    const trimmed = newCourseName.trim();
    if (!trimmed) return;
    if (courses.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Course "${trimmed}" already exists.`);
      return;
    }
    const updated = [...courses, trimmed];
    setCourses(updated);
    logActivity('New Course Added', `Added new course/class "${trimmed}" to curriculum`);
  };


  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Login handler
  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  // Inactivity Auto-Logout System (20 minutes of no user interaction with dynamic Header timer)
  const [isTransferring, setIsTransferring] = useState(false);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [isIdle, setIsIdle] = useState(false);

  // Global window listeners to signal ongoing file uploads / downloads
  useEffect(() => {
    const handleStart = () => setIsTransferring(true);
    const handleEnd = () => setIsTransferring(false);

    window.addEventListener('lakshya_transfer_start', handleStart);
    window.addEventListener('lakshya_transfer_end', handleEnd);

    return () => {
      window.removeEventListener('lakshya_transfer_start', handleStart);
      window.removeEventListener('lakshya_transfer_end', handleEnd);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const INACTIVITY_LIMIT_SEC = 20 * 60; // 20 Minutes (1200 Seconds)

    // Reset timer on any cursor movement, click, keypress
    const handleUserActivity = () => {
      setIdleSeconds(0);
      setIsIdle(false);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // 1-second interval to tick idle time
    const interval = setInterval(() => {
      setIdleSeconds((prev) => {
        const nextSec = prev + 1;

        // Show countdown badge if inactive for 5 seconds or more
        if (nextSec >= 5) {
          setIsIdle(true);
        }

        // Auto-logout trigger at 20 minutes (1200s)
        if (nextSec >= INACTIVITY_LIMIT_SEC) {
          // Safety check: Do NOT auto-logout if an active upload or download is in progress
          if (window.isLakshyaUploading || window.isLakshyaDownloading || isTransferring) {
            return INACTIVITY_LIMIT_SEC - 60; // Extend by 1 min during file transfers
          }

          alert('⏱️ Session Expired: Auto-logged out due to 20 minutes of inactivity.');
          handleLogout();
          return 0;
        }
        return nextSec;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
    };
  }, [isAuthenticated, isTransferring]);

  // Format remaining seconds into MM:SS format
  const remainingSec = Math.max(0, 1200 - idleSeconds);
  const remainingMinStr = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const remainingSecStr = String(remainingSec % 60).padStart(2, '0');
  const countdownFormatted = `${remainingMinStr}:${remainingSecStr}`;

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(ADMIN_CREDENTIALS);
    localStorage.removeItem('lakshya_auth');
    localStorage.removeItem('lakshya_user');
  };


  // Helper to log employee/admin actions into history
  const logActivity = (action, details) => {
    const newLog = {
      id: `ACT-${Date.now()}`,
      employeeName: currentUser.name,
      action: action,
      details: details,
      timestamp: new Date().toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Password reset handler (Admin action)
  const handlePasswordChange = (empId, newPassword) => {
    const targetEmp = employees.find((e) => e.id === empId);
    setEmployees(employees.map(e => e.id === empId ? { ...e, password: newPassword } : e));
    if (targetEmp) {
      logActivity(
        'Password Changed by Admin',
        `Admin updated login password for ${targetEmp.name} (${targetEmp.id})`
      );
      sendRealtimeNotification({
        targetUser: targetEmp.name,
        title: '🔑 Password Changed by Admin',
        details: `Your login password has been updated by Admin. New password: ${newPassword}`,
        type: 'ProfileUpdated'
      });
    }
  };

  // Profile & Mobile No. update handler (Admin action)
  const handleUpdateEmployeeProfile = (empId, updatedFields) => {
    const targetEmp = employees.find((e) => e.id === empId);
    if (!targetEmp) return;

    const oldName = targetEmp.name;
    const newName = updatedFields.name || oldName;

    // Update employees array
    const updatedEmployeesList = employees.map(e => e.id === empId ? { ...e, ...updatedFields } : e);
    setEmployees(updatedEmployeesList);

    // Sync currentUser session if logged-in user is updated
    if (currentUser && currentUser.id === empId) {
      const updatedUser = { ...currentUser, ...updatedFields };
      setCurrentUser(updatedUser);
      localStorage.setItem('lakshya_user', JSON.stringify(updatedUser));
    }

    saveToCentralDB({ employees: updatedEmployeesList });

    // Propagate name change to assigned leads and tasks if name changed
    if (newName !== oldName) {
      setLeads((prev) =>
        prev.map((l) =>
          l.counselor && l.counselor.toLowerCase() === oldName.toLowerCase()
            ? { ...l, counselor: newName }
            : l
        )
      );

      setTasks((prev) =>
        prev.map((t) =>
          t.counselor && t.counselor.toLowerCase() === oldName.toLowerCase()
            ? { ...t, counselor: newName }
            : t
        )
      );
    }

    logActivity(
      'Employee Profile Updated by Admin',
      `Admin updated profile (${newName}, ${updatedFields.phone || targetEmp.phone})`
    );

    sendRealtimeNotification({
      targetUser: newName,
      title: '✏️ Profile Updated by Admin',
      details: `Admin updated your profile details (Name/Phone/Role).`,
      type: 'ProfileUpdated'
    });
  };


  // Handle stage change
  const handleUpdateLeadStage = (leadId, newStage) => {
    const targetLead = leads.find((l) => l.id === leadId);
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, stage: newStage, lastContact: 'Just now' } : l);
    setLeads(updatedLeads);
    localStorage.setItem('lakshya_leads', JSON.stringify(updatedLeads));
    saveToCentralDB({ leads: updatedLeads });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, stage: newStage, lastContact: 'Just now' }));
    }
    if (targetLead) {
      logActivity(
        'Lead Stage Updated',
        `Updated stage for ${targetLead.name} (${targetLead.id}) to "${newStage}"`
      );
    }
  };

  // Handle note addition
  const handleAddNote = (leadId, noteText) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const authorName = currentUser?.name || 'User';
    const noteEntry = `\n\n[Log - ${dateStr} ${timeStr} by ${authorName}]: ${noteText}`;
    const targetLead = leads.find((l) => l.id === leadId);
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, notes: (l.notes || '') + noteEntry } : l);
    setLeads(updatedLeads);
    localStorage.setItem('lakshya_leads', JSON.stringify(updatedLeads));
    saveToCentralDB({ leads: updatedLeads });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, notes: (prev.notes || '') + noteEntry }));
    }
    if (targetLead) {
      logActivity(
        'Note Added to Lead',
        `Added note to ${targetLead.name} by ${authorName}: "${noteText}"`
      );
    }
  };

  // Handle counselor reassignment
  const handleUpdateLeadCounselor = (leadId, newCounselor) => {
    const targetLead = leads.find((l) => l.id === leadId);
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, counselor: newCounselor } : l);
    setLeads(updatedLeads);
    localStorage.setItem('lakshya_leads', JSON.stringify(updatedLeads));
    saveToCentralDB({ leads: updatedLeads });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, counselor: newCounselor }));
    }
    if (targetLead) {
      logActivity(
        'Lead Reassigned',
        `Reassigned lead ${targetLead.name} (${targetLead.id}) to ${newCounselor}`
      );
      sendRealtimeNotification({
        targetUser: newCounselor,
        title: '📋 Lead Assigned to You',
        details: `Lead "${targetLead.name}" has been assigned to you.`,
        type: 'LeadAssigned'
      });
    }
  };

  // Handle direct fee/budget update
  const handleUpdateLeadFee = (leadId, newFeeBudget) => {
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, feeBudget: newFeeBudget } : l);
    setLeads(updatedLeads);
    localStorage.setItem('lakshya_leads', JSON.stringify(updatedLeads));
    saveToCentralDB({ leads: updatedLeads });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, feeBudget: newFeeBudget }));
    }
    logActivity('Fee/Budget Updated', `Updated Fee/Budget for lead ${leadId} to "${newFeeBudget}"`);
  };

  // Handle direct full student profile edit
  const handleUpdateLeadProfile = (leadId, updatedFields) => {
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, ...updatedFields } : l);
    setLeads(updatedLeads);
    localStorage.setItem('lakshya_leads', JSON.stringify(updatedLeads));
    saveToCentralDB({ leads: updatedLeads });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, ...updatedFields }));
    }
    logActivity('Student Profile Edited', `Updated details for lead ${leadId}`);
  };

  // Handle direct notes update/edit/delete
  const handleUpdateLeadNotes = (leadId, newNotesText) => {
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, notes: newNotesText } : l);
    setLeads(updatedLeads);
    localStorage.setItem('lakshya_leads', JSON.stringify(updatedLeads));
    saveToCentralDB({ leads: updatedLeads });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, notes: newNotesText }));
    }
    logActivity('Lead Notes Modified', `Edited/cleared notes for lead ${leadId}`);
  };


  // Handle add lead / bulk add leads (Admin action only)
  const handleAddLead = (newLeadData) => {
    if (currentUser?.role !== 'Admin') {
      alert('Permission Denied: Only Admin has authority to create new student enquiries.');
      return;
    }

    let updatedLeads = [];
    if (Array.isArray(newLeadData)) {
      updatedLeads = [...newLeadData, ...leads];
    } else {
      updatedLeads = [newLeadData, ...leads];
    }

    setLeads(updatedLeads);
    localStorage.setItem('lakshya_leads', JSON.stringify(updatedLeads));
    saveToCentralDB({ leads: updatedLeads });

    if (Array.isArray(newLeadData)) {
      logActivity(
        'Bulk Leads Created',
        `Admin imported ${newLeadData.length} student enquiries via Excel/CSV`
      );
    } else {
      logActivity(
        'New Lead Created',
        `Admin created new lead for student ${newLeadData.name} (${newLeadData.targetCourse})`
      );
      if (newLeadData.counselor) {
        sendRealtimeNotification({
          targetUser: newLeadData.counselor,
          title: '📄 New Lead Assigned',
          details: `Admin assigned new student enquiry "${newLeadData.name}" (${newLeadData.targetCourse}) to your profile!`,
          type: 'LeadAssigned'
        });
      }
    }
  };

  // Add Employee Handler (Write directly to Firebase)
  const handleAddEmployee = (newEmployeeData) => {
    if (currentUser?.role !== 'Admin') {
      alert('Permission Denied: Only Admin has authority to create new employee IDs.');
      return;
    }
    const updatedEmployees = [newEmployeeData, ...employees];
    setEmployees(updatedEmployees);
    try {
      set(ref(firebaseDB, 'lakshya_crm_central_db/employees'), updatedEmployees);
    } catch (e) {
      console.error('Firebase employee add error:', e);
    }
    logActivity(
      'New Employee ID Created',
      `Admin created new employee ID for ${newEmployeeData.name} with Role "${newEmployeeData.role}"`
    );
  };


  // Handle delete lead
  const handleDeleteLead = (leadId) => {
    const targetLead = leads.find((l) => l.id === leadId);
    const updatedLeads = leads.filter(l => l.id !== leadId);
    setLeads(updatedLeads);
    localStorage.setItem('lakshya_leads', JSON.stringify(updatedLeads));
    try {
      set(ref(firebaseDB, 'lakshya_crm_central_db/leads'), updatedLeads);
    } catch (e) {}
    if (targetLead) {
      logActivity('Lead Deleted', `Deleted lead record ${targetLead.name} (${targetLead.id})`);
    }
  };

  // Handle bulk delete leads (Admin power)
  const handleBulkDeleteLeads = (leadIds) => {
    if (!Array.isArray(leadIds) || leadIds.length === 0) return;
    const idsSet = new Set(leadIds);
    const updatedLeads = leads.filter((l) => !idsSet.has(l.id));
    setLeads(updatedLeads);
    localStorage.setItem('lakshya_leads', JSON.stringify(updatedLeads));
    try {
      set(ref(firebaseDB, 'lakshya_crm_central_db/leads'), updatedLeads);
    } catch (e) {}
    logActivity('Bulk Leads Deleted', `Admin deleted ${leadIds.length} student enquiries`);
  };

  // Handle tasks updates (add, toggle, delete) with immediate Firebase & LocalStorage sync
  const handleUpdateTasks = (newTasks) => {
    setTasks(newTasks);
    localStorage.setItem('lakshya_tasks', JSON.stringify(newTasks));
    try {
      set(ref(firebaseDB, 'lakshya_crm_central_db/tasks'), newTasks);
    } catch (e) {}
  };


  // Handle delete employee (with safe lead reassignment & immediate Firebase deletion)
  const handleDeleteEmployee = (empId) => {
    const targetEmp = employees.find((e) => e.id === empId);
    const updatedEmployees = employees.filter(e => e.id !== empId);
    setEmployees(updatedEmployees);
    localStorage.setItem('lakshya_employees', JSON.stringify(updatedEmployees));

    try {
      set(ref(firebaseDB, 'lakshya_crm_central_db/employees'), updatedEmployees);
    } catch (e) {
      console.error('Firebase employee delete error:', e);
    }

    if (targetEmp) {
      const deletedName = targetEmp.name;
      const fallbackCounselor = updatedEmployees.length > 0 ? updatedEmployees[0].name : 'System Admin';

      const reassignedLeads = leads.map((l) =>
        l.counselor && isCounselorMatch(l.counselor, deletedName)
          ? { ...l, counselor: fallbackCounselor }
          : l
      );

      setLeads(reassignedLeads);
      localStorage.setItem('lakshya_leads', JSON.stringify(reassignedLeads));
      logActivity('Employee Deleted & Leads Reassigned', `Deleted employee ${deletedName} and reassigned their student leads to ${fallbackCounselor}`);
      saveToCentralDB({ employees: updatedEmployees, leads: reassignedLeads });
    }
  };

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        employees={employees}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        employeeCount={employees.length}
        taskCount={tasks.length}
        batchCount={0}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        <Navbar
          onOpenAddLead={() => setIsAddLeadOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          employees={employees}
          onLogout={handleLogout}
          tasks={tasks}
          leads={leads}
          notifications={notifications}
          countdownFormatted={countdownFormatted}
          isIdle={isIdle}
          isTransferring={isTransferring}
        />



        <main style={{ flex: 1, backgroundColor: 'var(--bg-main)' }}>
          {activeTab === 'dashboard' && (
            (currentUser.role === 'Admin' || currentUser.role === 'Institute') ? (
              <Dashboard
                setActiveTab={setActiveTab}
                onSelectLead={(lead) => setSelectedLead(lead)}
                leads={leads}
                employees={employees}
                tasks={tasks}
                searchQuery={searchQuery}
              />
            ) : (
              <EmployeeDashboard
                currentUser={currentUser}
                leads={leads}
                tasks={tasks}
                activityLogs={activityLogs}
                onUpdateLeadStage={handleUpdateLeadStage}
                onAddNote={handleAddNote}
                onOpenAddLead={() => setIsAddLeadOpen(true)}
              />
            )
          )}


          {activeTab === 'leads' && (
            <LeadsManager
              leads={leads}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onOpenAddLead={() => setIsAddLeadOpen(true)}
              onUpdateLeadStage={handleUpdateLeadStage}
              onUpdateLeadCounselor={handleUpdateLeadCounselor}
              onDeleteLead={handleDeleteLead}
              onBulkDeleteLeads={handleBulkDeleteLeads}
              searchQuery={searchQuery}
              courses={courses}
              onAddCourse={handleAddCourse}
              currentUser={currentUser}
              onAddLead={handleAddLead}
              employees={employees}
              onUpdateLeadFee={handleUpdateLeadFee}
            />
          )}




          {activeTab === 'applications' && (
            <ApplicationsManager
              courses={courses}
              onAddCourse={handleAddCourse}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesManager
              employees={employees}
              onOpenAddEmployee={() => setIsAddEmployeeOpen(true)}
              onDeleteEmployee={handleDeleteEmployee}
              currentUser={currentUser}
              activityLogs={activityLogs}
              leads={leads}
              tasks={tasks}
              onUpdatePassword={handlePasswordChange}
              onUpdateEmployee={handleUpdateEmployeeProfile}
              searchQuery={searchQuery}
              attendanceRecords={attendanceRecords}
              onSaveAttendance={handleSaveAttendance}
            />
          )}


          {activeTab === 'vault' && (
            <StudentVault />
          )}

          {activeTab === 'tasks' && (
            <TasksManager
              tasks={tasks}
              setTasks={handleUpdateTasks}
              logActivity={logActivity}
              counselors={employees}
              searchQuery={searchQuery}
              currentUser={currentUser}
            />
          )}


          {activeTab === 'meta_connectors' && (
            <MetaLeadConnectors
              leads={leads}
              onAddLead={handleAddLead}
              counselors={employees}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              employees={employees}
              leads={leads}
            />
          )}

          {activeTab === 'attendance' && (
            <div style={{ padding: '2rem' }}>
              <StaffAttendanceCalendar
                employees={employees}
                attendanceRecords={attendanceRecords}
                onSaveAttendance={handleSaveAttendance}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === 'documents' && (
            <DocumentUploadManager
              currentUser={currentUser}
              employees={employees}
              documents={documents}
              setDocuments={setDocuments}
            />
          )}

          {activeTab === 'employee_settings' && (
            <EmployeeSettingsManager
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              employees={employees}
              onUpdateEmployee={handleUpdateEmployeeProfile}
            />
          )}



        </main>
      </div>

      {/* Modals & Drawers */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateStage={handleUpdateLeadStage}
          onUpdateCounselor={handleUpdateLeadCounselor}
          onAddNote={handleAddNote}
          onDeleteLead={handleDeleteLead}
          onUpdateLeadNotes={handleUpdateLeadNotes}
          onUpdateLeadProfile={handleUpdateLeadProfile}
          employees={employees}
          currentUser={currentUser}
          courses={courses}
        />
      )}


      {isAddLeadOpen && (
        <AddLeadModal
          onClose={() => setIsAddLeadOpen(false)}
          onAddLead={handleAddLead}
          counselors={employees}
          courses={courses}
          onAddCourse={handleAddCourse}
          currentUser={currentUser}
        />
      )}


      {isAddEmployeeOpen && (
        <AddEmployeeModal
          onClose={() => setIsAddEmployeeOpen(false)}
          onAddEmployee={handleAddEmployee}
        />
      )}
    </div>
  );
}


