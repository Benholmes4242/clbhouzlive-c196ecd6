import React from 'react';

interface Props {
  message: string;
  subMessage?: string;
}

export const ScorecardEmpty: React.FC<Props> = ({ message, subMessage }) => (
  <div
    style={{
      margin: '14px 18px',
      padding: 16,
      background: 'rgba(15,23,42,0.03)',
      borderRadius: 12,
      border: '1px dashed rgba(15,23,42,0.08)',
      textAlign: 'center',
    }}
  >
    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{message}</p>
    {subMessage && (
      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(15,23,42,0.55)', lineHeight: 1.5 }}>
        {subMessage}
      </p>
    )}
  </div>
);

export default ScorecardEmpty;
