import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  Search,
  Trash2,
  Eye,
  ShieldCheck,
  Activity,
  FileSpreadsheet,
  FileText,
  Calendar as CalendarIcon
} from 'lucide-react';
import EmployeeProfileModal from './EmployeeProfileModal';
import StaffAttendanceCalendar from './StaffAttendanceCalendar';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { isCounselorMatch } from '../data/mockData';

export default function EmployeesManager({
  employees = [],
  onOpenAddEmployee,
  onDeleteEmployee,
  currentUser = { role: 'Admin' },
  activityLogs = [],
  leads = [],
  tasks = [],
  onUpdatePassword,
  onUpdateEmployee,
  searchQuery = '',
  attendanceRecords = {},
  onSaveAttendance
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState(null);
  const [activeViewMode, setActiveViewMode] = useState('directory'); // 'directory' or 'attendance'

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Institute';
  const queryText = (searchQuery || search).toLowerCase();


  const isEmployeeRole = currentUser?.role === 'Employee';

  const filteredEmployees = employees.filter(emp => {
    // Employee Role Restriction: Employee CANNOT view other staff accounts!
    if (isEmployeeRole && !isCounselorMatch(emp.name, currentUser?.name)) {
      return false;
    }
    const matchesSearch =
      !queryText ||
      emp.name.toLowerCase().includes(queryText) ||
      emp.email.toLowerCase().includes(queryText) ||
      emp.role.toLowerCase().includes(queryText) ||
      (emp.phone && emp.phone.includes(queryText));
    const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });



  const handleAddEmployeeClick = () => {
    if (!isAdmin) {
      alert('Permission Denied: Only Admin has the authority to create employee IDs / user accounts.');
      return;
    }
    onOpenAddEmployee();
  };

  const handleExportExcel = () => {
    const exportData = filteredEmployees.map((emp) => {
      const empAssignedLeads = leads.filter((l) => isCounselorMatch(l.counselor, emp.name));
      const activeCount = empAssignedLeads.length;
      const convertedCount = empAssignedLeads.filter(
        (l) => l.stage === 'Fee Paid & Enrolled' || l.stage === 'Admitted' || l.stage === 'Enrolled'
      ).length;
      const calcConversion = activeCount > 0 ? `${Math.round((convertedCount / activeCount) * 100)}%` : '0%';

      return {
        'Employee ID': emp.id,
        'Full Name': emp.name,
        'Role': emp.role,
        'Official Email': emp.email,
        'Phone Number': emp.phone || '',
        'Username': emp.username || emp.id,
        'Active Leads': activeCount,
        'Conversion Rate': calcConversion,
        'Status': emp.status || 'Active',
        'Joined Date': emp.joinedDate || ''
      };
    });
    exportToExcel(exportData, `Staff_Roster_Excel_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    const columns = ['ID', 'Name', 'Role', 'Email', 'Phone', 'Active Leads', 'Conversion', 'Status'];
    const rows = filteredEmployees.map((emp) => {
      const empAssignedLeads = leads.filter((l) => isCounselorMatch(l.counselor, emp.name));
      const activeCount = empAssignedLeads.length;
      const convertedCount = empAssignedLeads.filter(
        (l) => l.stage === 'Fee Paid & Enrolled' || l.stage === 'Admitted' || l.stage === 'Enrolled'
      ).length;
      const calcConversion = activeCount > 0 ? `${Math.round((convertedCount / activeCount) * 100)}%` : '0%';

      return [
        emp.id,
        emp.name,
        emp.role,
        emp.email,
        emp.phone || '',
        activeCount,
        calcConversion,
        emp.status || 'Active'
      ];
    });
    exportToPDF('Faculty & Staff Roster Report', columns, rows, 'Staff_Roster_Report.pdf');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Staff Directory & Employee Profile Control
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage Managers, Employees, view their sheet update history, and create user IDs & passwords (Admin Control)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803d', borderColor: '#b7e4c7', backgroundColor: '#f0fdf4' }}
            onClick={handleExportExcel}
            title="Download Staff Roster as Excel Sheet (.csv)"
          >
            <FileSpreadsheet size={16} /> Export Excel
          </button>

          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#b91c1c', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}
            onClick={handleExportPDF}
            title="Download PDF Roster Report"
          >
            <FileText size={16} /> Download PDF
          </button>

          <button
            className="btn btn-primary"
            onClick={handleAddEmployeeClick}
            style={{ opacity: isAdmin ? 1 : 0.7 }}
            title={isAdmin ? "Create New Employee ID" : "Only Admin can create IDs"}
          >
            <UserPlus size={18} /> Add New Employee / Create ID {!isAdmin && '(Admin Only)'}
          </button>
        </div>
      </div>

      {/* View Mode Toggle: Directory Cards vs Daily Attendance Register */}
      <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--color-brand-soft)', padding: '0.35rem', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
        <button
          onClick={() => setActiveViewMode('directory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: activeViewMode === 'directory' ? '#ffffff' : 'transparent',
            color: activeViewMode === 'directory' ? 'var(--color-brand-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: activeViewMode === 'directory' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Users size={16} /> Faculty & Staff Directory ({employees.length})
        </button>

        <button
          onClick={() => setActiveViewMode('attendance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: activeViewMode === 'attendance' ? '#ffffff' : 'transparent',
            color: activeViewMode === 'attendance' ? 'var(--color-brand-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: activeViewMode === 'attendance' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <CalendarIcon size={16} /> 📅 Daily Attendance Register & Calendar
        </button>
      </div>

      {/* Render Attendance Calendar View */}
      {activeViewMode === 'attendance' ? (
        <StaffAttendanceCalendar
          employees={employees}
          attendanceRecords={attendanceRecords}
          onSaveAttendance={onSaveAttendance}
          currentUser={currentUser}
        />
      ) : (
        <>

      <div className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search faculty name, role or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '200px' }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles ({employees.length})</option>
          <option value="Manager">Manager</option>
          <option value="Employee">Employee</option>
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Total Staff: <strong>{employees.length} Members</strong>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
        {filteredEmployees.map((emp) => {
          const empAssignedLeads = leads.filter(
            (l) => isCounselorMatch(l.counselor, emp.name)
          );
          const activeCount = empAssignedLeads.length;
          const convertedCount = empAssignedLeads.filter(
            (l) => l.stage === 'Fee Paid & Enrolled' || l.stage === 'Admitted' || l.stage === 'Enrolled'
          ).length;
          const calcConversion = activeCount > 0 ? `${Math.round((convertedCount / activeCount) * 100)}%` : '0%';

          return (

            <div
              key={emp.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: emp.role === 'Manager' ? '4px solid #f59e0b' : '4px solid var(--color-brand-emerald)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onClick={() => setSelectedEmployeeProfile({ employee: emp, initialTab: 'activities' })}
            >
              <div>
                {/* Avatar & Role Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-brand-emerald)' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {emp.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '3px', flexWrap: 'wrap' }}>
                        <span style={{ backgroundColor: 'var(--color-brand-soft)', color: 'var(--color-brand-primary)', fontSize: '0.72rem', fontWeight: 800, padding: '0.12rem 0.5rem', borderRadius: '6px', border: '1px solid #b7e4c7' }}>
                          ID: {emp.id}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: emp.role === 'Manager' ? '#d97706' : 'var(--color-brand-emerald)'
                        }}>
                          Role: {emp.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${emp.status === 'Active' ? 'badge-admitted' : 'badge-contacted'}`} style={{ fontSize: '0.7rem' }}>
                    {emp.status}
                  </span>
                </div>

                {/* Contact Info */}
                <div style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f8faf9',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-main)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={14} color="var(--color-brand-emerald)" />
                    <span>{emp.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} color="var(--color-brand-emerald)" />
                    <span>{emp.phone || '+91 98765 00000'}</span>
                  </div>
                </div>

                {/* Performance Stats (Dynamically synced with leads) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#e0f2fe', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600 }}>Active Leads</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>{activeCount}</div>
                  </div>

                  <div style={{ padding: '0.5rem', backgroundColor: '#dcfce7', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600 }}>Conversion</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>{calcConversion}</div>
                  </div>
                </div>
              </div>


            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                gap: '0.5rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => setSelectedEmployeeProfile({ employee: emp, initialTab: 'activities' })}
              >
                <Eye size={14} /> Profile
              </button>

              {isAdmin && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#d97706', borderColor: '#fef3c7', backgroundColor: '#fffbe6' }}
                  onClick={() => setSelectedEmployeeProfile({ employee: emp, initialTab: 'security' })}
                  title="Change Employee Password"
                >
                  🔑 Change Password
                </button>
              )}

              {isAdmin && (
                <button
                  className="btn-icon"
                  style={{ color: '#ef4444', padding: '0.25rem' }}
                  title="Delete Employee ID (Admin Only)"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete employee ${emp.name}?`)) {
                      onDeleteEmployee(emp.id);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}
      </div>
      </>
      )}

      {/* Employee Profile & History Modal */}
      {selectedEmployeeProfile && (
        <EmployeeProfileModal
          employee={selectedEmployeeProfile.employee}
          initialTab={selectedEmployeeProfile.initialTab || 'activities'}
          onClose={() => setSelectedEmployeeProfile(null)}
          activityLogs={activityLogs}
          leads={leads}
          tasks={tasks}
          onUpdatePassword={onUpdatePassword}
          onUpdateEmployee={onUpdateEmployee}
          currentUser={currentUser}
        />
      )}

    </div>
  );
}
