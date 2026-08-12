import React from 'react';
import { A, SANS, KICKER as KICKER_LEGACY, LABEL as LABEL_LEGACY, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { SURFACE } from '@/lib/tokens/surface';

/**
 * Course-led Discover — shared tokens and the three chrome primitives
 * (BRIEF_DISCOVER_REBUILT_COURSE_LED). Eyebrows and quiet actions are INK per
 * the app-wide flip; amber means isOwn and nothing else; GOLD is reserved for
 * legendary feats (hole in one, albatross).
 *
 * TYPE (BRIEF_SURFACE_TOKENS_DECISION_AND_DISCOVER_PAGE): weights come from
 * the canonical scale — nothing on Discover renders at 800. The legacy
 * analytical LABEL is 9/800 and must not be edited at source, so it is
 * re-weighted to 700 here. SIZES ARE UNCHANGED (LABEL stays 9, not the
 * canonical 8) to keep the page from reflowing; colours are untouched and are
 * the same values SURFACE.light records.
 */

/** Light ink ramp of record for this area. Identical to A.INK / BODY / MUTE / DIM. */
export const INK = SURFACE.light;

export const KICKER: React.CSSProperties = { ...KICKER_LEGACY, fontWeight: 700 };
export const LABEL: React.CSSProperties = { ...LABEL_LEGACY, fontWeight: 700 };

export const GOLD = '#D8A93C';
export { A, SANS, FIGS };


export const NUMF: React.CSSProperties = {
  fontWeight: 700,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums lining-nums',
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

/**
 * NEW-SINCE MARKERS (BRIEF_DISCOVER_NEW_SINCE, section 3) — all quiet, all ink.
 * A dot is a nudge, not an alarm: no counts, no colour, no "NEW" labels, and
 * never amber (amber means the viewing member and nothing else).
 */

/** 6px ink dot after a section eyebrow when that section holds anything new. */
export function NewDot() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: 999,
        background: A.INK,
        marginLeft: 6,
        verticalAlign: 'middle',
      }}
    />
  );
}

/** 1.5px ink ring on a new card/tile. Inset so it survives overflow: hidden. */
export const NEW_CARD_RING: React.CSSProperties = {
  boxShadow: `inset 0 0 0 1.5px ${A.INK}`,
};

/** 3px ink bar at a new world row's left edge, inside the card padding. */
export const NEW_ROW_BAR: React.CSSProperties = {
  width: 3,
  alignSelf: 'stretch',
  borderRadius: 999,
  background: A.INK,
  flexShrink: 0,
};

export function Eyebrow({
  children,
  aside,
  dot = false,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  /** True when this section contains anything new since the last visit. */
  dot?: boolean;
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
      <span style={KICKER}>
        {children}
        {dot ? <NewDot /> : null}
      </span>
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
        fontWeight: 700,
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
