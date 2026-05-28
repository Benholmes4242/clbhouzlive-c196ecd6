import React from 'react';
import { AMBER } from './tokens';

export const Eyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span
      style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER }}
    />
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
