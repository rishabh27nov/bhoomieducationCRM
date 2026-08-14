import React from 'react';

export default function LakshyaLogo({ size = 48, showTagline = true, layout = 'horizontal' }) {
  return (
    <div className={`flex items-center gap-3 ${layout === 'vertical' ? 'flex-col text-center' : 'flex-row'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
      {/* SVG Badge Emblem matching user's uploaded image */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.25))', flexShrink: 0 }}
      >
        <defs>
          {/* Radial & Linear Gradients for 3D Emblem effect */}
          <radialGradient id="greenSeal" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
            <stop offset="0%" stopColor="#2d6a4f" />
            <stop offset="60%" stopColor="#1b4332" />
            <stop offset="100%" stopColor="#081c15" />
          </radialGradient>
          
          <linearGradient id="silverRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer Silver Ring */}
        <circle cx="100" cy="100" r="96" fill="url(#silverRing)" />
        <circle cx="100" cy="100" r="90" fill="url(#greenSeal)" stroke="url(#silverRing)" strokeWidth="3" />
        <circle cx="100" cy="100" r="76" fill="none" stroke="url(#silverRing)" strokeWidth="2" strokeDasharray="1 0" />

        {/* Text Arc: LAKSHYA */}
        <path id="topArc" d="M 32 100 A 68 68 0 0 1 168 100" fill="none" />
        <text fill="#ffffff" fontSize="20" fontWeight="800" letterSpacing="4" textAnchor="middle">
          <textPath href="#topArc" startOffset="50%">LAKSHYA</textPath>
        </text>

        {/* Stars on sides */}
        <path d="M 30 100 L 33 103 L 30 106 L 27 103 Z" fill="#ffffff" />
        <path d="M 170 100 L 173 103 L 170 106 L 167 103 Z" fill="#ffffff" />

        {/* Center Icons Group: Graduation Cap, Fountain Pen & Feather Quill over Book */}
        <g transform="translate(48, 52)">
          {/* Open Book */}
          <path
            d="M 12 62 C 26 54 38 58 52 64 C 66 58 78 54 92 62 L 92 78 C 78 70 66 74 52 80 C 38 74 26 70 12 78 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M 52 64 L 52 80" stroke="#ffffff" strokeWidth="3" />

          {/* Lines on Book */}
          <line x1="22" y1="64" x2="42" y2="60" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="69" x2="42" y2="65" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <line x1="62" y1="60" x2="82" y2="64" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <line x1="62" y1="65" x2="82" y2="69" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />

          {/* Graduation Cap (Mortarboard) */}
          <polygon points="52,10 92,26 52,42 12,26" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="36" y="32" width="32" height="12" rx="4" fill="#ffffff" opacity="0.9" />
          <path d="M 80 28 L 84 46 C 84 48 80 50 80 50" stroke="#fef08a" strokeWidth="3" fill="none" />

          {/* Fountain Pen & Feather Nib overlap */}
          <path d="M 52 28 L 46 54 L 52 58 L 58 54 Z" fill="url(#silverRing)" stroke="#1b4332" strokeWidth="1" />
          <circle cx="52" cy="42" r="2" fill="#081c15" />
          <line x1="52" y1="44" x2="52" y2="58" stroke="#081c15" strokeWidth="1.5" />
        </g>

        {/* Sparkles around Cap */}
        <polygon points="45,65 47,70 52,72 47,74 45,79 43,74 38,72 43,70" fill="#ffffff" />
        <polygon points="155,65 157,70 162,72 157,74 155,79 153,74 148,72 153,70" fill="#ffffff" />
      </svg>

      {/* Typography side/bottom */}
      <div>
        <div style={{
          fontSize: size > 40 ? '1.4rem' : '1.15rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: '#ffffff',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.1
        }}>
          LAKSHYA
        </div>
        {showTagline && (
          <div style={{
            fontSize: '0.72rem',
            color: '#74c69d',
            fontWeight: 500,
            letterSpacing: '0.02em',
            marginTop: '2px',
            fontStyle: 'italic'
          }}>
            Bridging Dreams and Destiny.
          </div>
        )}
      </div>
    </div>
  );
}
