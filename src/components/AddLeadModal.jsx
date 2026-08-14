import React, { useState } from 'react';
import { COUNSELORS, DEFAULT_COURSES } from '../data/mockData';
import { X, UserPlus, Sparkles, Plus } from 'lucide-react';

export default function AddLeadModal({
  onClose,
  onAddLead,
  counselors = COUNSELORS,
  courses = DEFAULT_COURSES,
  onAddCourse
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    targetCourse: courses[0] || 'NEET Class 11',
    batch: 'Class 11/12 Morning Batch',
    feeBudget: '₹1,20,000 / year',
    counselor: counselors.length > 0 ? counselors[0].name : '',
    leadSource: 'School Seminar Walk-in',
    notes: '',
    createdAt: todayStr
  });

  const [showAddCourseInput, setShowAddCourseInput] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');

  const handleAddNewCourseSubmit = (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    if (onAddCourse) {
      onAddCourse(newCourseName.trim());
      setFormData((prev) => ({ ...prev, targetCourse: newCourseName.trim() }));
    }
    setNewCourseName('');
    setShowAddCourseInput(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    onAddLead({
      ...formData,
      id: `LKD-${1000 + Math.floor(Math.random() * 9000)}`,
      stage: 'New Enquiry',
      score: 78,
      createdAt: formData.createdAt || todayStr,
      lastContact: 'Just now'
    });

    onClose();
  };


  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(12, 32, 23, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }} onClick={onClose}>

      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0c2017 0%, #143829 100%)',
          color: '#ffffff',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
            <UserPlus size={20} color="#74c69d" /> New NEET / JEE Student Enquiry
          </div>
          <button className="btn-icon" style={{ color: '#ffffff' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Student Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Email Address</label>
              <input
                type="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block' }}>Target Program *</label>
                <button
                  type="button"
                  onClick={() => setShowAddCourseInput(!showAddCourseInput)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand-emerald)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Plus size={12} /> {showAddCourseInput ? 'Cancel' : 'Add New Course'}
                </button>
              </div>

              {showAddCourseInput ? (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. NEET Dropper / Class 10..."
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    onClick={handleAddNewCourseSubmit}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  className="form-select"
                  value={formData.targetCourse}
                  onChange={(e) => setFormData({ ...formData, targetCourse: e.target.value })}
                >
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              )}
            </div>


            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Preferred Batch Timing</label>
              <select
                className="form-select"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              >
                <option value="Batch Alpha (Morning)">Morning Batch (08:00 AM)</option>
                <option value="Batch Pinnacle (Evening)">Evening Batch (02:00 PM)</option>
                <option value="Weekend Special Batch">Weekend Special (Sat-Sun)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Assign Academic Counselor *</label>
              <select
                className="form-select"
                value={formData.counselor}
                onChange={(e) => setFormData({ ...formData, counselor: e.target.value })}
              >
                {counselors.map(c => (
                  <option key={c.id} value={c.name}>👤 {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>📅 Lead Date *</label>
              <input
                type="date"
                required
                value={formData.createdAt}
                onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                className="form-input"
                style={{ padding: '0.45rem', fontSize: '0.85rem', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Lead Source</label>
              <select
                className="form-select"
                value={formData.leadSource}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
              >
                <option value="School Seminar Walk-in">School Seminar Walk-in</option>
                <option value="Newspaper Ad">Newspaper Ad</option>
                <option value="Google Search">Google Search</option>
                <option value="Instagram Campaign">Instagram Campaign</option>
                <option value="Student Referral">Student Referral</option>
                <option value="Excel Import">Excel Import</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Counseling Notes & L-SAT Score</label>
            <textarea
              rows={2}
              placeholder="Add student NEET/JEE attempt history, L-SAT marks or scholarship request..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Student Enquiry
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
