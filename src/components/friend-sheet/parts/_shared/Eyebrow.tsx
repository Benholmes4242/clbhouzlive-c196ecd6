import React from 'react';
import { SECTION_EYEBROW } from '@/lib/tokens/type';

export const Eyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span
      style={{
        ...SECTION_EYEBROW,
        color: '#F8FAFC',
      }}
    >
      {label}
    </span>
  </div>
);
