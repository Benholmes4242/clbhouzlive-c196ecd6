import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  count: number;
  tone: 'dark' | 'light';
  /** Optional click handler. When omitted, renders as a non-interactive span (search row). */
  onClick?: (e: React.MouseEvent) => void;
  ariaLabel?: string;
}

/** Single definition of the bar-chart category marker. Reused by search rows. */
export const BarChartGlyph: React.FC<{ size: number }> = ({ size }) => (
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
 * "YOUR ROUNDS N" — the member's own figure on a card whose other figures
 * belong to the course. Two tones:
 * - dark: glass capsule overlaid on photo cards (UnifiedCourseCard), amber text
 * - light: no fill, no border, AMBER_DEEP (amber fails contrast below 12px)
 */
export const YourStatsChip: React.FC<Props> = ({ count, tone, onClick, ariaLabel }) => {
  const { t } = useTranslation('courses');
  const label = t('card.yourRounds');
  const glyphSize = tone === 'dark' ? 10 : 9;

  const darkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(12,18,14,0.58)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.18)',
    padding: '5px 10px',
    borderRadius: 999,
    color: A.AMBER,
    whiteSpace: 'nowrap',
    lineHeight: 1,
    cursor: onClick ? 'pointer' : 'default',
  };

  const lightStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'transparent',
    border: 'none',
    padding: 0,
    color: A.AMBER_DEEP,
    whiteSpace: 'nowrap',
    lineHeight: 1,
    cursor: onClick ? 'pointer' : 'default',
  };

  const style = tone === 'dark' ? darkStyle : lightStyle;
  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
  };
  const figureStyle: React.CSSProperties = {
    ...FIGS,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  };
  const content = (
    <>
      <BarChartGlyph size={glyphSize} />
      <span style={labelStyle}>{label}</span>
      <span style={figureStyle}>{count}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        style={{ ...style, appearance: 'none' as React.CSSProperties['appearance'] }}
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
