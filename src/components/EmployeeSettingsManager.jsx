import React, { useState, useEffect } from 'react';
import {
  UserCog,
  User,
  KeyRound,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Lock,
  UserCheck
} from 'lucide-react';
import { isCounselorMatch } from '../data/mockData';

export default function EmployeeSettingsManager({
  currentUser,
  setCurrentUser,
  employees = [],
  onUpdateEmployee
}) {
  const isAdmin = currentUser?.role === 'Admin';

  // Selected employee ID to edit (defaults to logged in user if match found, else first employee)
  const [selectedEmpId, setSelectedEmpId] = useState(() => {
    const currentMatch = employees.find((e) => isCounselorMatch(e.name, currentUser?.name));
    return currentMatch ? currentMatch.id : (employees[0]?.id || 'EMP-101');
  });

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || {
    id: 'EMP-101',
    name: currentUser?.name || 'Supriya',
    email: currentUser?.email || 'supriya@lakshya.edu.in',
    phone: currentUser?.phone || '9876543210',
    role: currentUser?.role || 'Employee',
    password: currentUser?.password || 'emp123',
    avatar: currentUser?.avatar
  };

  // Form State
  const [name, setName] = useState(selectedEmployee.name || '');
  const [email, setEmail] = useState(selectedEmployee.email || '');
  const [phone, setPhone] = useState(selectedEmployee.phone || '');
  const [role, setRole] = useState(selectedEmployee.role || 'Employee');
  const [password, setPassword] = useState(selectedEmployee.password || 'emp123');
  const [confirmPassword, setConfirmPassword] = useState(selectedEmployee.password || 'emp123');
  const [avatar, setAvatar] = useState(selectedEmployee.avatar || '');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Update local form state when selected employee changes
  useEffect(() => {
    const emp = employees.find((e) => e.id === selectedEmpId);
    if (emp) {
      setName(emp.name || '');
      setEmail(emp.email || '');
      setPhone(emp.phone || '');
      setRole(emp.role || 'Employee');
      setPassword(emp.password || 'emp123');
      setConfirmPassword(emp.password || 'emp123');
      setAvatar(emp.avatar || '');
    }
  }, [selectedEmpId, employees]);

  const presetAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  ];

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Employee Name cannot be empty');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Email address cannot be empty');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('New Password and Confirm Password do not match!');
      return;
    }

    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    const updatedData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role,
      password: password.trim(),
      avatar: avatar || selectedEmployee.avatar
    };

    // Update global employee array in parent
    if (onUpdateEmployee) {
      onUpdateEmployee(selectedEmpId, updatedData);
    }

    // If updating currently logged in user, update currentUser state in App
    if (isCounselorMatch(selectedEmployee.name, currentUser?.name) || selectedEmpId === currentUser?.id) {
      if (setCurrentUser) {
        setCurrentUser(prev => ({
          ...prev,
          ...updatedData
        }));
      }
    }

    setSuccessToast(`Settings & Password updated successfully for "${name.trim()}"!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#1b4332',
          color: '#ffffff',
          padding: '0.85rem 1.35rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 9999,
          border: '1px solid #52b788'
        }}>
          <CheckCircle2 size={20} color="#52b788" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(82, 183, 136, 0.15)', borderRadius: 'var(--radius-md)', color: '#1b4332' }}>
              <UserCog size={24} color="#1b4332" />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Employee Account Settings
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Edit employee profile details, change login passwords, update contact information & roles.
          </p>
        </div>

        {/* Employee Selector if Admin */}
        {isAdmin && employees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Employee:</span>
            <select
              className="input-field"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              style={{ fontWeight: 600, padding: '0.5rem 0.85rem', minWidth: '180px' }}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role || 'Staff'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Settings Form Card */}
      <div className="glass-card" style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid rgba(82, 183, 136, 0.2)'
      }}>
        
        {/* Profile Header Summary */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap'
        }}>
          <img
            src={avatar || selectedEmployee.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
            alt={name}
            style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #52b788' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{name || selectedEmployee.name}</h2>
              <span className="badge badge-admitted" style={{ fontSize: '0.75rem' }}>{role}</span>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Employee ID: <strong>{selectedEmployee.id}</strong> | Email: <strong>{email}</strong>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            <AlertCircle size={18} color="#dc2626" />
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Basic Profile Details */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1b4332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="#52b788" /> General Profile Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              
              {/* Edit Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Employee Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', width: '100%', fontWeight: 600 }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Employee Name"
                    required
                  />
                </div>
              </div>

              {/* Edit Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', width: '100%' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. employee@lakshya.edu.in"
                    required
                  />
                </div>
              </div>

              {/* Edit Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Mobile Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', width: '100%' }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              {/* Edit Role */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Employee Designation / Role
                </label>
                <div style={{ position: 'relative' }}>
                  <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', width: '100%' }}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={!isAdmin}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Senior Counselor">Senior Counselor</option>
                    <option value="NEET Counselor">NEET Counselor</option>
                    <option value="JEE Counselor">JEE Counselor</option>
                    <option value="Employee">Employee / Staff</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Change Password */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1b4332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={18} color="#52b788" /> Security & Password Management
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              
              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem', width: '100%' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Confirm New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem', width: '100%' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Profile Picture Presets */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Choose Profile Avatar
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {presetAvatars.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Avatar ${idx + 1}`}
                  onClick={() => setAvatar(url)}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: avatar === url ? '3px solid #1b4332' : '2px solid transparent',
                    boxShadow: avatar === url ? '0 0 10px rgba(27, 67, 50, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={18} /> Save Settings & Update Password
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
