import React from 'react';
import { Link } from 'react-router-dom';

const GEIST = '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const LegalShell: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0E14', fontFamily: GEIST }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textDecoration: 'none',
            marginBottom: 32,
          }}
        >
          clbhouz
        </Link>
        <h1 style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 28px' }}>
          Last updated: 11 June 2026
        </p>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7 }}>
          {children}
        </div>

        <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>
            <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
            <span style={{ margin: '0 8px' }}>·</span>
            <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
            clbhouz — clbhouz.co.uk
          </div>
        </div>
      </div>
    </div>
  );
};

export const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700, margin: '28px 0 10px' }}>{children}</h2>
);

export const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ margin: '0 0 12px' }}>{children}</p>
);

export const UL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>{children}</ul>
);
