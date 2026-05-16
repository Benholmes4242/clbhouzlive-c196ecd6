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
      background: 'var(--hcp-bg-2)',
      borderRadius: 12,
      border: '1px dashed var(--hcp-line)',
      textAlign: 'center',
    }}
  >
    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--hcp-t-100)' }}>{message}</p>
    {subMessage && (
      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--hcp-t-60)', lineHeight: 1.5 }}>
        {subMessage}
      </p>
    )}
  </div>
);

export default ScorecardEmpty;
