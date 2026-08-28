import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, Mail, Phone, Briefcase, Eye, EyeOff } from 'lucide-react';

export default function AddEmployeeModal({ onClose, onAddEmployee }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    role: 'Employee',
    email: '',
    phone: '',
    username: '',
    password: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const finalEmpId = formData.id.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`;

    onAddEmployee({
      ...formData,
      id: finalEmpId,
      username: formData.username || finalEmpId.toLowerCase(),
      password: formData.password || 'emp123',
      activeLeads: 0,
      conversion: '0%',
      joinedDate: new Date().toISOString().split('T')[0]
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
          maxWidth: '520px',
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
            <UserPlus size={20} color="#74c69d" /> Add New Team Member / ID Creation
          </div>
          <button className="btn-icon" style={{ color: '#ffffff' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Employee ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. EMP-105 or 105"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Official Email *</label>
              <input
                type="email"
                required
                placeholder="rajesh@lakshyaedu.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 99887"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {/* Credentials Creation Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Login Username *</label>
              <input
                type="text"
                placeholder="rajesh105"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Login Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Initial password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    padding: '0.25rem'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>


          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Role / Designation *</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
                <option value="Institute">Institute Manager</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Employee Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="On Training">On Training</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>


          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Profile Photo URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Employee Profile
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
