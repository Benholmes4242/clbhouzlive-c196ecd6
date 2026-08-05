import React from 'react';
import { A, SANS, KICKER, LABEL, FIGS } from '@/features/courses/components/holes/analytical/tokens';

/**
 * Course-led Discover — shared tokens and the three chrome primitives
 * (BRIEF_DISCOVER_REBUILT_COURSE_LED). Eyebrows and quiet actions are INK per
 * the app-wide flip; amber means isOwn and nothing else; GOLD is reserved for
 * legendary feats (hole in one, albatross).
 */

export const GOLD = '#D8A93C';
export { A, SANS, KICKER, LABEL, FIGS };

export const NUMF: React.CSSProperties = {
  fontWeight: 800,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums lining',
};

export const SCRIM_STRONG =
  'linear-gradient(0deg, rgba(10,14,10,0.62) 0%, rgba(10,14,10,0) 55%)';
export const SCRIM_SOFT =
  'linear-gradient(0deg, rgba(10,14,10,0.6) 0%, rgba(10,14,10,0) 60%)';

export const CARD_SHELL: React.CSSProperties = {
  background: A.PANEL,
  border: `1px solid ${A.BORDER}`,
  borderRadius: 16,
  overflow: 'hidden',
};

export function Eyebrow({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        padding: '0 2px',
        marginBottom: 10,
      }}
    >
      <span style={KICKER}>{children}</span>
      {aside ? <span style={{ marginLeft: 'auto' }}>{aside}</span> : null}
    </div>
  );
}

export function Aside({ children }: { children: React.ReactNode }) {
  return <span style={LABEL}>{children}</span>;
}

export function InkAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        ...LABEL,
        fontSize: 10,
        color: A.INK,
        background: 'transparent',
        border: 'none',
        // 44px tap target without disturbing the eyebrow baseline: the padding
        // grows the hit box, the negative margin cancels the layout effect.
        padding: '15px 0',
        margin: '-15px 0',
        fontFamily: SANS,
        cursor: 'pointer',
      }}
    >
      {children}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke={A.INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}

/** Glass corner chip used on every course image (when / tour / days). */
export function ImageChip({
  children,
  side = 'right',
  gold = false,
}: {
  children: React.ReactNode;
  side?: 'left' | 'right';
  gold?: boolean;
}) {
  return (
    <span
      style={{
        position: 'absolute',
        top: 8,
        [side]: 8,
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#FFFFFF',
        background: 'rgba(10,14,10,0.55)',
        border: gold ? `1px solid ${GOLD}` : '1px solid transparent',
        borderRadius: 999,
        padding: '3px 7px',
      }}
    >
      {children}
    </span>
  );
}
