import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  count: number;
  tone: 'dark' | 'light';
  /** Optional click handler. When omitted, renders as a non-interactive span (search row). */
  onClick?: (e: React.MouseEvent) => void;
  ariaLabel?: string;
}

const BarChartGlyph: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 10 10"
    fill="none"
    aria-hidden="true"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <rect x="1" y="6" width="1.6" height="3" fill="currentColor" />
    <rect x="4.2" y="4" width="1.6" height="5" fill="currentColor" />
    <rect x="7.4" y="2" width="1.6" height="7" fill="currentColor" />
    <rect x="0.5" y="9" width="9" height="0.7" fill="currentColor" />
  </svg>
);

/**
 * Phase E: "Your stats {DOT} N" chip. Two tones:
 * - dark: overlaid on photo cards (UnifiedCourseCard)
 * - light: inside the search overlay row
 */
export const YourStatsChip: React.FC<Props> = ({ count, tone, onClick, ariaLabel }) => {
  const { t } = useTranslation('courses');
  const label = t('card.yourStats');
  const glyphSize = tone === 'dark' ? 10 : 9;

  const darkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(247,147,30,0.86)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '0.5px solid rgba(255,255,255,0.28)',
    padding: '4px 9px',
    borderRadius: 9999,
    fontSize: 10.5,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.005em',
    fontVariantNumeric: 'tabular-nums',
    boxShadow: '0 1px 6px rgba(0,0,0,0.28)',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    cursor: onClick ? 'pointer' : 'default',
  };

  const lightStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(247,147,30,0.13)',
    border: '1px solid rgba(247,147,30,0.34)',
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: 6,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    lineHeight: 1.15,
  };

  const style = tone === 'dark' ? darkStyle : lightStyle;
  const content = (
    <>
      <BarChartGlyph size={glyphSize} />
      <span>
        {label} {'\u00B7'} {count}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        style={{ ...style, border: style.border, appearance: 'none' as React.CSSProperties['appearance'] }}
      >
        {content}
      </button>
    );
  }
  return (
    <span style={style} aria-label={ariaLabel}>
      {content}
    </span>
  );
};

export default YourStatsChip;
