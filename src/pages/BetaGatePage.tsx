import React, { useEffect, useState } from 'react';

const BetaGatePage: React.FC = () => {
  const [logoError, setLogoError] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    document.body.classList.add('route-auth');
    return () => {
      document.body.classList.remove('route-auth');
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'clbhouz**') {
      sessionStorage.setItem('beta_access', 'true');
      window.location.reload();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#080808',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Amber radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(245,166,35,0.18) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          padding: '0 32px',
          maxWidth: 360,
          width: '100%',
        }}
      >
        {/* Logo */}
        {!logoError && (
          <img
            src="/images/clbhouz-logo.png"
            alt="clbhouz"
            onError={() => setLogoError(true)}
            style={{ height: 48, marginBottom: 8 }}
          />
        )}

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 28,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Private Beta
        </h1>

        {/* Body */}
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            margin: 0,
            maxWidth: 300,
          }}
        >
          clbhouz is currently available by invitation only. If you've been invited, download the app via TestFlight to get started.
        </p>

        {/* CTA */}
        <a
          href="https://testflight.apple.com/join/clbhouz"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 280,
            height: 52,
            borderRadius: 26,
            background: '#F5A623',
            color: '#000000',
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          Download on TestFlight
        </a>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            maxWidth: 280,
            height: 1,
            background: 'rgba(255,255,255,0.08)',
            marginTop: 8,
          }}
        />

        {/* Password gate */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 280 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#F5A623',
            }}
          >
            Beta Access
          </span>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 10,
              background: '#F5A623',
              color: '#000',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Enter
          </button>
          {error && (
            <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>Incorrect password</p>
          )}
        </form>
      </div>

      {/* Footer */}
      <span
        style={{
          position: 'absolute',
          bottom: 40,
          fontSize: 11,
          color: 'rgba(255,255,255,0.15)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 500,
        }}
      >
        clbhouz · Private Beta
      </span>
    </div>
  );
};

export default BetaGatePage;
