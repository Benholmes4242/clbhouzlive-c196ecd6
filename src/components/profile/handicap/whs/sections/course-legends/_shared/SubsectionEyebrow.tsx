import React from 'react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const SubsectionEyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-60)',
      padding: '0 16px',
      marginTop: 24,
      marginBottom: 10,
    }}
  >
    {label}
  </div>
);

export default SubsectionEyebrow;
