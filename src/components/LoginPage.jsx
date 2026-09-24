import React, { useState } from 'react';
import LakshyaLogo from './LakshyaLogo';
import { Shield, User, Lock, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff, Building2, Chrome, Loader2 } from 'lucide-react';
import { ADMIN_CREDENTIALS, INSTITUTE_CREDENTIALS } from '../data/mockData';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase';

export default function LoginPage({ onLoginSuccess, employees = [] }) {
  const [loginMode, setLoginMode] = useState('admin'); // 'admin', 'institute', 'employee'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);


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
        const isPasswordMatch = emp.password === cleanPass;

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

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      const email = String(googleUser.email || '').trim().toLowerCase();
      const ownerEmails = [ADMIN_CREDENTIALS.email, 'bhoomieducation44@gmail.com'].map(value => value.toLowerCase());
      const matchedEmployee = employees.find(employee => String(employee.email || '').trim().toLowerCase() === email);
      const isDefaultInstitute = email === String(INSTITUTE_CREDENTIALS.email || '').toLowerCase();

      if (ownerEmails.includes(email)) {
        onLoginSuccess({ ...ADMIN_CREDENTIALS, name: googleUser.displayName || ADMIN_CREDENTIALS.name, email, firebaseUid: googleUser.uid, authProvider: 'google' });
      } else if (isDefaultInstitute) {
        onLoginSuccess({ ...INSTITUTE_CREDENTIALS, name: googleUser.displayName || INSTITUTE_CREDENTIALS.name, email, firebaseUid: googleUser.uid, authProvider: 'google' });
      } else if (matchedEmployee) {
        onLoginSuccess({ ...matchedEmployee, name: googleUser.displayName || matchedEmployee.name, email, firebaseUid: googleUser.uid, authProvider: 'google' });
      } else {
        await signOut(auth);
        setErrorMessage('This Google email is not linked to an employee profile. Ask the Admin to add the same official email in Employee Settings.');
      }
    } catch (error) {
      console.error('Google sign-in failed', error);
      const code = error?.code || 'unknown-error';
      const messages = {
        'auth/popup-closed-by-user': 'Google sign-in was cancelled. Keep the popup open until sign-in finishes.',
        'auth/popup-blocked': 'Your browser blocked the Google popup. Allow popups for this CRM and try again.',
        'auth/cancelled-popup-request': 'Another Google sign-in is already open. Complete that popup first.',
        'auth/unauthorized-domain': `This website is not authorized for Google login. Add ${window.location.hostname} in Firebase Console > Authentication > Settings > Authorized domains.`,
        'auth/operation-not-allowed': 'Enable Google in Firebase Console > Authentication > Sign-in method.',
        'auth/operation-not-supported-in-this-environment': 'Google login needs a supported browser with web storage enabled. Open the CRM in a regular browser window.',
        'auth/network-request-failed': 'Google login could not reach Firebase. Check your connection and browser network restrictions.',
        'auth/invalid-api-key': 'Firebase rejected the app API key. The administrator needs to check the Firebase app configuration.',
        'auth/user-disabled': 'This Firebase account is disabled. Contact the administrator.'
      };
      setErrorMessage(`${messages[code] || 'Google sign-in could not be completed. Share this error code with the administrator.'} (${code})`);
    } finally {
      setGoogleLoading(false);
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>
            <span style={{ height: '1px', flex: 1, background: '#e2e8f0' }} /> OR <span style={{ height: '1px', flex: 1, background: '#e2e8f0' }} />
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{ width: '100%', padding: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', color: '#1e293b', fontWeight: 800, cursor: googleLoading ? 'wait' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.55rem' }}
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <Chrome size={18} color="#4285f4" />} Continue with Google
          </button>
          <p style={{ margin: '-0.55rem 0 0', textAlign: 'center', fontSize: '0.7rem', color: '#64748b' }}>Use the official Gmail saved in your employee profile.</p>


        </form>
      </div>
    </div>
  );
}
