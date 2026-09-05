import React, { useState } from 'react';
import { PIPELINE_STAGES, getPipelineStagesForLead } from '../data/mockData';
import {
  X,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  DollarSign,
  UserCheck,
  Star,
  Plus,
  Send,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';

export default function LeadModal({
  lead,
  onClose,
  onUpdateStage,
  onUpdateCounselor,
  onAddNote,
  onDeleteLead,
  onUpdateLeadNotes,
  onUpdateLeadProfile,
  employees = [],
  currentUser = {},
  courses = []
}) {
  const [noteText, setNoteText] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(lead?.notes || '');

  // Edit Student Profile State
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editForm, setEditForm] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    feeBudget: lead?.feeBudget || 'N/A',
    targetCourse: lead?.targetCourse || ''
  });

  if (!lead) return null;

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(lead.id, noteText);
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const authorName = currentUser?.name || 'User';
    setEditedNotes((prev) => (prev || '') + `\n\n[Log - ${dateStr} ${timeStr} by ${authorName}]: ${noteText}`);
    setNoteText('');
  };

  const handleSaveNotes = () => {
    if (onUpdateLeadNotes) {
      onUpdateLeadNotes(lead.id, editedNotes);
    }
    setIsEditingNotes(false);
  };

  const handleClearNotes = () => {
    if (window.confirm('Are you sure you want to clear/delete all notes for this student?')) {
      setEditedNotes('');
      if (onUpdateLeadNotes) {
        onUpdateLeadNotes(lead.id, '');
      }
      setIsEditingNotes(false);
    }
  };

  const handleSaveStudentProfile = (e) => {
    e.preventDefault();
    if (onUpdateLeadProfile) {
      onUpdateLeadProfile(lead.id, editForm);
    }
    setIsEditingStudent(false);
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
          maxWidth: '650px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0c2017 0%, #143829 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#74c69d', marginBottom: '0.25rem' }}>
              STUDENT PROFILE • {lead.id}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{lead.name}</h2>
            <div style={{ fontSize: '0.85rem', color: '#a7f3d0', marginTop: '0.25rem' }}>
              {lead.targetCourse} • {lead.batch}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.3rem 0.65rem',
                backgroundColor: isEditingStudent ? '#52b788' : 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={() => {
                setEditForm({
                  name: lead.name,
                  phone: lead.phone,
                  email: lead.email,
                  feeBudget: lead.feeBudget || 'N/A',
                  targetCourse: lead.targetCourse
                });
                setIsEditingStudent(!isEditingStudent);
              }}
              title="Edit Student Info"
            >
              <Edit3 size={15} /> {isEditingStudent ? 'Cancel Edit' : 'Edit Student'}
            </button>

            {onDeleteLead && (
              <button
                className="btn-icon"
                style={{ color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                title="Delete Lead"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete lead ${lead.name}?`)) {
                    onDeleteLead(lead.id);
                    onClose();
                  }
                }}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button className="btn-icon" style={{ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' }} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
          
          {/* Quick Info Grid / Edit Form */}
          {isEditingStudent ? (
            <form onSubmit={handleSaveStudentProfile} style={{
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#f0fdf4',
              border: '1px solid #b7e4c7',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ✏️ Edit Student Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Student Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Contact No. *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Email Address</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="N/A"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Fee / Budget</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                    value={editForm.feeBudget}
                    onChange={(e) => setEditForm({ ...editForm, feeBudget: e.target.value })}
                    placeholder="N/A"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Target Course</label>
                <select
                  className="form-select"
                  style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                  value={editForm.targetCourse}
                  onChange={(e) => setEditForm({ ...editForm, targetCourse: e.target.value })}
                >
                  {courses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {!courses.includes(editForm.targetCourse) && editForm.targetCourse && (
                    <option value={editForm.targetCourse}>{editForm.targetCourse}</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                  onClick={() => setIsEditingStudent(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', fontWeight: 800 }}
                >
                  <Save size={14} /> Save Profile
                </button>
              </div>
            </form>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#f8faf9',
              border: '1px solid var(--border-light)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contact Info</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={14} color="var(--color-brand-emerald)" /> {lead.phone || 'N/A'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={14} color="var(--color-brand-emerald)" /> {lead.email || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Counseling Details</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Counselor:</span>
                  {onUpdateCounselor && employees.length > 0 ? (
                    <select
                      value={lead.counselor || ''}
                      onChange={(e) => onUpdateCounselor(lead.id, e.target.value)}
                      className="form-select"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-md)' }}
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          👤 {emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{lead.counselor}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Fee Budget: {lead.feeBudget || 'N/A'} • Source: {lead.leadSource}
                  {lead.schoolName && (
                    <div style={{ color: '#1d4ed8', fontWeight: 700, marginTop: '3px' }}>
                      🏫 School: {lead.schoolName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pipeline Stage Change */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
              Update Admission Pipeline Stage ({lead.leadType === 'B2B' || lead.leadType === 'B2B2C' ? '🏫 B2B2C Pipeline' : '🎓 B2C Pipeline'}):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {getPipelineStagesForLead(lead.leadType).map(stage => {
                const isActive = lead.stage === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => onUpdateStage(lead.id, stage)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--color-brand-emerald)' : 'var(--border-light)',
                      backgroundColor: isActive ? 'var(--color-brand-soft)' : '#ffffff',
                      color: isActive ? 'var(--color-brand-dark)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {isActive && <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                    {stage}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Counselor Notes History */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Academic Counseling Notes & Log History
              </h4>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {!isEditingNotes ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-brand-emerald)' }}
                    onClick={() => {
                      setEditedNotes(lead.notes || '');
                      setIsEditingNotes(true);
                    }}
                    title="Edit, remove lines, or modify counseling notes"
                  >
                    <Edit3 size={14} /> Edit Notes
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={handleSaveNotes}
                    >
                      <Save size={14} /> Save Notes
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#dc2626', borderColor: '#fecaca' }}
                      onClick={handleClearNotes}
                    >
                      <Trash2 size={14} /> Clear All Notes
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {!isEditingNotes ? (
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f8faf9',
                border: '1px solid var(--border-light)',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {lead.notes || <span style={{ color: 'var(--text-muted)', italic: 'true' }}>No counseling notes recorded yet.</span>}
              </div>
            ) : (
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={6}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'inherit'
                }}
                placeholder="Edit, delete, or clean up student notes here..."
              />
            )}
          </div>


          {/* Add New Note */}
          <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Add new demo class feedback or counseling update..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="form-input"
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.625rem 1rem' }}>
              <Send size={16} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
