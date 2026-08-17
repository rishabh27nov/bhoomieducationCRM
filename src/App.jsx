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

import AddLeadModal from './components/AddLeadModal';
import AddEmployeeModal from './components/AddEmployeeModal';

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
    } catch {
      return DEFAULT_COURSES;
    }
  });

  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('lakshya_leads');
      let parsed = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem('lakshya_employees');
      let parsed = saved ? JSON.parse(saved) : COUNSELORS;
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure standard counselors exist if missing
        COUNSELORS.forEach((c) => {
          if (!parsed.some((e) => e && isCounselorMatch(e.name, c.name))) {
            parsed.push(c);
          }
        });
        return parsed;
      }
      return COUNSELORS;
    } catch {
      return COUNSELORS;
    }
  });



  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('lakshya_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [activityLogs, setActivityLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('lakshya_activities');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });


  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('lakshya_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('lakshya_attendance');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

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
    localStorage.setItem('lakshya_attendance', JSON.stringify(updated));
    logActivity('Staff Attendance Updated', `Staff marked/updated attendance register for date ${dateStr}`);
    broadcastStateSync({ attendanceRecords: updated });
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

  // Central Database API Sync Engine (Supports Localhost & Cloud Serverless Sync)
  const syncWithCentralDB = async () => {
    try {
      // Try local server or cloud API endpoint
      const apiEndpoint = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api/data'
        : '/api/data';

      const res = await fetch(apiEndpoint);
      if (res.ok) {
        const db = await res.json();
        if (db.leads && Array.isArray(db.leads) && db.leads.length > 0) setLeads(db.leads);
        if (db.employees && Array.isArray(db.employees) && db.employees.length > 0) setEmployees(db.employees);
        if (db.tasks && Array.isArray(db.tasks) && db.tasks.length > 0) setTasks(db.tasks);
        if (db.courses && Array.isArray(db.courses) && db.courses.length > 0) setCourses(db.courses);
        if (db.activityLogs) setActivityLogs(db.activityLogs);
        if (db.notifications) setNotifications(db.notifications);
        if (db.attendanceRecords && typeof db.attendanceRecords === 'object') {
          setAttendanceRecords((prev) => {
            const merged = { ...prev };
            Object.keys(db.attendanceRecords).forEach((dStr) => {
              merged[dStr] = {
                ...(prev[dStr] || {}),
                ...(db.attendanceRecords[dStr] || {})
              };
            });
            return merged;
          });
        }
      }
    } catch {
      // Offline fallback to localStorage
    }
  };

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
        ...override
      };
      const apiEndpoint = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api/data'
        : '/api/data';

      await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Offline fallback
    }
  };


  // Poll Central DB every 1.5s so all browsers stay 100% in sync
  useEffect(() => {
    syncWithCentralDB();
    const dbInterval = setInterval(syncWithCentralDB, 1500);
    return () => clearInterval(dbInterval);
  }, []);

  // Sync to Central DB on state changes
  useEffect(() => {
    saveToCentralDB();
  }, [courses, employees, leads, tasks, activityLogs, notifications, attendanceRecords]);

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
    setEmployees(employees.map(e => e.id === empId ? { ...e, ...updatedFields } : e));

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
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage: newStage, lastContact: 'Just now' } : l));
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
    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const noteEntry = `\n\n[Log - ${timeStamp}]: ${noteText}`;
    const targetLead = leads.find((l) => l.id === leadId);

    setLeads(leads.map(l => l.id === leadId ? { ...l, notes: l.notes + noteEntry } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, notes: prev.notes + noteEntry }));
    }
    if (targetLead) {
      logActivity(
        'Note Added to Lead',
        `Added note to ${targetLead.name}: "${noteText}"`
      );
    }
  };

  // Handle counselor reassignment
  const handleUpdateLeadCounselor = (leadId, newCounselor) => {
    const targetLead = leads.find((l) => l.id === leadId);
    setLeads(leads.map(l => l.id === leadId ? { ...l, counselor: newCounselor } : l));
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

  // Handle direct notes update/edit/delete
  const handleUpdateLeadNotes = (leadId, newNotesText) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, notes: newNotesText } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, notes: newNotesText }));
    }
    logActivity('Lead Notes Modified', `Edited/cleared notes for lead ${leadId}`);
  };


  // Handle add lead
  // Handle add lead (Admin action only)
  const handleAddLead = (newLeadData) => {
    if (currentUser?.role !== 'Admin') {
      alert('Permission Denied: Only Admin has authority to create new student enquiries.');
      return;
    }
    setLeads([newLeadData, ...leads]);
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
  };

  // Handle add employee (Admin action only)
  const handleAddEmployee = (newEmployeeData) => {
    if (currentUser?.role !== 'Admin') {
      alert('Permission Denied: Only Admin has authority to create new employee IDs.');
      return;
    }
    setEmployees([newEmployeeData, ...employees]);
    logActivity(
      'New Employee ID Created',
      `Admin created new employee ID for ${newEmployeeData.name} with Role "${newEmployeeData.role}"`
    );
  };


  // Handle delete lead
  const handleDeleteLead = (leadId) => {
    const targetLead = leads.find((l) => l.id === leadId);
    setLeads(leads.filter(l => l.id !== leadId));
    if (targetLead) {
      logActivity('Lead Deleted', `Deleted lead record ${targetLead.name} (${targetLead.id})`);
    }
  };

  // Handle bulk delete leads (Admin power)
  const handleBulkDeleteLeads = (leadIds) => {
    if (!Array.isArray(leadIds) || leadIds.length === 0) return;
    const idsSet = new Set(leadIds);
    setLeads((prev) => prev.filter((l) => !idsSet.has(l.id)));
    logActivity('Bulk Leads Deleted', `Admin deleted ${leadIds.length} student enquiries`);
  };


  // Handle delete employee
  const handleDeleteEmployee = (empId) => {
    const targetEmp = employees.find((e) => e.id === empId);
    setEmployees(employees.filter(e => e.id !== empId));
    if (targetEmp) {
      logActivity('Employee Deleted', `Deleted employee ID for ${targetEmp.name}`);
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
              setTasks={setTasks}
              logActivity={logActivity}
              counselors={employees}
              searchQuery={searchQuery}
              currentUser={currentUser}
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
          employees={employees}
        />
      )}


      {isAddLeadOpen && (
        <AddLeadModal
          onClose={() => setIsAddLeadOpen(false)}
          onAddLead={handleAddLead}
          counselors={employees}
          courses={courses}
          onAddCourse={handleAddCourse}
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


