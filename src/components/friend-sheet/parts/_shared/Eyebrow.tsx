import React from 'react';
import { AMBER } from './tokens';

export const Eyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span
      style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER }}
    />
    <span
      style={{
        fontSize: 13,
        fontWeight: 800,
        color: AMBER,
        letterSpacing: '0.14em',
      }}
    >
      {label}
    </span>
  </div>
);
