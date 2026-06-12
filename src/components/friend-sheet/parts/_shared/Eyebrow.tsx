import React from 'react';

export const Eyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: 'var(--hcp-t-60)',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  </div>
);
