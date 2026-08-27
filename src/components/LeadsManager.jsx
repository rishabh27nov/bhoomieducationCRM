import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { PIPELINE_STAGES, getPipelineStagesForLead, isCounselorMatch } from '../data/mockData';
import {
  Search,
  Plus,
  Filter,
  Kanban,
  Table as TableIcon,
  Phone,
  Mail,
  MoreVertical,
  Star,
  BookOpen,
  Calendar,
  ChevronRight,
  UserCheck,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  X
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function LeadsManager({
  leads,
  onSelectLead,
  onOpenAddLead,
  onUpdateLeadStage,
  onUpdateLeadCounselor,
  onDeleteLead,
  onBulkDeleteLeads,
  searchQuery,
  courses = [],
  onAddCourse,
  currentUser = { role: 'Admin' },
  onAddLead,
  employees = [],
  onUpdateLeadFee
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const [stageFilter, setStageFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [counselorFilter, setCounselorFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL', 'FACEBOOK', 'INSTAGRAM', 'META_ALL'
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [showAddCoursePrompt, setShowAddCoursePrompt] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');

  const isAdmin = currentUser?.role === 'Admin';



  const todayStr = new Date().toISOString().split('T')[0];
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [importedRowsData, setImportedRowsData] = useState([]);
  const [selectedAssignCounselor, setSelectedAssignCounselor] = useState(employees[0]?.name || 'Rishabh yadav');
  const [customImportDate, setCustomImportDate] = useState(todayStr);

  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        'Name': 'Rohan Sharma',
        'contact no': '9876543210',
        'email': 'rohan.sharma@gmail.com',
        'courseapply': 'NEET Class 11',
        'current class': '10th Passed',
        'class 10%': '92.4%',
        'state': 'Uttar Pradesh'
      },
      {
        'Name': 'Ananya Patel',
        'contact no': '9812345678',
        'email': 'ananya.patel@gmail.com',
        'courseapply': 'JEE Main 12th',
        'current class': '11th Studying',
        'class 10%': '88.5%',
        'state': 'Bihar'
      }
    ];
    exportToExcel(sampleData, 'Student_Leads_Bulk_Upload_Template.csv');
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          alert('Selected file is empty or does not contain data rows.');
          return;
        }

        const rowsParsed = [];
        jsonRows.forEach((row) => {
          const getVal = (keyNames) => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
              for (const target of keyNames) {
                const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (cleanKey === cleanTarget) {
                  return row[key] ? row[key].toString().trim() : '';
                }
              }
            }
            return '';
          };

          const name = getVal(['name', 'student name', 'full name', 'candidate name']);
          const phone = getVal(['contact no', 'contactno', 'contact', 'phone number', 'phone', 'mobile', 'mobile number']);
          const email = getVal(['email', 'email address']);
          const courseapply = getVal(['courseapply', 'course apply', 'target course', 'course']) || 'NEET Class 11';
          const currentClass = getVal(['current class', 'currentclass', 'class']);
          const class10Perc = getVal(['class 10%', 'class 10 %', '10th %', '10th percentage', 'class10%']);
          const state = getVal(['state', 'location']);
          
          const counselor = getVal(['counselor', 'assigned counselor', 'assigned to']);
          const stage = getVal(['stage', 'status']) || 'New Enquiry';
          const feeBudget = getVal(['fee budget', 'budget', 'feebudget']) || 'N/A';
          const dateInRow = getVal(['date', 'created at', 'createddate']);
          const leadTypeInRow = getVal(['leadtype', 'type', 'segment', 'category', 'b2b2c', 'b2b/b2c', 'b2b b2c', 'b2b']);
          const schoolNameInRow = getVal(['school name', 'schoolname', 'school', 'institution', 'college']);

          // Construct notes including extra fields if available
          let notesList = [];
          if (currentClass) notesList.push(`Current Class: ${currentClass}`);
          if (class10Perc) notesList.push(`10th Marks: ${class10Perc}`);
          if (state) notesList.push(`State: ${state}`);
          const notes = notesList.length > 0 ? notesList.join(' | ') : 'Uploaded via Bulk Excel/CSV';

          if (name) {
            rowsParsed.push({
              name,
              phone: phone || 'N/A',
              email: email || 'N/A',
              targetCourse: courseapply,
              currentClass,
              class10Perc,
              state,
              leadType: (leadTypeInRow && (leadTypeInRow.toUpperCase().includes('B2B2C') || leadTypeInRow.toUpperCase().includes('B2B'))) ? 'B2B2C' : 'B2C',
              schoolName: schoolNameInRow || '',
              batch: getVal(['batch']) || `Batch (${courseapply})`,
              stage,
              score: parseInt(getVal(['score'])) || 85,
              counselor,
              leadSource: getVal(['lead source', 'source']) || 'CSV Bulk Upload',
              notes,
              feeBudget,
              rowDate: dateInRow
            });
          }
        });

        if (rowsParsed.length === 0) {
          alert('No valid student entries found in Excel file. Please ensure column headers include "Student Name" or "Name".');
          return;
        }

        setImportedRowsData(rowsParsed);
        setShowAssignModal(true);
      } catch (err) {
        console.error('Error parsing excel:', err);
        alert('Could not read Excel file. Please upload a valid .xlsx or .csv sheet.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const [selectedLeadType, setSelectedLeadType] = useState('B2C');
  const [customSchoolName, setCustomSchoolName] = useState('');

  const handleConfirmImportWithCounselor = () => {
    if (!importedRowsData.length || !onAddLead) return;

    const formattedRows = importedRowsData.map((row, index) => {
      const finalCounselor = selectedAssignCounselor || row.counselor || employees[0]?.name || 'Rishabh yadav';
      const finalDate = customImportDate || row.rowDate || todayStr;
      const finalSchoolName = customSchoolName.trim() || row.schoolName || '';

      // Append school name to notes if available
      let updatedNotes = row.notes || '';
      if (finalSchoolName && !updatedNotes.includes(finalSchoolName)) {
        updatedNotes = updatedNotes ? `${updatedNotes} | School: ${finalSchoolName}` : `School: ${finalSchoolName}`;
      }

      return {
        id: `LKD-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`,
        ...row,
        leadType: selectedLeadType || row.leadType || 'B2C',
        schoolName: finalSchoolName,
        counselor: finalCounselor,
        createdAt: finalDate,
        notes: updatedNotes,
        lastContact: 'Just now'
      };
    });

    onAddLead(formattedRows);

    alert(`🎉 Successfully imported ${formattedRows.length} [${selectedLeadType}] student enquiries on Date [${customImportDate}] and assigned to Employee [${selectedAssignCounselor}]!`);
    setShowAssignModal(false);
    setImportedRowsData([]);
    setCustomSchoolName('');
  };


  const handleAddNewCourse = (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Permission Denied: Only Admin has authority to add new courses.');
      return;
    }
    if (!newCourseName.trim()) return;
    if (onAddCourse) {
      onAddCourse(newCourseName.trim());
      setCourseFilter(newCourseName.trim());
    }
    setNewCourseName('');
    setShowAddCoursePrompt(false);
  };

  // Extract unique counselor names for filter dropdown
  const uniqueCounselorNames = Array.from(
    new Set([
      ...employees.map((e) => e.name),
      ...leads.map((l) => l.counselor)
    ])
  ).filter(Boolean);

  const isEmployeeRole = currentUser?.role === 'Employee';

  useEffect(() => {
    if (isEmployeeRole) {
      setCounselorFilter('ALL');
    }
  }, [currentUser?.name, isEmployeeRole]);

  const [segmentFilter, setSegmentFilter] = useState('ALL'); // 'ALL', 'B2C', 'B2B2C'
  const [schoolFilter, setSchoolFilter] = useState('ALL');

  // Extract unique school names from leads for filter dropdown
  const uniqueSchoolNames = Array.from(
    new Set(leads.map((l) => l.schoolName).filter(Boolean))
  );

  // Filter Leads
  const filteredLeads = leads.filter(lead => {
    // Employee Role Restriction: Employee CANNOT view any other counselor's leads!
    if (isEmployeeRole && !isCounselorMatch(lead.counselor, currentUser?.name)) {
      return false;
    }

    const matchesSearch =
      !searchQuery ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.targetCourse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.schoolName && lead.schoolName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchQuery));

    const matchesStage = stageFilter === 'ALL' || lead.stage === stageFilter;
    const matchesCourse = courseFilter === 'ALL' || lead.targetCourse.includes(courseFilter);
    const matchesCounselor = isEmployeeRole || counselorFilter === 'ALL' || isCounselorMatch(lead.counselor, counselorFilter);

    const matchesSegment =
      segmentFilter === 'ALL' ||
      (segmentFilter === 'B2B2C' && (lead.leadType === 'B2B2C' || lead.leadType === 'B2B' || (lead.leadSource && (lead.leadSource.toUpperCase().includes('B2B2C') || lead.leadSource.toUpperCase().includes('B2B'))))) ||
      (segmentFilter === 'B2C' && (lead.leadType !== 'B2B2C' && lead.leadType !== 'B2B' && (!lead.leadSource || (!lead.leadSource.toUpperCase().includes('B2B2C') && !lead.leadSource.toUpperCase().includes('B2B')))));

    const matchesSchool = schoolFilter === 'ALL' || (lead.schoolName && lead.schoolName === schoolFilter);

    let matchesSource = true;
    if (sourceFilter === 'FACEBOOK') {
      matchesSource = lead.source && lead.source.toLowerCase().includes('facebook');
    } else if (sourceFilter === 'INSTAGRAM') {
      matchesSource = lead.source && lead.source.toLowerCase().includes('instagram');
    } else if (sourceFilter === 'META_ALL') {
      matchesSource = lead.source && (lead.source.toLowerCase().includes('facebook') || lead.source.toLowerCase().includes('instagram') || lead.source.toLowerCase().includes('meta'));
    }

    return matchesSearch && matchesStage && matchesCourse && matchesCounselor && matchesSource && matchesSegment && matchesSchool;
  });


  // Bulk selection logic
  const isAllSelected = filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.includes(l.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleToggleSelect = (leadId) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handlePerformBulkDelete = () => {
    if (!isAdmin) {
      alert('Permission Denied: Only Admin can delete student enquiries.');
      return;
    }
    if (selectedLeadIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected student enquiries permanently?`)) {
      if (onBulkDeleteLeads) {
        onBulkDeleteLeads(selectedLeadIds);
      } else if (onDeleteLead) {
        selectedLeadIds.forEach((id) => onDeleteLead(id));
      }
      setSelectedLeadIds([]);
    }
  };


  const handleExportExcel = () => {
    const exportData = filteredLeads.map((l) => ({
      'Lead ID': l.id,
      'Student Name': l.name,
      'Email ID': l.email,
      'Phone Number': l.phone,
      'Target Course': l.targetCourse,
      'Batch': l.batch,
      'Stage Status': l.stage,
      'Counselor': l.counselor,
      'Source': l.leadSource,
      'Created Date': l.createdAt,
      'Fee Budget': l.feeBudget,
      'Notes': l.notes
    }));
    exportToExcel(exportData, `Student_Enquiries_Excel_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    const columns = ['ID', 'Student Name', 'Phone', 'Target Course', 'Stage Status', 'Counselor', 'Fee Budget'];
    const rows = filteredLeads.map((l) => [
      l.id,
      l.name,
      l.phone,
      l.targetCourse,
      l.stage,
      l.counselor,
      l.feeBudget
    ]);
    exportToPDF('Student Enquiries Report', columns, rows, 'Student_Enquiries_Report.pdf');
  };


  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Student Enquiries (NEET & JEE)
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage prospective student admission pipeline & counseling stages
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Export Buttons */}
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803d', borderColor: '#b7e4c7', backgroundColor: '#f0fdf4' }}
            onClick={handleExportExcel}
            title="Download Student Enquiries as Excel Sheet (.csv)"
          >
            <FileSpreadsheet size={16} /> Export Excel
          </button>

          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#b91c1c', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}
            onClick={handleExportPDF}
            title="Download PDF Report"
          >
            <FileText size={16} /> Download PDF
          </button>

          {/* View Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--color-brand-soft)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? 'var(--color-brand-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <TableIcon size={16} /> Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--color-brand-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'kanban' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Kanban size={16} /> Kanban Pipeline
            </button>
          </div>

          {isAdmin && (
            <>
              <button
                className="btn"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#15803d',
                  borderColor: '#b7e4c7',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
                onClick={handleDownloadSampleTemplate}
                title="Download CSV Format Sample File"
              >
                <Download size={16} /> Sample CSV Format
              </button>

              <button
                className="btn"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#15803d',
                  borderColor: '#b7e4c7',
                  backgroundColor: '#f0fdf4',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
                onClick={() => {
                  setImportedRowsData([]);
                  setShowAssignModal(true);
                }}
                title="Bulk Upload Excel / CSV Sheet"
              >
                <FileSpreadsheet size={16} /> Bulk Upload Excel / CSV
              </button>

              <button className="btn btn-primary" onClick={onOpenAddLead} title="Create New Student Enquiry (Admin Only)">
                <Plus size={18} /> New Student Enquiry
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Segment Filter (B2C vs B2B2C) */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px', fontWeight: 700, borderColor: segmentFilter !== 'ALL' ? 'var(--color-brand-emerald)' : undefined }}
          value={segmentFilter}
          onChange={(e) => {
            setSegmentFilter(e.target.value);
            if (e.target.value !== 'B2B2C') {
              setSchoolFilter('ALL');
            }
          }}
        >
          <option value="ALL">🏢 All Segments (B2B2C & B2C)</option>
          <option value="B2C">🎓 B2C Only</option>
          <option value="B2B2C">🏫 B2B2C Only</option>
        </select>

        {/* Dynamic School Filter (Shows when B2B2C is selected or when school records exist) */}
        {(segmentFilter === 'B2B2C' || (segmentFilter === 'ALL' && uniqueSchoolNames.length > 0)) && (
          <select
            className="form-select"
            style={{
              width: 'auto',
              minWidth: '180px',
              fontWeight: 700,
              backgroundColor: '#eff6ff',
              borderColor: schoolFilter !== 'ALL' ? '#2563eb' : '#bfdbfe',
              color: '#1d4ed8'
            }}
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
          >
            <option value="ALL">🏫 All Schools / Institutions ({uniqueSchoolNames.length})</option>
            {uniqueSchoolNames.map((sch) => (
              <option key={sch} value={sch}>
                📍 {sch}
              </option>
            ))}
          </select>
        )}

        {/* Stage Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="ALL">All Stages ({leads.length})</option>
          {PIPELINE_STAGES.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>

        {/* Course Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '170px' }}
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="ALL">All Courses ({courses.length})</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        {/* Counselor / Employee Target Filter */}
        {isEmployeeRole ? (
          <div style={{ padding: '0.45rem 0.85rem', backgroundColor: '#f0fdf4', border: '1px solid #b7e4c7', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-brand-emerald)' }} title="Employee Role: Access locked to own assigned student leads only">
            🔒 👤 My Assigned Leads Only ({currentUser?.name}) ({filteredLeads.length})
          </div>
        ) : (
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '200px', fontWeight: 700, borderColor: counselorFilter !== 'ALL' ? 'var(--color-brand-emerald)' : undefined }}
            value={counselorFilter}
            onChange={(e) => setCounselorFilter(e.target.value)}
          >
            <option value="ALL">👥 All Counselors ({leads.length} Leads)</option>
            {uniqueCounselorNames.map((cName) => {
              const count = leads.filter((l) => isCounselorMatch(l.counselor, cName)).length;
              return (
                <option key={cName} value={cName}>
                  👤 {cName} ({count} Leads)
                </option>
              );
            })}
          </select>
        )}

      </div>

      {/* Admin Quick Employee Cards Selection Bar */}
      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>👤 Filter / View Student Leads by Employee:</span>
            {counselorFilter !== 'ALL' && (
              <span
                style={{ fontSize: '0.75rem', color: '#b91c1c', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setCounselorFilter('ALL')}
              >
                Clear Filter (Show All)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
            {/* All Staff Card */}
            <div
              onClick={() => setCounselorFilter('ALL')}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: counselorFilter === 'ALL' ? 'var(--color-brand-primary)' : '#ffffff',
                color: counselorFilter === 'ALL' ? '#ffffff' : 'var(--text-main)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                minWidth: '150px',
                boxShadow: counselorFilter === 'ALL' ? 'var(--shadow-md)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>👥 All Counselors</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '1px' }}>Entire Database</div>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                backgroundColor: counselorFilter === 'ALL' ? '#ffffff' : 'var(--color-brand-soft)',
                color: counselorFilter === 'ALL' ? 'var(--color-brand-primary)' : 'var(--color-brand-emerald)'
              }}>
                {leads.length}
              </span>
            </div>

            {/* Individual Employee Cards */}
            {employees.map((emp) => {
              const count = leads.filter((l) => isCounselorMatch(l.counselor, emp.name)).length;
              const isSelected = isCounselorMatch(counselorFilter, emp.name);

              return (
                <div
                  key={emp.id}
                  onClick={() => setCounselorFilter(emp.name)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? '#1b4332' : '#ffffff',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    border: isSelected ? '2px solid #52b788' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    minWidth: '220px',
                    boxShadow: isSelected ? '0 4px 12px rgba(27, 67, 50, 0.25)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img
                        src={emp.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                        alt={emp.name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.7rem', color: isSelected ? '#b7e4c7' : 'var(--text-muted)' }}>{emp.role}</div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '9999px',
                      backgroundColor: isSelected ? '#52b788' : '#f1f5f9',
                      color: isSelected ? '#081c15' : '#475569'
                    }}>
                      {count}
                    </span>
                  </div>

                  {/* Direct Bulk Upload Button for this Employee */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAssignCounselor(emp.name);
                      setImportedRowsData([]);
                      setShowAssignModal(true);
                    }}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#f0fdf4',
                      color: isSelected ? '#ffffff' : '#15803d',
                      border: isSelected ? '1px solid rgba(255,255,255,0.4)' : '1px solid #b7e4c7',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      marginTop: '0.2rem'
                    }}
                    title={`Bulk Upload Excel Sheet directly to ${emp.name}`}
                  >
                    <FileSpreadsheet size={13} /> Bulk Upload Leads to {emp.name.split(' ')[0]}
                  </button>
                </div>
              );
            })}

            {/* Social Media Lead Filter Box */}
            <div
              style={{
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: sourceFilter !== 'ALL' ? 'rgba(24, 119, 242, 0.1)' : '#ffffff',
                border: sourceFilter !== 'ALL' ? '2px solid #1877F2' : '1px dashed #cbd5e1',
                minWidth: '240px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                boxShadow: sourceFilter !== 'ALL' ? '0 4px 12px rgba(24, 119, 242, 0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                  🌐 Social Media Ads
                </span>
                {sourceFilter !== 'ALL' && (
                  <span
                    onClick={() => setSourceFilter('ALL')}
                    style={{ fontSize: '0.7rem', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Clear Filter
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setSourceFilter(sourceFilter === 'FACEBOOK' ? 'ALL' : 'FACEBOOK')}
                  style={{
                    flex: 1,
                    padding: '0.3rem 0.4rem',
                    borderRadius: '6px',
                    border: sourceFilter === 'FACEBOOK' ? '2px solid #1877F2' : '1px solid #e2e8f0',
                    background: sourceFilter === 'FACEBOOK' ? '#1877F2' : '#f8fafc',
                    color: sourceFilter === 'FACEBOOK' ? '#ffffff' : '#334155',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  Facebook ({leads.filter(l => l.source && l.source.toLowerCase().includes('facebook')).length})
                </button>

                <button
                  type="button"
                  onClick={() => setSourceFilter(sourceFilter === 'INSTAGRAM' ? 'ALL' : 'INSTAGRAM')}
                  style={{
                    flex: 1,
                    padding: '0.3rem 0.4rem',
                    borderRadius: '6px',
                    border: sourceFilter === 'INSTAGRAM' ? '2px solid #E4405F' : '1px solid #e2e8f0',
                    background: sourceFilter === 'INSTAGRAM' ? 'linear-gradient(135deg, #833AB4, #E4405F)' : '#f8fafc',
                    color: sourceFilter === 'INSTAGRAM' ? '#ffffff' : '#334155',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  Instagram ({leads.filter(l => l.source && l.source.toLowerCase().includes('instagram')).length})
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Bulk Delete Action Bar when checkboxes are selected */}
      {selectedLeadIds.length > 0 && isAdmin && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1.5px solid #fca5a5',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontWeight: 800,
              fontSize: '0.9rem',
              color: '#991b1b',
              backgroundColor: '#fee2e2',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px'
            }}>
              {selectedLeadIds.length} Enquiry Selected
            </span>
            <span style={{ fontSize: '0.85rem', color: '#7f1d1d', fontWeight: 600 }}>
              Select lead checkboxes to delete single or multiple student enquiries at once.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem'
              }}
              onClick={() => {
                if (window.confirm(`⚠️ Warning: Are you sure you want to delete ${selectedLeadIds.length} selected lead(s)?`)) {
                  onBulkDeleteLeads(selectedLeadIds);
                  setSelectedLeadIds([]);
                }
              }}
            >
              <Trash2 size={16} /> Delete Selected ({selectedLeadIds.length}) Leads
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setSelectedLeadIds([])}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View 1: Table View */}
      {viewMode === 'table' && (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    title="Select All / Deselect All Enquiries"
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </th>
                <th>Student ID & Name</th>
                <th>Source</th>
                <th>Target Course & Batch</th>
                <th>Fee / Budget</th>
                <th>Pipeline Stage</th>
                <th>Counselor</th>
                <th>Lead Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} style={{ backgroundColor: selectedLeadIds.includes(lead.id) ? '#f0fdf4' : undefined }}>
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.includes(lead.id)}
                      onChange={() => handleToggleSelect(lead.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--color-brand-primary)', fontSize: '0.92rem', cursor: 'pointer' }} onClick={() => onSelectLead(lead)}>
                      {lead.name}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                      <Phone size={13} color="var(--color-brand-emerald)" />
                      <span>{lead.phone || 'N/A'}</span>
                    </div>

                    {lead.schoolName && (
                      <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '2px' }}>
                        🏫 {lead.schoolName}
                      </div>
                    )}
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: lead.leadType === 'B2B2C' || lead.leadType === 'B2B' || (lead.leadSource && (lead.leadSource.toUpperCase().includes('B2B2C') || lead.leadSource.toUpperCase().includes('B2B'))) ? '#eff6ff' : '#f0fdf4',
                        color: lead.leadType === 'B2B2C' || lead.leadType === 'B2B' || (lead.leadSource && (lead.leadSource.toUpperCase().includes('B2B2C') || lead.leadSource.toUpperCase().includes('B2B'))) ? '#1d4ed8' : '#15803d',
                        border: lead.leadType === 'B2B2C' || lead.leadType === 'B2B' || (lead.leadSource && (lead.leadSource.toUpperCase().includes('B2B2C') || lead.leadSource.toUpperCase().includes('B2B'))) ? '1px solid #bfdbfe' : '1px solid #b7e4c7'
                      }}>
                        {lead.leadType === 'B2B2C' || lead.leadType === 'B2B' || (lead.leadSource && (lead.leadSource.toUpperCase().includes('B2B2C') || lead.leadSource.toUpperCase().includes('B2B'))) ? '🏫 B2B2C' : '🎓 B2C'}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '12px',
                        backgroundColor: lead.source && (lead.source.toLowerCase().includes('facebook') || lead.source.toLowerCase().includes('instagram') || lead.source.toLowerCase().includes('meta'))
                          ? '#eff6ff'
                          : '#f8fafc',
                        color: lead.source && (lead.source.toLowerCase().includes('facebook') || lead.source.toLowerCase().includes('instagram') || lead.source.toLowerCase().includes('meta'))
                          ? '#1d4ed8'
                          : '#475569',
                        border: lead.source && (lead.source.toLowerCase().includes('facebook') || lead.source.toLowerCase().includes('instagram') || lead.source.toLowerCase().includes('meta'))
                          ? '1px solid #bfdbfe'
                          : '1px solid #e2e8f0'
                      }}>
                        {lead.source || 'Website / Direct'}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{lead.targetCourse}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.batch}</div>
                  </td>

                  <td>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentVal = lead.feeBudget && lead.feeBudget !== 'N/A' ? lead.feeBudget : '';
                        const newVal = window.prompt(`Edit Fee / Budget for ${lead.name}:`, currentVal);
                        if (newVal !== null && onUpdateLeadFee) {
                          onUpdateLeadFee(lead.id, newVal.trim() || 'N/A');
                        }
                      }}
                      style={{
                        fontWeight: 600,
                        color: lead.feeBudget && lead.feeBudget !== 'N/A' ? 'var(--color-brand-emerald)' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px dashed rgba(82, 183, 136, 0.4)',
                        backgroundColor: lead.feeBudget && lead.feeBudget !== 'N/A' ? '#f0fdf4' : '#f8fafc',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      title="Click to edit Fee / Budget"
                    >
                      ✏️ {lead.feeBudget && lead.feeBudget !== '' ? lead.feeBudget : 'N/A'}
                    </div>
                  </td>

                  <td>
                    <select
                      value={lead.stage}
                      onChange={(e) => onUpdateLeadStage(lead.id, e.target.value)}
                      className="form-select"
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: '#f8faf9'
                      }}
                    >
                      {getPipelineStagesForLead(lead.leadType).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    {onUpdateLeadCounselor && employees.length > 0 ? (
                      <select
                        value={lead.counselor || ''}
                        onChange={(e) => onUpdateLeadCounselor(lead.id, e.target.value)}
                        className="form-select"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.name}>
                            👤 {emp.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lead.counselor}</span>
                    )}
                  </td>

                  <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-brand-emerald)' }}>
                    📅 {lead.createdAt || lead.rowDate || todayStr}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={() => onSelectLead(lead)}>
                        Details & Notes
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-icon"
                          style={{ color: '#ef4444', padding: '0.35rem' }}
                          title="Delete Lead (Admin Only)"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete lead for ${lead.name}?`)) {
                              onDeleteLead(lead.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View 2: Kanban Board View */}
      {viewMode === 'kanban' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '1rem'
        }}>
          {(segmentFilter === 'B2B' ? PIPELINE_STAGES_B2B2C : PIPELINE_STAGES_B2C).map(stage => {
            const stageLeads = filteredLeads.filter(l => l.stage === stage);
            return (
              <div key={stage} style={{
                backgroundColor: '#f1f5f9',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                minHeight: '500px'
              }}>
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '2px solid #cbd5e1' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {stage}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: '#ffffff',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    color: 'var(--text-muted)'
                  }}>
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="glass-card"
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        borderLeft: '4px solid var(--color-brand-emerald)'
                      }}
                      onClick={() => onSelectLead(lead)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{lead.id}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          ★ L-SAT {lead.score}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        {lead.name}
                      </h4>

                      <div style={{ fontSize: '0.78rem', color: 'var(--color-brand-emerald)', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {lead.targetCourse}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }} onClick={(e) => e.stopPropagation()}>
                        {onUpdateLeadCounselor && employees.length > 0 ? (
                          <select
                            value={lead.counselor || ''}
                            onChange={(e) => onUpdateLeadCounselor(lead.id, e.target.value)}
                            className="form-select"
                            style={{ padding: '0.15rem 0.35rem', fontSize: '0.72rem', fontWeight: 600, borderRadius: 'var(--radius-sm)' }}
                          >
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.name}>
                                👤 {emp.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>👤 {lead.counselor}</span>
                        )}
                        <span>{lead.batch}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Excel Import Employee Assignment Popup Modal */}
      {showAssignModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(12, 32, 23, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem'
          }}
          onClick={() => {
            setShowAssignModal(false);
            setImportedRowsData([]);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
              border: '2px solid #52b788',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#0c2017',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <FileSpreadsheet size={20} color="#74c69d" />
                Bulk Upload Student Enquiries
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                onClick={() => {
                  setShowAssignModal(false);
                  setImportedRowsData([]);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', background: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #b7e4c7', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  📋 <strong>Bulk Upload Setup:</strong> Select counselor, assignment date, and choose Excel/CSV file to assign student enquiries.
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#15803d',
                    backgroundColor: '#ffffff',
                    border: '1px solid #74c69d',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Download size={14} /> Download Sample Excel Template
                </button>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  1. Select Employee / Counselor *
                </label>
                <select
                  value={selectedAssignCounselor}
                  onChange={(e) => setSelectedAssignCounselor(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', padding: '0.55rem', fontSize: '0.9rem', fontWeight: 700, borderColor: 'var(--color-brand-emerald)' }}
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      👤 {emp.name} ({emp.role} - {emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  2. 🏢 Select Lead Category / Segment (B2C vs B2B2C) *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedLeadType('B2C')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: selectedLeadType === 'B2C' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: selectedLeadType === 'B2C' ? '#f0fdf4' : '#ffffff',
                      color: selectedLeadType === 'B2C' ? '#15803d' : '#475569',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    🎓 B2C (Direct Student / Parent)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLeadType('B2B2C')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: (selectedLeadType === 'B2B2C' || selectedLeadType === 'B2B') ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: (selectedLeadType === 'B2B2C' || selectedLeadType === 'B2B') ? '#eff6ff' : '#ffffff',
                      color: (selectedLeadType === 'B2B2C' || selectedLeadType === 'B2B') ? '#1d4ed8' : '#475569',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    🏫 B2B2C (School / Institutional Tie-up)
                  </button>
                </div>

                {(selectedLeadType === 'B2B2C' || selectedLeadType === 'B2B') && (
                  <div style={{ marginTop: '0.65rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '0.25rem', display: 'block' }}>
                      🏫 School / Institution Name (B2B2C Tie-up Partner Name):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DPS Public School / St. Xavier International..."
                      value={customSchoolName}
                      onChange={(e) => setCustomSchoolName(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', borderColor: '#93c5fd', backgroundColor: '#eff6ff' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  3. 📅 Select Lead Assignment Date *
                </label>
                <input
                  type="date"
                  value={customImportDate}
                  onChange={(e) => setCustomImportDate(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '0.55rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  4. 📊 Select Excel (.xlsx / .xls) or CSV File * {importedRowsData.length > 0 && <span style={{ color: '#15803d', fontWeight: 800 }}>({importedRowsData.length} Leads Read)</span>}
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="form-input"
                  style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAssignModal(false);
                    setImportedRowsData([]);
                  }}
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={importedRowsData.length === 0}
                  onClick={handleConfirmImportWithCounselor}
                  style={{ fontSize: '0.85rem', fontWeight: 800, opacity: importedRowsData.length > 0 ? 1 : 0.6 }}
                >
                  Assign & Import Leads ({importedRowsData.length})
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
