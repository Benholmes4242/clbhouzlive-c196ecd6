import React from 'react';
import { A, SANS, KICKER as KICKER_LEGACY, LABEL as LABEL_LEGACY, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { SURFACE } from '@/lib/tokens/surface';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

/**
 * Course-led Discover — shared tokens and the three chrome primitives
 * (BRIEF_DISCOVER_REBUILT_COURSE_LED). Eyebrows and quiet actions are INK per
 * the app-wide flip; amber means isOwn and nothing else.
 *
 * TYPE (BRIEF_SURFACE_TOKENS_DECISION_AND_DISCOVER_PAGE): weights come from
 * the canonical scale — nothing on Discover renders at 800. The legacy
 * analytical LABEL is 9/800 and must not be edited at source, so it is
 * re-weighted to 700 here. SIZES ARE UNCHANGED (LABEL stays 9, not the
 * canonical 8) to keep the page from reflowing; colours now resolve through
 * the canonical dark-only surface ramp.
 */

/** Dark ink ramp of record for this area. Identical to A.INK / BODY / MUTE / DIM. */
export const INK = SURFACE.dark;

/** Amendment 1: Discover content is white; interface labels are one quiet tier. */
export const DISCOVER_FACT = '#FFFFFF';
export const DISCOVER_QUIET = 'rgba(255,255,255,0.70)';

export const KICKER: React.CSSProperties = { ...KICKER_LEGACY, fontWeight: 700, color: DISCOVER_QUIET };
export const LABEL: React.CSSProperties = { ...LABEL_LEGACY, fontWeight: 700, color: DISCOVER_QUIET };

export const GOLD = '#D8A93C';

/**
 * METAL SEMANTICS (BRIEF_BAND_TILES_PODIUM §0).
 *
 * GOLD MEANS BEST: the best round of the week on Discover's BEST THIS WEEK
 * podium, and the best possible score on a hole. PLATINUM MEANS RAREST: it sits
 * above gold, which is why the Honours Board's albatross card outranks its ace
 * card. BEST THIS WEEK sharing gold with the Honours Board's ace is therefore
 * not a collision: gold means "top", not "rare".
 *
 * The podium's figure line is gold even when the winning round is over par.
 * That gold reports that the round WON; it is deliberately not the ordinary
 * to-par colour grammar and must not be "fixed" back to white.
 */
export const PODIUM_ACCENT = {
  gold: GOLD,
  white: DISCOVER_FACT,
  red: TOPAR_UNDER_DARK,
  green: INDEX_DELTA.dark.improved,
} as const;

/** Low-alpha grounds used only by podium margin chips. */
export const PODIUM_GROUND = {
  gold: 'rgba(216,169,60,0.14)',
  white: 'rgba(255,255,255,0.08)',
  red: 'rgba(255,107,96,0.12)',
  green: 'rgba(74,222,128,0.12)',
  tie: 'rgba(255,255,255,0.08)',
} as const;

/** One outer shadow for the featured course's unified photograph + analytics card. */
export const FEATURED_COURSE_SHADOW = '0 8px 22px rgba(0,0,0,0.16)';
export { A, SANS, FIGS };

/** Discover content geometry: one master, all subordinate radii derived. */
/**
 * ONE SPACING RHYTHM (BRIEF_DISCOVER_ONE_PAGE §6). Every vertical measure on
 * Discover is derived from RHYTHM, so the next change is one edit. Hand-typed
 * numbers in this area are a defect: several of the values these replace were
 * tuned individually against sections that have since moved.
 *
 *   RHYTHM      section -> section, both acts
 *   ACT_GAP     above and below the media bar. A chapter break gets more air
 *               than a section break, hence 1.5x.
 *   HEAD_GAP    eyebrow (or its subline) -> the section's content
 *   CARD_GAP    card -> card in a vertical list
 *   RAIL_GAP    tile -> tile in a horizontal rail
 *   CHIP_GAP    a chip/pill row -> the content beneath it. The scope pills and
 *               the media chips share it, so the two rows read as one family.
 *   MOSAIC_GAP  the mosaic gutter. Deliberately NOT derived: a wall of stills
 *               is a wall, and 2px is a seam rather than a rhythm.
 */
export const RHYTHM = 28;
export const ACT_GAP = Math.round(RHYTHM * 1.5);
export const HEAD_GAP = Math.round(RHYTHM * 0.36);
export const CARD_GAP = Math.round(RHYTHM * 0.36);
export const RAIL_GAP = Math.round(RHYTHM * 0.36);
export const CHIP_GAP = Math.round(RHYTHM * 0.43);
export const MOSAIC_GAP = 2;
export const PAGE_GUTTER = 14;

export const CARD_RADIUS = 8;
export const WELL_RADIUS = Math.round(CARD_RADIUS * 0.85);
export const THUMBNAIL_RADIUS = Math.round(CARD_RADIUS * 0.78);
export const CHIP_RADIUS = Math.round(CARD_RADIUS * 0.5);
export const SCOPE_PILL_RADIUS = CARD_RADIUS;


export const NUMF: React.CSSProperties = {
  fontWeight: 700,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums lining-nums',
};


export const CARD_SHELL: React.CSSProperties = {
  background: A.PANEL,
  border: `1px solid ${A.BORDER}`,
  borderRadius: CARD_RADIUS,
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

/**
 * SECTION HEADING (BRIEF_DISCOVER_SECTION_HIERARCHY §1.3) — 17 / 700 /
 * -0.02em / SENTENCE CASE / INK. Sub-sections keep the 11px uppercase label
 * treatment, so the two ranks read as different KINDS, not two sizes of label.
 * The argument is unchanged and only sharper: 17 against 11 is a clearer
 * difference of kind than 15.5 against 9.5 was.
 * No colour accent, no tile, no background: colour still means over par, under
 * par or the viewing member.
 */
export const SECTION_TITLE: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 17,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: DISCOVER_QUIET,
  lineHeight: 1.2,
};

/**
 * PADDING IS `0 2px` BECAUSE CALLERS OWN THEIR GUTTER. A caller that renders
 * this bare will look pushed left — wrap it in the same horizontal padding as
 * the content beneath it (see the /community call sites).
 */

/**
 * BRIEF_DISCOVER_EYEBROWS §1 — the eyebrow is now the SAME treatment as the
 * readout above the scope pills ("6 ROUNDS · 3 COURSES · 7 DAYS"), which is
 * KICKER: 10 / 700 / 0.16em / uppercase. The readout takes MUTE; a section name
 * takes INK so the aside (FAINT/DIM) stays distinguishable beside it (§4).
 * SECTION_TITLE is left untouched at source.
 */
export const EYEBROW_TEXT: React.CSSProperties = {
  fontFamily: SANS,
  ...KICKER,
  color: DISCOVER_QUIET,
  lineHeight: 1,
};

export function Eyebrow({
  children,
  aside,
  dot = false,
  subline,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  /** True when this section contains anything new since the last visit. */
  dot?: boolean;
  /** Optional one-line description, aligned to the eyebrow's left edge. */
  subline?: React.ReactNode;
}) {
  return (
    <div style={{ padding: '0 2px', marginBottom: HEAD_GAP }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          /* The row is 20px whatever the aside is: an InkAction's line box
             measured 24 and the LABEL aside ~11, so without this the header
             height depended on WHICH aside a section passed and the shell could
             only match one of them (BRIEF_DISCOVER_EYEBROWS §5). */
          minHeight: 20,
          /* §4.3 — at 320px the action wraps below rather than the heading
             shrinking. */
          flexWrap: 'wrap',
        }}
      >
        <span style={EYEBROW_TEXT}>
          {children}
          {dot ? <NewDot /> : null}
        </span>
        {aside ? (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            {aside}
          </span>
        ) : null}
      </div>
      {subline ? (
        <div
          style={{
            marginTop: 3,
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.4,
            color: DISCOVER_QUIET,
          }}
        >
          {subline}
        </div>
      ) : null}
    </div>

  );
}

export function Aside({ children }: { children: React.ReactNode }) {
  return <span style={{ ...LABEL, lineHeight: 1 }}>{children}</span>;
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
        fontSize: 11,
        lineHeight: 1,
        color: DISCOVER_QUIET,
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
        stroke={DISCOVER_QUIET}
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
        /* READ, not AXIS: this chip carries WORDS (when / tour / days), so it
           takes the 11px floor rather than the axis exception. */
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#FFFFFF',
        background: 'rgba(10,14,10,0.55)',
        border: gold ? `1px solid ${GOLD}` : '1px solid transparent',
        borderRadius: CHIP_RADIUS,
        padding: '3px 7px',
      }}
    >
      {children}
    </span>
  );
}
