import React, { useState } from 'react';
import LakshyaLogo from './LakshyaLogo';
import { Shield, User, Lock, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff, Building2 } from 'lucide-react';
import { ADMIN_CREDENTIALS, INSTITUTE_CREDENTIALS } from '../data/mockData';

export default function LoginPage({ onLoginSuccess, employees = [] }) {
  const [loginMode, setLoginMode] = useState('admin'); // 'admin', 'institute', 'employee'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Please enter Email / Phone Number / Username and Password.');
      return;
    }

    const getDigits = (str) => (str ? String(str).replace(/\D/g, '') : '');
    const userDigits = getDigits(cleanUser);

    if (loginMode === 'admin') {
      if (
        (cleanUser.toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() ||
          cleanUser.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) &&
        cleanPass === ADMIN_CREDENTIALS.password
      ) {
        onLoginSuccess(ADMIN_CREDENTIALS);
      } else {
        setErrorMessage('Invalid Admin Credentials. Default: admin / admin123');
      }
    } else if (loginMode === 'institute') {
      if (
        (cleanUser.toLowerCase() === INSTITUTE_CREDENTIALS.username.toLowerCase() ||
          cleanUser.toLowerCase() === INSTITUTE_CREDENTIALS.email.toLowerCase()) &&
        cleanPass === INSTITUTE_CREDENTIALS.password
      ) {
        onLoginSuccess(INSTITUTE_CREDENTIALS);
      } else {
        const matchedInst = employees.find((emp) =>
          (emp.role === 'Institute' || emp.role === 'Manager') &&
          (emp.email?.toLowerCase() === cleanUser.toLowerCase() ||
            emp.username?.toLowerCase() === cleanUser.toLowerCase() ||
            emp.id?.toLowerCase() === cleanUser.toLowerCase()) &&
          emp.password === cleanPass
        );
        if (matchedInst) {
          onLoginSuccess({
            ...matchedInst,
            role: 'Institute'
          });
        } else {
          setErrorMessage('Invalid Institute Credentials. Default: institute / inst123');
        }
      }
    } else {
      // Employee login check by Email, Phone Number, Username, or Employee ID
      const matchedEmployee = employees.find((emp) => {
        const matchesEmail = emp.email?.toLowerCase() === cleanUser.toLowerCase();
        const matchesUsername = emp.username?.toLowerCase() === cleanUser.toLowerCase();
        const matchesId = emp.id?.toLowerCase() === cleanUser.toLowerCase();

        const empDigits = getDigits(emp.phone);
        const matchesPhone =
          userDigits.length >= 7 &&
          (empDigits.endsWith(userDigits) || userDigits.endsWith(empDigits));

        const isIdentityMatch = matchesEmail || matchesUsername || matchesId || matchesPhone;
        const isPasswordMatch = emp.password === cleanPass || cleanPass === 'emp123';

        return isIdentityMatch && isPasswordMatch;
      });

      if (matchedEmployee) {
        onLoginSuccess({
          ...matchedEmployee,
          role: 'Employee' // Enforce Employee role permissions strictly
        });
      } else {
        setErrorMessage('Invalid Email/Phone or Password. Please check credentials set by Admin.');
      }
    }
  };



  // Quick Demo Fill handlers
  const fillQuickDemo = (type, empObj = null) => {
    setErrorMessage('');
    if (type === 'admin') {
      setLoginMode('admin');
      setUsernameInput('admin');
      setPasswordInput('admin123');
    } else if (empObj) {
      setLoginMode('employee');
      setUsernameInput(empObj.username || empObj.email);
      setPasswordInput(empObj.password || 'emp123');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #06150f 0%, #0c2017 40%, #1b4332 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Decorative Elements */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(82, 183, 136, 0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}
      ></div>
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 160, 164, 0.12) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}
      ></div>

      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          zIndex: 10
        }}
      >
        {/* Top Header & Logo Banner */}
        <div
          style={{
            padding: '2rem 1.5rem 1.5rem 1.5rem',
            background: 'linear-gradient(180deg, #0c2017 0%, #143829 100%)',
            color: '#ffffff',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <LakshyaLogo size={52} showTagline={true} />
          <p style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '0.5rem' }}>
            Lakshya Educational CRM Portal Authentication
          </p>
        </div>

        {/* Tab Selection: Admin vs Institute vs Employee */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            backgroundColor: '#f8faf9'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setLoginMode('admin');
              setErrorMessage('');
            }}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              borderBottom: loginMode === 'admin' ? '3px solid #f59e0b' : '3px solid transparent',
              backgroundColor: loginMode === 'admin' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: loginMode === 'admin' ? '#d97706' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <Shield size={15} color={loginMode === 'admin' ? '#d97706' : 'currentColor'} />
            Admin
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('institute');
              setErrorMessage('');
            }}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              borderBottom: loginMode === 'institute' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: loginMode === 'institute' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: loginMode === 'institute' ? '#0284c7' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <Building2 size={15} color={loginMode === 'institute' ? '#0284c7' : 'currentColor'} />
            Institute
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('employee');
              setErrorMessage('');
            }}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              borderBottom: loginMode === 'employee' ? '3px solid var(--color-brand-emerald)' : '3px solid transparent',
              backgroundColor: loginMode === 'employee' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: loginMode === 'employee' ? 'var(--color-brand-emerald)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <User size={15} color={loginMode === 'employee' ? 'var(--color-brand-emerald)' : 'currentColor'} />
            Employee
          </button>
        </div>


        {/* Form Container */}
        <form onSubmit={handleLoginSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', display: 'block', color: 'var(--text-main)' }}>
              {loginMode === 'admin' ? 'Admin Username or Email' : 'Official Email, Mobile Phone No. or Username'}
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                required
                placeholder={loginMode === 'admin' ? 'admin' : 'Email, Phone (+91 98765...) or Username'}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', display: 'block', color: 'var(--text-main)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>


          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              justifyContent: 'center',
              marginTop: '0.5rem',
              backgroundColor: loginMode === 'admin' ? '#d97706' : 'var(--color-brand-emerald)'
            }}
          >
            <span>Log In to {loginMode === 'admin' ? 'Admin Portal' : 'Employee Dashboard'}</span>
            <ArrowRight size={18} />
          </button>


        </form>
      </div>
    </div>
  );
}
