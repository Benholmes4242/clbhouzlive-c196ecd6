import React from 'react';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const CREAM = '#FFFBF5';

/**
 * SectionHeader was removed from this module — it duplicated the
 * canonical `@/components/ui/SectionHeader`. Dark callsites should
 * use `DarkSectionHeader` from `./darkAtoms` (shim over canonical
 * with `surface="dark"`). Light callsites should import the canonical
 * component directly.
 */


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

