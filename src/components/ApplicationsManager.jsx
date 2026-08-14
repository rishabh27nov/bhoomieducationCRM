import React, { useState } from 'react';
import { INITIAL_BATCHES } from '../data/mockData';
import {
  BookOpen,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  Filter,
  Trash2,
  Award,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { DEFAULT_COURSES } from '../data/mockData';

export default function ApplicationsManager({ courses = DEFAULT_COURSES, onAddCourse, searchQuery = '' }) {
  const [batches, setBatches] = useState(INITIAL_BATCHES);
  const [courseFilter, setCourseFilter] = useState('ALL');

  const handleDeleteBatch = (id) => {
    if (window.confirm('Are you sure you want to delete this batch record?')) {
      setBatches(batches.filter(b => b.id !== id));
    }
  };

  const filteredBatches = batches.filter((b) => {
    const matchesCourse = courseFilter === 'ALL' || b.course.toLowerCase().includes(courseFilter.toLowerCase());
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      b.batchName.toLowerCase().includes(query) ||
      b.course.toLowerCase().includes(query) ||
      b.facultyLead.toLowerCase().includes(query);
    return matchesCourse && matchesSearch;
  });


  const handleExportExcel = () => {
    const exportData = filteredBatches.map((b) => ({
      'Batch ID': b.id,
      'Batch Name': b.batchName,
      'Course': b.course,
      'Faculty Lead': b.facultyLead,
      'Timing': b.timing,
      'Enrolled Count': b.enrolledCount,
      'Max Capacity': b.maxCapacity,
      'Status': b.status,
      'Test Series Status': b.testSeriesStatus,
      'Fee Collection': b.feeStatus
    }));
    exportToExcel(exportData, `Batches_Admissions_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    const columns = ['ID', 'Batch Name', 'Course', 'Faculty Lead', 'Timing', 'Enrolled', 'Capacity', 'Status'];
    const rows = filteredBatches.map((b) => [
      b.id,
      b.batchName,
      b.course,
      b.facultyLead,
      b.timing,
      b.enrolledCount,
      b.maxCapacity,
      b.status
    ]);
    exportToPDF('Batches & Admissions Report', columns, rows, 'Batches_Admissions_Report.pdf');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Batches & Admissions Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Track NEET & JEE coaching batches, faculty allocation, test series, and fee collection
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803d', borderColor: '#b7e4c7', backgroundColor: '#f0fdf4' }}
            onClick={handleExportExcel}
            title="Download Batches as Excel Sheet (.csv)"
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

          <button className="btn btn-primary">
            <Plus size={18} /> Create New Batch
          </button>
        </div>
      </div>


      {/* Filter */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Filter size={16} color="var(--text-muted)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Program:</span>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="ALL">All Coaching Batches ({batches.length})</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
      </div>


      {/* Batches Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{batch.id}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    {batch.batchName}
                  </h3>
                </div>
                <span className="badge badge-admitted" style={{ fontSize: '0.72rem' }}>
                  {batch.status}
                </span>
              </div>

              {/* Batch Details */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f8faf9',
                border: '1px solid var(--border-light)',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--color-brand-primary)', marginBottom: '0.25rem' }}>
                  <Award size={16} />
                  {batch.course}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span>Faculty Lead: <strong>{batch.facultyLead}</strong></span>
                  <span>Timing: <strong>{batch.timing}</strong></span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Strength / Enrolled:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-brand-emerald)' }}>
                    {batch.enrolledCount} / {batch.maxCapacity} Students
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Test Series:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>
                    {batch.testSeriesStatus}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fee Collection:</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>
                    {batch.feeStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Batch ID: <strong>{batch.id}</strong></span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                  Manage Batch Roster
                </button>
                <button
                  className="btn-icon"
                  style={{ color: '#ef4444' }}
                  title="Delete Batch"
                  onClick={() => handleDeleteBatch(batch.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
