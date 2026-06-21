import React from 'react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const CREAM = '#FFFBF5';

/**
 * Section header — primary pattern for introducing a section.
 * Amber tab marker + AMBER EYEBROW + bold title + optional sub.
 */
export interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
}

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
      fontFamily: FONT,
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
      {title !== '' && title != null && (
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: FONT,
            letterSpacing: '-0.015em',
            lineHeight: 1.2,
            color: 'var(--hcp-t-100)',
            margin: 0,
          }}
        >
          {title}
        </h2>
      )}
      {sub && (
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'var(--hcp-t-60)',
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

/**
 * Inline card header — used INSIDE cards/widgets that need an
 * icon-square + title + sub + right-slot row.
 */
export interface InlineCardHeaderProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}

export const InlineCardHeader: React.FC<InlineCardHeaderProps> = ({
  icon,
  iconBg,
  title,
  sub,
  right,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderBottom: `0.5px solid ${HAIRLINE}`,
      fontFamily: FONT,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--hcp-t-100)',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--hcp-t-60)',
            marginTop: 2,
            lineHeight: 1.3,
          }}
        >
          {sub}
        </div>
      )}
    </div>
    {right && <div style={{ flexShrink: 0 }}>{right}</div>}
  </div>
);

