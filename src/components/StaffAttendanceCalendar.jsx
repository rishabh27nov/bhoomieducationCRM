import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  FileText,
  Filter,
  Download
} from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';
import { isCounselorMatch } from '../data/mockData';

export default function StaffAttendanceCalendar({
  employees = [],
  attendanceRecords = {},
  onSaveAttendance,
  currentUser = { role: 'Admin' }
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Date Range & Specific Employee PDF Filter state
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [empFilter, setEmpFilter] = useState('ALL');

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Institute';

  const handleExportAttendancePDF = () => {
    // Collect all dates in range fromDate to toDate
    const dates = [];
    const curr = new Date(fromDate);
    const end = new Date(toDate);

    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    const rows = [];
    let presentCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;

    const targetStaffList = isAdmin ? employees : displayEmployees;
    const activeEmpFilter = isAdmin ? empFilter : (displayEmployees[0]?.id || 'ALL');

    dates.forEach((dStr) => {
      const recForDay = attendanceRecords[dStr] || (dStr === selectedDate ? dailyStatus : null);
      if (recForDay) {
        targetStaffList.forEach((emp) => {
          if (activeEmpFilter === 'ALL' || activeEmpFilter === emp.id) {
            const entry = recForDay[emp.id] || { status: 'Present', inTime: '09:30 AM', remarks: '' };

            if (entry.status === 'Present') presentCount++;
            else if (entry.status === 'Absent') absentCount++;
            else if (entry.status === 'Half Day') halfDayCount++;
            else if (entry.status === 'On Leave') leaveCount++;

            rows.push([
              dStr,
              emp.name,
              emp.role,
              entry.status === 'Present' ? '🟢 Present' : entry.status === 'Absent' ? '🔴 Absent' : entry.status === 'Half Day' ? '🟡 Half Day' : '🔵 On Leave',
              entry.inTime || '09:30 AM',
              entry.remarks || '-'
            ]);
          }
        });
      }
    });

    if (rows.length === 0) {
      alert(`No attendance records found for date range ${fromDate} to ${toDate}.`);
      return;
    }

    const totalDays = rows.length;
    const rate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
    const selectedEmpName = (!isAdmin && displayEmployees[0])
      ? displayEmployees[0].name
      : (empFilter === 'ALL' ? 'All Staff Members' : employees.find(e => e.id === empFilter)?.name || empFilter);

    const summaryBoxHtml = `
      <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 110px; padding: 10px 14px; background-color: #f0fdf4; border: 1px solid #b7e4c7; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: #166534;">🟢 Total Present</div>
          <div style="font-size: 18px; font-weight: bold; color: #15803d; margin-top: 2px;">${presentCount} Days</div>
        </div>

        <div style="flex: 1; min-width: 110px; padding: 10px 14px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: #991b1b;">🔴 Total Absent</div>
          <div style="font-size: 18px; font-weight: bold; color: #dc2626; margin-top: 2px;">${absentCount} Days</div>
        </div>

        <div style="flex: 1; min-width: 110px; padding: 10px 14px; background-color: #fffbe6; border: 1px solid #fef08a; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: #854d0e;">🟡 Half Day</div>
          <div style="font-size: 18px; font-weight: bold; color: #d97706; margin-top: 2px;">${halfDayCount} Days</div>
        </div>

        <div style="flex: 1; min-width: 110px; padding: 10px 14px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: #1e40af;">🔵 On Leave</div>
          <div style="font-size: 18px; font-weight: bold; color: #2563eb; margin-top: 2px;">${leaveCount} Days</div>
        </div>

        <div style="flex: 1; min-width: 110px; padding: 10px 14px; background-color: #f8faf9; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: #334155;">📊 Attendance Rate</div>
          <div style="font-size: 18px; font-weight: bold; color: #0c2017; margin-top: 2px;">${rate}%</div>
        </div>
      </div>
    `;

    const title = `Attendance Report (${selectedEmpName}) - ${fromDate} to ${toDate}`;
    const columns = ['Date', 'Employee Name', 'Role', 'Status', 'Check-In Time', 'Remarks / Notes'];

    exportToPDF(title, columns, rows, `Attendance_Report_${selectedEmpName.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.pdf`, summaryBoxHtml);
  };



  // Get or initialize attendance for the selected date
  const [dailyStatus, setDailyStatus] = useState(() => {
    const existing = attendanceRecords && attendanceRecords[todayStr];
    const initial = {};
    employees.forEach((emp) => {
      initial[emp.id] = (existing && existing[emp.id]) || {
        status: 'Present',
        inTime: '09:30 AM',
        remarks: ''
      };
    });
    return initial;
  });

  // Keep dailyStatus in 100% sync with parent attendanceRecords prop & selectedDate for ALL staff
  React.useEffect(() => {
    const recordForDate = attendanceRecords && attendanceRecords[selectedDate];
    const cleaned = {};
    employees.forEach((emp) => {
      cleaned[emp.id] = (recordForDate && recordForDate[emp.id]) || {
        status: 'Present',
        inTime: '09:30 AM',
        remarks: ''
      };
    });
    setDailyStatus(cleaned);
  }, [attendanceRecords, selectedDate, employees]);

  // Multi-Tab & Local Event Listener for Instant Real-Time Attendance Sync
  React.useEffect(() => {
    const syncFromLocalStorage = () => {
      try {
        const saved = localStorage.getItem('lakshya_attendance');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed[selectedDate]) {
            const recordForDate = parsed[selectedDate];
            const cleaned = {};
            employees.forEach((emp) => {
              cleaned[emp.id] = recordForDate[emp.id] || {
                status: 'Present',
                inTime: '09:30 AM',
                remarks: ''
              };
            });
            setDailyStatus(cleaned);
          }
        }
      } catch {}
    };

    window.addEventListener('lakshya_attendance_updated', syncFromLocalStorage);
    window.addEventListener('storage', syncFromLocalStorage);

    return () => {
      window.removeEventListener('lakshya_attendance_updated', syncFromLocalStorage);
      window.removeEventListener('storage', syncFromLocalStorage);
    };
  }, [selectedDate, employees]);

  // When selectedDate changes, load existing records or populate defaults
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  // Helper to check if an employee object matches current logged in user
  const isEmployeeSelf = (emp) => {
    if (!currentUser) return false;
    if (currentUser.id && emp.id === currentUser.id) return true;
    return isCounselorMatch(emp.name, currentUser.name);
  };

  // Filtered employees to display: Admin/Institute sees all, Non-Admin sees ONLY their own profile
  const visibleEmployees = isAdmin
    ? employees
    : employees.filter((emp) => isEmployeeSelf(emp));

  // Fallback virtual employee for current user if not matched in counselors array
  const displayEmployees = (!isAdmin && visibleEmployees.length === 0 && currentUser)
    ? [{
        id: (employees.find(e => isCounselorMatch(e.name, currentUser.name))?.id) || currentUser.id || `EMP-${currentUser.name ? currentUser.name.replace(/\s+/g, '').toUpperCase() : 'SELF'}`,
        name: currentUser.name || 'Current Staff',
        phone: currentUser.phone || '',
        role: currentUser.role || 'Employee',
        avatar: currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      }]
    : visibleEmployees;

  // Status Change Handler (Self marking enabled for employees!)
  const handleStatusToggle = (empId, status) => {
    const targetEmp = employees.find(e => e.id === empId) || displayEmployees.find(e => e.id === empId);
    const canEdit = isAdmin || (targetEmp && isEmployeeSelf(targetEmp));

    if (!canEdit) {
      alert('Permission Denied: You can only update your own attendance.');
      return;
    }

    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const updated = {
      ...dailyStatus,
      [empId]: {
        ...dailyStatus[empId],
        status,
        inTime: dailyStatus[empId]?.inTime || currentTime,
        selfMarked: true,
        markedAt: currentTime,
        markedBy: targetEmp?.name || currentUser?.name || 'Employee'
      }
    };

    setDailyStatus(updated);

    // Auto-save immediately so Admin/Institute gets real-time update automatically
    if (onSaveAttendance) {
      onSaveAttendance(selectedDate, updated);
    }

    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  // InTime Change Handler
  const handleInTimeChange = (empId, inTime) => {
    const targetEmp = employees.find(e => e.id === empId) || displayEmployees.find(e => e.id === empId);
    const canEdit = isAdmin || (targetEmp && isEmployeeSelf(targetEmp));
    if (!canEdit) return;

    const updated = {
      ...dailyStatus,
      [empId]: {
        ...dailyStatus[empId],
        inTime
      }
    };
    setDailyStatus(updated);

    if (onSaveAttendance) {
      onSaveAttendance(selectedDate, updated);
    }
  };

  // Remarks Change Handler
  const handleRemarksChange = (empId, remarks) => {
    const targetEmp = employees.find(e => e.id === empId) || displayEmployees.find(e => e.id === empId);
    const canEdit = isAdmin || (targetEmp && isEmployeeSelf(targetEmp));
    if (!canEdit) return;

    const updated = {
      ...dailyStatus,
      [empId]: {
        ...dailyStatus[empId],
        remarks
      }
    };
    setDailyStatus(updated);

    if (onSaveAttendance) {
      onSaveAttendance(selectedDate, updated);
    }
  };

  // 1-Click Mark All Present (Admin Only)
  const handleMarkAllPresent = () => {
    if (!isAdmin) {
      alert('Permission Denied: Only Admin can mark all staff attendance.');
      return;
    }
    const updated = {};
    employees.forEach((emp) => {
      updated[emp.id] = {
        status: 'Present',
        inTime: '09:30 AM',
        remarks: dailyStatus[emp.id]?.remarks || 'Marked Present'
      };
    });
    setDailyStatus(updated);

    if (onSaveAttendance) {
      onSaveAttendance(selectedDate, updated);
    }
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  // Save Attendance Register
  const handleSave = () => {
    if (onSaveAttendance) {
      onSaveAttendance(selectedDate, dailyStatus);
    }
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  // Calculate Summary Counts for Selected Date accurately based on target staff
  const targetStaffList = isAdmin ? employees : displayEmployees;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalHalfDay = 0;
  let totalLeave = 0;

  targetStaffList.forEach((emp) => {
    const st = dailyStatus[emp.id]?.status || 'Present';
    if (st === 'Present') totalPresent++;
    else if (st === 'Absent') totalAbsent++;
    else if (st === 'Half Day') totalHalfDay++;
    else if (st === 'On Leave') totalLeave++;
  });

  const totalStaffCount = targetStaffList.length;
  const attendancePercentage = totalStaffCount > 0 ? Math.round((totalPresent / totalStaffCount) * 100) : 0;

  // Change Date Shortcuts (Prev/Next)
  const shiftDate = (days) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    const formatted = cur.toISOString().split('T')[0];
    handleDateChange(formatted);
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Date Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarIcon size={24} color="var(--color-brand-emerald)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Staff Daily Attendance Register & Calendar
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Select any calendar date to record, view, and save daily staff attendance (Admin Control)
          </p>
        </div>

        {/* Date Selector Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.6rem' }}
            onClick={() => shiftDate(-1)}
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="form-input"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', width: '160px' }}
          />

          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.6rem' }}
            onClick={() => shiftDate(1)}
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>

          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            onClick={() => handleDateChange(todayStr)}
          >
            Today
          </button>
        </div>
      </div>

      {/* Attendance Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#f0fdf4', border: '1px solid #b7e4c7' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>🟢 Present Today</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
            {totalPresent} / {totalStaffCount} ({attendancePercentage}%)
          </div>
        </div>

        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}>🔴 Absent</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
            {totalAbsent} Staff
          </div>
        </div>

        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fffbe6', border: '1px solid #fef08a' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#854d0e' }}>🟡 Half Day</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
            {totalHalfDay} Staff
          </div>
        </div>

        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>🔵 On Leave</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
            {totalLeave} Staff
          </div>
        </div>
      </div>

      {/* Date Range & Specific Employee Attendance PDF Export Panel */}
      <div
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#f8faf9',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-brand-dark)' }}>
          <FileText size={18} color="var(--color-brand-emerald)" />
          <span>📄 Date Range Attendance Report & PDF Exporter</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* From Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>From Date:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="form-input"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: '150px' }}
            />
          </div>

          {/* To Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>To Date:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="form-input"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: '150px' }}
            />
          </div>

          {/* Employee Selection Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Select Employee / Filter:</label>
            <select
              value={isAdmin ? empFilter : (displayEmployees[0]?.id || 'ALL')}
              onChange={(e) => isAdmin && setEmpFilter(e.target.value)}
              disabled={!isAdmin}
              className="form-select"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                minWidth: '200px',
                backgroundColor: !isAdmin ? '#f1f5f9' : '#ffffff',
                color: !isAdmin ? '#475569' : 'inherit',
                cursor: !isAdmin ? 'not-allowed' : 'pointer'
              }}
            >
              {isAdmin ? (
                <>
                  <option value="ALL">👥 All Employees ({employees.length})</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      👤 {emp.name} ({emp.role})
                    </option>
                  ))}
                </>
              ) : (
                displayEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} ({emp.role})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Download PDF Button */}
          <div style={{ marginTop: 'auto' }}>
            <button
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#b91c1c',
                borderColor: '#fecaca',
                backgroundColor: '#fef2f2',
                fontWeight: 700
              }}
              onClick={handleExportAttendancePDF}
              title="Download Custom Date Range PDF Attendance Report"
            >
              <Download size={16} /> Download Attendance PDF Report
            </button>
          </div>
        </div>
      </div>


      {/* Quick Self Check-In Card for Employees */}
      {!isAdmin && (
        <div style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #1b4332 0%, #081c15 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 15px rgba(27, 67, 50, 0.3)',
          border: '1px solid #52b788'
        }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={20} color="#52b788" />
              Welcome, {currentUser?.name || 'Employee'}! Mark Your Attendance ({selectedDate})
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b7e4c7', marginTop: '0.25rem' }}>
              Your attendance status automatically syncs with Admin in real-time.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const selfEmp = displayEmployees[0];
                if (selfEmp) handleStatusToggle(selfEmp.id, 'Present');
              }}
              style={{ backgroundColor: '#52b788', color: '#081c15', fontWeight: 800, padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
            >
              🟢 Mark Present (Check-In)
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => {
                const selfEmp = displayEmployees[0];
                if (selfEmp) handleStatusToggle(selfEmp.id, 'Half Day');
              }}
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fef08a', fontWeight: 700, padding: '0.55rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid #fef08a', cursor: 'pointer' }}
            >
              🟡 Half Day
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => {
                const selfEmp = displayEmployees[0];
                if (selfEmp) handleStatusToggle(selfEmp.id, 'On Leave');
              }}
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#93c5fd', fontWeight: 700, padding: '0.55rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid #93c5fd', cursor: 'pointer' }}
            >
              🔵 On Leave
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Attendance List for <span style={{ color: 'var(--color-brand-emerald)' }}>📅 {selectedDate}</span>:
        </div>

        {isAdmin ? (
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803d', borderColor: '#b7e4c7' }}
              onClick={handleMarkAllPresent}
              title="1-Click Mark All Employees Present"
            >
              <CheckCheck size={16} /> Mark All Present
            </button>

            <button
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={handleSave}
            >
              <Save size={16} /> Save Register
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={16} /> Live Sync: Attendance updates automatically to Admin register
          </div>
        )}
      </div>

      {savedSuccessMsg && (
        <div style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#f0fdf4', border: '1px solid #b7e4c7', color: '#15803d', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> Attendance updated successfully! Synced with Central Admin Register.
        </div>
      )}

      {/* Staff Attendance Grid Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="crm-table">
          <thead>
            <tr>
              <th>Employee Details</th>
              <th>Role</th>
              <th>Attendance Status</th>
              <th>Check-In Time</th>
              <th>Remarks / Field Notes</th>
              <th style={{ textAlign: 'center' }}>Submission Status</th>
            </tr>
          </thead>
          <tbody>
            {displayEmployees.map((emp) => {
              const rec = dailyStatus[emp.id] || { status: 'Present', inTime: '09:30 AM', remarks: '' };
              const canEdit = isAdmin || isEmployeeSelf(emp);

              return (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={emp.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                        alt={emp.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {emp.id} {emp.phone ? `• ${emp.phone}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`badge ${emp.role === 'Manager' ? 'badge-manager' : 'badge-employee'}`}>
                      {emp.role}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(emp.id, 'Present')}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: canEdit ? 'pointer' : 'default',
                          backgroundColor: rec.status === 'Present' ? '#22c55e' : '#f1f5f9',
                          color: rec.status === 'Present' ? '#ffffff' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🟢 Present
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusToggle(emp.id, 'Absent')}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: canEdit ? 'pointer' : 'default',
                          backgroundColor: rec.status === 'Absent' ? '#ef4444' : '#f1f5f9',
                          color: rec.status === 'Absent' ? '#ffffff' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🔴 Absent
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusToggle(emp.id, 'Half Day')}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: canEdit ? 'pointer' : 'default',
                          backgroundColor: rec.status === 'Half Day' ? '#f59e0b' : '#f1f5f9',
                          color: rec.status === 'Half Day' ? '#ffffff' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🟡 Half Day
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusToggle(emp.id, 'On Leave')}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: canEdit ? 'pointer' : 'default',
                          backgroundColor: rec.status === 'On Leave' ? '#3b82f6' : '#f1f5f9',
                          color: rec.status === 'On Leave' ? '#ffffff' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🔵 On Leave
                      </button>
                    </div>
                  </td>

                  <td>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={rec.inTime || '09:30 AM'}
                      onChange={(e) => handleInTimeChange(emp.id, e.target.value)}
                      className="form-input"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '100px' }}
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="Add remarks..."
                      value={rec.remarks || ''}
                      onChange={(e) => handleRemarksChange(emp.id, e.target.value)}
                      className="form-input"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '100%', minWidth: '150px' }}
                    />
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {rec.selfMarked || rec.markedBy ? (
                      <span
                        className="badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#d8f3dc',
                          color: '#1b4332',
                          border: '1.5px solid #52b788',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: '0 2px 8px rgba(27, 67, 50, 0.15)'
                        }}
                        title={`Attendance marked & submitted at ${rec.markedAt || 'Today'}`}
                      >
                        <CheckCircle2 size={16} color="#1b4332" /> ✓ Marked ({rec.markedAt || 'Submitted'})
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: '#94a3b8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-md)'
                        }}
                        title="Employee has not submitted attendance yet"
                      >
                        <Clock size={14} color="#94a3b8" /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
