import React from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
}

/**
 * Standard section header for the handicap tab.
 * Canonical Tour Hub pattern: 9/800/slate-500/0.16em caps eyebrow → 18/800 ink h1 → 13/500 slate-500 subhead.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  sub,
  right,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      padding: '0 16px 12px',
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ marginBottom: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: 'var(--hcp-t-60)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </span>
      </div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: '-0.015em',
          lineHeight: 1.2,
          color: '#0F172A',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.3,
            color: '#64748B',
            margin: '6px 0 0',
          }}
        >
          {sub}
        </p>
      )}
    </div>
    {right && <div style={{ flexShrink: 0 }}>{right}</div>}
  </div>
);

export default SectionHeader;
