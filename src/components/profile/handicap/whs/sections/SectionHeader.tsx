import React from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}

/**
 * Standard section header for the handicap tab.
 * Pattern: 3px amber tab + uppercase eyebrow + Georgia serif title + optional sub.
 * Used across all redesigned sections to establish visual consistency.
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
      padding: '0 20px 12px',
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 3,
            height: 8,
            borderRadius: 1,
            background: '#F7931E',
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: '#F7931E',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </span>
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 900,
          fontFamily: 'Georgia, serif',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          color: '#0F172A',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.4,
            color: '#64748B',
            margin: '4px 0 0',
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
