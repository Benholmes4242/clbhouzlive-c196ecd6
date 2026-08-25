/**
 * Analytical treatment tokens + primitives for the Course tab
 * (BRIEF_COURSE_TAB_ANALYTICAL_TREATMENT).
 *
 * Rules encoded here:
 *   - no internal divider lines; separation is a panel edge or whitespace
 *   - figures use the app sans stack with tabular-nums lining-nums (NOT a
 *     monospace face - Menlo / SF Mono / Consolas slash the zero by default
 *     and `font-feature-settings: "zero" 0` cannot switch that off)
 *   - colour means exactly three things: over par, under par, you
 *   - signed values round FIRST, then branch, so -0.04 never renders "-0.0"
 *   - absent values render nothing (no placeholder dashes)
 *
 * LEGACY SCALE (BRIEF_LEGACY_TOKENS_WEIGHT_REPOINT). The roles here - NUM,
 * LABEL, TITLE, KICKER, CAPTION - are the ANALYTICAL scale. They are NOT the
 * canonical app scale: src/lib/tokens/type.ts is canonical for new work.
 * The names collide but the roles differ, deliberately, in SIZE:
 *   legacy TITLE  13  = a PANEL heading   / canonical TITLE 17 = a SHEET title
 *   legacy LABEL   9 / 0.13em             / canonical LABEL  8 / 0.16em
 *   legacy KICKER 10 / 0.16em             / canonical KICKER 9 / 0.19em
 * Do NOT repoint these at the canonical module: that would resize every panel
 * heading across 114 importers. Weights are now 700 app-wide; nothing here
 * renders at 800.
 */

import React from 'react';
import { TOPAR_UNDER_DARK, TOPAR_UNDER_LIGHT } from '@/features/tourhub/_shared/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

/**
 * Canonical to-par RED, reused (not redeclared) from the tour tokens so one
 * red serves every golf surface. See BRIEF_UNDER_PAR_RED.
 */
export const TOPAR_RED = TOPAR_UNDER_DARK;

export const A = {
  CANVAS: '#15171F',
  PANEL: '#1B1E27',
  BORDER: 'rgba(255,255,255,0.10)',
  INK: '#F8FAFC',
  MUTE: 'rgba(248,250,252,0.62)',
  /** Detail lines: near-ink body text, heavier than MUTE. */
  BODY: 'rgba(248,250,252,0.72)',
  DIM: 'rgba(248,250,252,0.42)',
  AMBER: '#F7931E',
  AMBER_DEEP: '#F7931E',
  RED: TOPAR_UNDER_DARK,
  GREEN: '#34D77F',
  /**
   * HANDICAP INDEX MOVEMENT only (not par): IMPROVED = index came down,
   * DRIFTED = index went up. Sourced from the shared INDEX_DELTA token so one
   * pair serves every light surface. Nothing to do with the to-par convention,
   * where UNDER par is TOPAR_RED and OVER par is INK.
   */
  IMPROVED: INDEX_DELTA.dark.improved,
  DRIFTED: INDEX_DELTA.dark.drifted,
  TRACK: '#272C37',
  /**
   * The ONLY internal rule permitted inside a panel, and only to separate a
   * headline from its supporting figures, or a table body from its summary row.
   */
  HAIRLINE: 'rgba(255,255,255,0.10)',
} as const;

/**
 * NEUTRAL ink ramp for score-distribution bars.
 *
 * DECISION (BRIEF_HOLE_BY_HOLE_COLOUR): the MEMBER hole-by-hole row no longer
 * uses this - it takes RAMP_TOPAR below, because the row prints a legend naming
 * Birdie+/Par/Bogey/Double+ and one hue cannot honour it. This neutral set is
 * KEPT, not replaced, because the TOUR hole row (TournamentHoleRow) still draws
 * it and that surface was not in scope of the brief.
 */
export const RAMP = {
  birdie: 'rgba(14,18,22,0.10)',
  par: 'rgba(14,18,22,0.24)',
  bogey: 'rgba(14,18,22,0.44)',
  double: 'rgba(14,18,22,0.70)',
} as const;

/**
 * TO-PAR ramp for score-distribution bars (BRIEF_HOLE_BY_HOLE_COLOUR §1).
 *
 * UNDER par is RED at the GOOD end. That is the convention on the scorecard,
 * the friends tile, the round post and the scorecard sheet - it is NOT an error
 * and must not be "corrected" to green. OVER par darkens to ink.
 */
export const RAMP_TOPAR = {
  birdie: TOPAR_UNDER_LIGHT,
  par: '#B4BEC9',
  bogey: '#7C8B9C',
  double: '#0F172A',
} as const;

/**
 * THE DEMANDING RAMP - BRIEF_COURSE_TAB_NO_FADED_COLOUR §2.
 *
 * SIX DISCRETE STOPS, STEPPED - not an interpolation. Interpolating across
 * eighteen holes produced adjacent values that were indistinguishable, which is
 * the faded problem in another form. Every stop is a LITERAL TONE: no stop is a
 * lower-opacity or desaturated version of any other, so nothing on this tab
 * reads as a colour that failed to arrive.
 *
 * Monotone in lightness, stop 0 -> stop 5 (relative luminance
 * 0.606 / 0.414 / 0.319 / 0.143 / 0.087 / 0.050).
 *
 * Stop 2 was tuned from the brief's sampled #B8705F, which read muddy and sat
 * within 0.03 luminance of the hole-by-hole bogey slate (#7C8B9C). #D8836A is a
 * brighter terracotta, clearly warm, and 0.07 clear of the slate in lightness.
 * Stop 3 kept the sampled #C0392B - it is the only value here that has to read
 * as unambiguous red, and it does.
 *
 * RED MEANS DEMANDING. Nothing on this tab is a score or a member, so this is
 * neither the to-par red nor the member amber.
 *
 * THIS IS THE ONLY DEFINITION IN THE CODEBASE. Every consumer imports it.
 */
export const DIFFICULTY_RAMP = [
  '#C7CDD4', // 0 easiest - a solid neutral, never a faint red
  '#A6ADB6', // 1
  '#D8836A', // 2 warm middle
  '#C0392B', // 3
  '#A02219', // 4
  '#7E140F', // 5 hardest
] as const;

export const DIFFICULTY_HARD_HEX = DIFFICULTY_RAMP[5];
export const DIFFICULTY_EASY_HEX = DIFFICULTY_RAMP[0];

/** Stop by INDEX, clamped. The stepped form callers should prefer. */
export function difficultyRampStop(i: number): string {
  const k = Math.max(0, Math.min(DIFFICULTY_RAMP.length - 1, Math.round(i)));
  return DIFFICULTY_RAMP[k];
}

/**
 * 0..1 -> a STOP, not a blend. Kept for callers that hold a normalised position
 * on the course's own spread; the result is always one of the six literals.
 */
export function difficultyRampColor(t: number): string {
  const k = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
  return difficultyRampStop(Math.round(k * (DIFFICULTY_RAMP.length - 1)));
}

function relLuminance(colour: string): number | null {
  let rgb: number[] | null = null;
  const hex = colour.trim().replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  } else {
    const m = colour.match(/(\d+(?:\.\d+)?)/g);
    if (m && m.length >= 3) rgb = m.slice(0, 3).map(Number);
  }
  if (!rgb) return null;
  const lin = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/**
 * TEXT ON A RAMP TONE (§8). COMPUTED, never a hardcoded threshold: it picks
 * whichever of white or ink carries the HIGHER contrast ratio, so moving a ramp
 * stop can never silently produce an unreadable numeral. Accepts hex or rgb().
 */
export function rampInk(colour: string): string {
  const L = relLuminance(colour);
  if (L == null) return A.INK;
  const inkL = relLuminance(A.INK) ?? 0;
  const white = (1.05) / (L + 0.05);
  const ink = (Math.max(L, inkL) + 0.05) / (Math.min(L, inkL) + 0.05);
  return white >= ink ? '#FFFFFF' : A.INK;
}



export const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Tabular figures WITHOUT a monospace face - this is what removes the slash. */
export const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };

export const NUM: React.CSSProperties = {
  fontFamily: SANS,
  letterSpacing: '-0.02em',
  fontWeight: 700,
  ...FIGS,
};

/**
 * READ. Floor 11. Repointed 9 -> 11 by BRIEF_ANALYTICAL_SCALE_REPOINT (Part B).
 */
export const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: A.DIM,
};

/** READ. Floor 11. Repointed 10 -> 11 by BRIEF_ANALYTICAL_SCALE_REPOINT (Part B). */
export const KICKER: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: A.INK,
};

/** Quiet sentence-case caption. Not a figure and not a column label. */
/** READ. Repointed 10.5 -> 12 by BRIEF_ANALYTICAL_SCALE_REPOINT (Part B). */
export const CAPTION: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.01em',
  color: A.MUTE,
};

/** Horizontal rule; the only divider the analytical treatment allows. */
export const Hairline: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ height: 1, background: A.HAIRLINE, ...style }} />
);

/**
 * TITLE — HELD AT 13 BY BRIEF_ANALYTICAL_SCALE_REPOINT (Part B). DO NOT REPOINT.
 *
 * ITS NAME AND ITS ROLE HAVE DIVERGED. This is a ROLE collision, not merely a
 * name-and-size one:
 *   - It has NO external consumers. It is read only inside this file, by Panel
 *     (see the `title && !kicker` branch), so a grep for the name finds nothing.
 *   - EVERY live callsite passes an UPPERCASE string — "COUNTING STATS",
 *     "MILESTONES", "COURSE CROWNS", "STREAKS", "THRESHOLDS" — most of them in
 *     the trophy room, which has never had a type brief.
 *   - It therefore functions as a PANEL KICKER, not as a heading.
 *
 * Repointing 13 -> 16 with the rest of the READ bucket would have enlarged
 * fifteen-plus uppercase panel kickers on un-audited surfaces. It was
 * deliberately held for that reason.
 *
 * The rename stays deferred. Whoever takes it picks one of two: give Panel a
 * real sentence-cased heading path, or rename this token PANEL_LABEL.
 */
export const TITLE: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: A.INK };

export interface ToParParts { text: string; tone: string }

/**
 * Round first, then branch on the rounded value.
 * Returns null when there is nothing to show - callers render nothing.
 *
 * TONE CONVENTION (BRIEF_UNDER_PAR_RED): the member surfaces adopt the tour
 * convention. UNDER par is RED (TOPAR_RED), OVER par is INK, level is a muted
 * "E". A.GREEN / A.RED keep their values and their non-golf work (success,
 * connected, errors, rating bands) - only the tone SELECTION moved.
 */
export function toParParts(v: number | null | undefined, digits = 1): ToParParts | null {
  if (v == null || !Number.isFinite(v)) return null;
  const f = Math.pow(10, digits);
  const r = Math.round(v * f) / f;
  if (r > 0) return { text: `+${r.toFixed(digits)}`, tone: A.INK };
  if (r < 0) return { text: `\u2212${Math.abs(r).toFixed(digits)}`, tone: TOPAR_RED };
  return { text: 'E', tone: A.MUTE };
}


export const Panel: React.FC<{
  kicker?: string;
  /** Panel-level heading (13/700 INK). Used where a panel titles itself. */
  title?: string;
  /** Meta on the heading row. A node so a basis can run to two lines. */
  aside?: React.ReactNode;
  footer?: string;
  onOpen?: () => void;
  /**
   * Heading-row action (BRIEF_HOLE_BY_HOLE_REFINE §6): the panel's escape hatch
   * sits on the heading row, right-aligned, not at the foot of the list.
   */
  action?: { label: string; onClick: () => void };
  /** A 12.5/500 MUTE sentence under the heading saying what the panel shows. */
  subline?: string;
  /** Override the gap beneath the header row (px). Default 16. */
  headerGap?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ kicker, title, aside, footer, onOpen, action, subline, headerGap = 16, children, style }) => (
  <section
    style={{
      background: A.PANEL,
      border: `1px solid ${A.BORDER}`,
      borderRadius: 16,
      padding: 16,
      fontFamily: SANS,
      ...FIGS,
      ...style,
    }}
  >
    {(kicker || title || aside || action) && (
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: subline ? 5 : headerGap,
        }}
      >
        {kicker && <span style={KICKER}>{kicker}</span>}
        {title && !kicker && <span style={TITLE}>{title}</span>}
        {aside && !action && <span style={{ ...LABEL, textAlign: 'right' }}>{aside}</span>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: SANS,
              flexShrink: 0,
            }}
          >
            <span style={{ ...LABEL, color: A.INK }}>{action.label}</span>
            <span style={{ fontSize: 11, color: A.INK, fontWeight: 700 }} aria-hidden="true">
              {'\u203A'}
            </span>
          </button>
        )}
      </header>
    )}
    {subline && (
      <p
        style={{
          margin: `0 0 ${headerGap}px`,
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1.35,
          color: A.MUTE,
        }}
      >
        {subline}
      </p>
    )}

    {children}
    {footer && (
      <button
        type="button"
        onClick={onOpen}
        style={{
          marginTop: 8,
          width: '100%',
          minHeight: 32,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: 0,
          fontFamily: SANS,
        }}
      >
        <span style={{ ...LABEL, color: A.INK }}>{footer}</span>
        <span style={{ fontSize: 12, color: A.INK, fontWeight: 700 }} aria-hidden="true">
          {'\u203A'}
        </span>
      </button>
    )}
  </section>
);

export interface StatItem {
  label: string;
  value: React.ReactNode;
  tone?: string;
  sub?: string;
  subTone?: string;
  /** 'label' (default) renders the sub as a micro column label; 'caption' as prose. */
  subVariant?: 'label' | 'caption';
}

/**
 * Label line-height used to reserve a consistent label box.
 *
 * TYPE DRIVES LAYOUT HERE — ONE OF TWO PLACES IN THIS FILE. statRowLabelBox
 * below derives its minHeight from a font size, and so does the sub-line inside
 * StatRow (search subFontSize). Repoint LABEL or the sub size and every StatRow
 * in the app changes HEIGHT, not just type. The pair is deliberate: reserving
 * from the size is what keeps values on one baseline when one cell's label
 * wraps. Change one and check the other.
 */
const STATROW_LABEL_LH = 1.25;
const statRowLabelBox = (fontSize: number, lines: 1 | 2 = 2): React.CSSProperties => ({
  lineHeight: STATROW_LABEL_LH,
  minHeight: `${fontSize * STATROW_LABEL_LH * lines}px`,
});

export const StatRow: React.FC<{
  items: StatItem[];
  size?: number;
  style?: React.CSSProperties;
  /**
   * labelLines - how many lines of label to RESERVE. 2 (default) keeps every
   * value on one baseline when one cell's label wraps and the others do not.
   * Pass 1 only where the labels are known short enough never to wrap at the
   * narrowest supported width; it removes ~11px of dead space under a
   * one-line label.
   */
  labelLines?: 1 | 2;
}> = ({ items, size = 22, style, labelLines = 2 }) => {
  const anySub = items.some((it) => !!it.sub);

  /**
   * labelLines === 1 reserves NO dead line under a one-line label. Labels and
   * values are laid out as GRID ROWS rather than per-cell stacks, so a label
   * that does wrap grows its whole row and every figure stays on one baseline.
   */
  if (labelLines === 1) {
    const cols = `repeat(${items.length}, minmax(0, 1fr))`;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'end', ...style }}>
        {items.map((it) => (
          <div
            key={`l-${it.label}`}
            style={{ ...LABEL, lineHeight: STATROW_LABEL_LH, textAlign: 'center', minWidth: 0 }}
          >
            {it.label}
          </div>
        ))}
        {items.map((it) => (
          <div
            key={`v-${it.label}`}
            style={{
              ...NUM,
              fontSize: size,
              color: it.tone ?? A.INK,
              marginTop: 4,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {it.value}
          </div>
        ))}
      </div>
    );
  }

  return (

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        ...style,
      }}
    >
      {items.map((it) => {
        // Sub-line: READ, floor 11 (was pinned at 8). It reserves its own
        // height from this size — the second of the two type-drives-layout
        // sites noted at STATROW_LABEL_LH.
        const subStyle: React.CSSProperties =
          it.subVariant === 'caption' ? { ...CAPTION } : { ...LABEL };
        const subFontSize = (subStyle.fontSize as number) ?? 11;
        return (
          <div key={it.label} style={{ textAlign: 'center', minWidth: 0 }}>
            {/* Reservation keeps every value on one baseline; labels stay top-aligned. */}
            <div style={{ ...LABEL, ...statRowLabelBox(LABEL.fontSize as number, labelLines) }}>{it.label}</div>

            <div style={{ ...NUM, fontSize: size, color: it.tone ?? A.INK, marginTop: 4, whiteSpace: 'nowrap' }}>
              {it.value}
            </div>
            {anySub ? (
              <div
                style={{
                  ...subStyle,
                  marginTop: 3,
                  lineHeight: STATROW_LABEL_LH,
                  minHeight: `${subFontSize * STATROW_LABEL_LH}px`,
                  ...(it.subTone ? { color: it.subTone } : null),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {it.sub ?? '\u00A0'}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};



/**
 * Quiet uppercase text affordance shared by the lower Course-tab blocks.
 * Never a filled pill - the analytical treatment has no tinted buttons.
 */
export const Action: React.FC<{
  label: string;
  onClick: () => void;
  align?: 'left' | 'center';
  tone?: string;
  style?: React.CSSProperties;
}> = ({ label, onClick, align = 'center', tone = A.INK, style }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      minHeight: 32,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: align === 'center' ? 'center' : 'flex-start',
      gap: 6,
      padding: 0,
      fontFamily: SANS,
      ...style,
    }}
  >
    <span style={{ ...LABEL, color: tone }}>{label}</span>
    <span style={{ fontSize: 12, color: tone, fontWeight: 700 }} aria-hidden="true">
      {'\u203A'}
    </span>
  </button>
);

/**
 * EmptyState - the single empty-state treatment for every Course-detail tab
 * (BRIEF_COURSE_DETAIL_EMPTY_STATES).
 *
 * No icon tile at any size or shape, no tinted surface, no filled amber. The
 * kicker already says which surface this is. A filled button appears only where
 * the action is the surface's purpose, and it is INK.
 */
export const EmptyState: React.FC<{
  kicker?: string;
  title: string;
  body?: string;
  primary?: { label: string; onClick: () => void };
  action?: { label: string; onClick: () => void };
  guidance?: { title: string; body: string }[];
  guidanceHeading?: string;
  /** Quiet reassurance under the primary (e.g. "Takes about 30 seconds"). */
  footnote?: string;
  /**
   * ONE optional escape hatch: a band of the surface's own content between the
   * body and the primary (e.g. the platform reach figures on the business
   * empty state). Not a style hook - the caller renders its own nodes and this
   * component's own treatment is unchanged.
   */
  slot?: React.ReactNode;
  /**
   * Opt IN to the BUSINESS TYPE SCALE (17/700 title, -0.032em, 13/400 body,
   * 14.5/700 pill). Default keeps the original treatment so the course and
   * tour consumers of this component do not move.
   */
  scale?: 'default' | 'business';
  style?: React.CSSProperties;
}> = ({ kicker, title, body, primary, action, guidance, guidanceHeading, footnote, slot, scale = 'default', style }) => {
  const biz = scale === 'business';
  return (
  <Panel style={style}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: biz ? 10 : 8,
      }}
    >
      {kicker && <span style={biz ? BIZ_KICKER : KICKER}>{kicker}</span>}
      <div
        style={biz
          ? BIZ_TITLE
          : { fontSize: 16, fontWeight: 700, color: A.INK, lineHeight: 1.25 }}
      >
        {title}
      </div>
      {body && (
        <p style={biz
          ? { ...BIZ_BODY, margin: 0, maxWidth: '34em' }
          : { fontSize: 13.5, lineHeight: 1.5, color: A.MUTE, margin: 0, maxWidth: '34em' }}>
          {body}
        </p>
      )}
      {slot && <div style={{ width: '100%' }}>{slot}</div>}
      {primary && (
        <button
          type="button"
          onClick={primary.onClick}
          style={{
            marginTop: 6,
            border: 'none',
            background: A.INK,
            color: A.PANEL,
            borderRadius: 999,
            padding: biz ? '13px 24px' : '12px 22px',
            fontSize: biz ? 14.5 : 13.5,
            fontWeight: 700,
            letterSpacing: biz ? '-0.01em' : undefined,
            fontFamily: SANS,
            cursor: 'pointer',
          }}
        >
          {primary.label}
        </button>
      )}
      {action && <Action label={action.label} onClick={action.onClick} />}
      {footnote && (
        <div style={biz
          ? { fontSize: 12, fontWeight: 500, color: A.DIM }
          : { fontSize: 12, fontWeight: 600, color: A.DIM }}>{footnote}</div>
      )}
    </div>

    {guidance && guidance.length > 0 && (
      <div style={{ marginTop: biz ? 22 : 18, textAlign: 'left' }}>
        {guidanceHeading && <div style={{ ...(biz ? BIZ_LABEL : LABEL), marginBottom: 12 }}>{guidanceHeading}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {guidance.map((g) => (
            <div key={g.title}>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.INK, letterSpacing: biz ? '-0.01em' : undefined }}>{g.title}</div>
              <div style={biz
                ? { ...BIZ_BODY, marginTop: 2 }
                : { fontSize: 12.5, lineHeight: 1.45, color: A.MUTE, marginTop: 2 }}>
                {g.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </Panel>
  );
};


/* ────────────────────── THE BUSINESS TYPE SCALE ──────────────────────
   The three business surfaces (Insights, the empty state, the command
   card) read heavy because too many elements sit at maximum weight. This
   scale is FEWER BOLD ELEMENTS WITH MORE SPACE BETWEEN THEM: the figure
   is the heaviest thing in its block and nothing else needs to be.

   These are NEW exports, deliberately not a repoint of KICKER / LABEL /
   TITLE - those three have ~120 consumers across the course tab and the
   tour hub, and moving them would drag every one of those surfaces.
   Nothing on a business surface renders at weight 800. */

export const BIZ_KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: A.INK,
};

export const BIZ_LABEL: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: A.DIM,
};

export const BIZ_TITLE: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  letterSpacing: '-0.032em',
  lineHeight: 1.2,
  color: A.INK,
};

export const BIZ_BODY: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.55,
  color: A.MUTE,
};

/** Figures get bigger and TIGHTER, never heavier: 700 with -0.04em. */
export const bizFigure = (
  fontSize: number,
  color: string = A.INK,
): React.CSSProperties => ({
  fontSize,
  fontWeight: 700,
  letterSpacing: '-0.04em',
  lineHeight: 1,
  color,
  ...FIGS,
  fontFeatureSettings: '"kern" 1, "liga" 1',
});

/** The one inset every business chart region sits in, populated or not. */
export const BIZ_INSET: React.CSSProperties = {
  background: 'rgba(14,18,22,0.028)',
  borderRadius: 13,
  border: 'none',
};

/** 5px bar track. Business traffic is neither a score nor a member. */
export const BIZ_TRACK_H = 5;
