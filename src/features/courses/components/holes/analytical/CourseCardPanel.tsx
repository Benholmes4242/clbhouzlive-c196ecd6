/**
 * CourseCardPanel - Block 1 of the analytical Course tab
 * (BRIEF_COURSE_TAB_ANALYTICAL_V2, sections 1 and 2).
 *
 * The panel leads with ONE headline figure: SLOPE RATING, with its reference
 * point (the WHS standard of 113) beside it and one plain sentence beneath.
 * PAR / COURSE RATING / YARDS drop to a counter strip under a hairline.
 *
 * When the resolved tee carries no slope the headline FALLS BACK to LENGTH and
 * the counter strip becomes PAR / COURSE RATING / SLOPE - a panel whose hero
 * figure is missing must never render blank.
 *
 * BRIEF_COURSE_CARD_EVERY_TEE: the panel now holds EVERY tee set and shows one.
 * All of them sit beneath the headline as label / graded track / slope / yardage,
 * ordered hardest first, with the resolved tee at full opacity and the rest
 * faded. Tapping a row re-reads the whole panel and writes the same remembered
 * tee the sheet's pills do - ONE selection, owned by CourseCardPanel.
 *
 * BRIEF_COURSE_CARD_SHEET_VIBRANT: the SHEET now opens the way the panel opens -
 * the slope section leads it (figure, signed delta, coloured track, every tee as
 * a row), a compressed SHAPE panel follows, then the scorecard.
 *
 * The tee PILLS are gone: the per-tee rows ARE the selector, so one control does
 * one job. The rows and the track are the SAME components the panel draws -
 * SlopeScale and TeeList are shared, not forked.
 *
 * LENGTH BARS: the old rule here read "No zebra striping, no length bars". That
 * clause is REPLACED, not deleted: the table now draws a length bar, and it is
 * SOLID INK rather than ramped, because two coloured dimensions on one row
 * fight - SI owns the colour on this table and length must not compete with it.
 * Each bar is normalised WITHIN ITS PAR TYPE; normalised across all eighteen,
 * every par 3 is a stub and the bar only repeats the PAR column.
 * Still true: no zebra striping, and no rule between hole rows.
 *
 * TYPE: nothing on the sheet renders at weight 800 and nothing below 8.5px.
 * Figures get bigger and tighter, never heavier. The scale's values are used
 * locally - the canonical KICKER / LABEL / TITLE exports are NOT repointed,
 * since ~76 files import them and that is a separate run.
 *
 * Presentation only - every figure comes from useCourseTeeSets, which the page
 * already loads. No new query.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useProfileData } from '@/hooks/useProfileData';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatNumber } from '@/i18n/format';
import { useCourseTeeSets, type TeeSet } from '../../../hooks/useCourseTeeSets';
import { shortCourseName } from '../../../_shared/courseLabel';
import { resolveDefaultTee, storageKey } from '../CourseTeeCard';
import {
  A,
  DIFFICULTY_HARD_HEX,
  FIGS,
  Hairline,
  KICKER,
  LABEL,
  SANS,
  difficultyRampColor,
} from './tokens';

/** WHS standard slope. A course of exactly 113 plays to average difficulty. */
const STANDARD_SLOPE = 113;

/**
 * THE DIFFICULTY ZONES (BRIEF_COURSE_CARD_EVERY_TEE §3).
 *
 * Slope is DIFFICULTY, so it takes neither of the app's other two coloured
 * pairs: it is not a score (no to-par pair, where UNDER par is red) and it is
 * not a movement (no index-delta pair). It takes ZONE language, the same shape
 * the handicap index tile uses, because both answer one question: where does
 * this sit on a range.
 *
 * RED HERE MEANS DEMANDING, NOT BAD. A hard course is a good course - no
 * warning tone, no icon, no copy treating a high slope as a problem.
 *
 * Declared here because no shared difficulty scale exists in the codebase; the
 * hexes themselves come from the analytical tokens (A.GREEN / A.AMBER / A.RED)
 * rather than being retyped.
 */
const ZONE_EASIER_MAX = 104; // below 105: easier than standard
const ZONE_STANDARD_MAX = 129; // 105-129: around standard; 130 and up: harder

function zoneColour(slope: number): string {
  if (slope <= ZONE_EASIER_MAX) return A.GREEN;
  if (slope <= ZONE_STANDARD_MAX) return A.AMBER;
  return A.RED;
}

interface Props {
  courseId: string | undefined;
  /** Names the sheet. Falls back to the tee title when absent. */
  courseName?: string;
}

const DASH = '\u2014';

/** ONE eyebrow treatment: the panel and its sheet render identically. */
const SHEET_EYEBROW: React.CSSProperties = {
  ...KICKER,
  fontSize: 9.5,
  letterSpacing: '0.15em',
  fontWeight: 700,
};


function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  return formatNumber(Math.round(n));
}

function fmtRating(n: number | null | undefined): string {
  return n != null && Number.isFinite(n) && n > 0 ? n.toFixed(1) : DASH;
}

/** Counter cell: figure 23/700 INK over a 7.5/700/0.14em DIM label. */
const Counter: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ textAlign: 'center', minWidth: 0 }}>
    <div
      style={{
        fontSize: 7.5,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: A.DIM,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 23,
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: A.INK,
        marginTop: 8,
        whiteSpace: 'nowrap',
        ...FIGS,
      }}
    >
      {value}
    </div>
  </div>
);

/* ── Slope scale ─────────────────────────────────────────────────────────
   The full WHS slope range with the 113 standard notched, the span between
   standard and this course filled, and the course as a ringed ink dot.
   Neutral ink only - this describes the COURSE, not a score or the member. */
const SCALE_MIN = 55;
const SCALE_MAX = 155;
const DOT = 11;

/** Zone band edges as track percentages, shared by the scale and the rows. */
const scalePct = (v: number) =>
  ((Math.min(SCALE_MAX, Math.max(SCALE_MIN, v)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

/** The three zones behind a track, at 0.22 so a fill still reads over them.
    Only the outer edges round: the joins between zones are butt ends. */
const ZoneBed: React.FC<{ radius: number }> = ({ radius }) => {
  const bands = [
    { from: SCALE_MIN, to: ZONE_EASIER_MAX + 1, colour: A.GREEN },
    { from: ZONE_EASIER_MAX + 1, to: ZONE_STANDARD_MAX + 1, colour: A.AMBER },
    { from: ZONE_STANDARD_MAX + 1, to: SCALE_MAX, colour: A.RED },
  ];
  return (
    <>
      {bands.map((z, i) => (
        <div
          key={z.colour}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${scalePct(z.from)}%`,
            width: `${scalePct(z.to) - scalePct(z.from)}%`,
            background: z.colour,
            opacity: 0.22,
            borderTopLeftRadius: i === 0 ? radius : 0,
            borderBottomLeftRadius: i === 0 ? radius : 0,
            borderTopRightRadius: i === bands.length - 1 ? radius : 0,
            borderBottomRightRadius: i === bands.length - 1 ? radius : 0,
          }}
        />
      ))}
    </>
  );
};

const SlopeScale: React.FC<{ slope: number }> = ({ slope }) => {
  const { t } = useTranslation(['courses']);

  const here = scalePct(slope);
  const std = scalePct(STANDARD_SLOPE);
  const left = Math.min(here, std);
  const width = Math.abs(here - std);
  const zone = zoneColour(slope);

  return (
    <div style={{ marginTop: 14 }} aria-hidden="true">
      <div
        style={{
          position: 'relative',
          height: 6,
          borderRadius: 3,
          background: A.TRACK,
        }}
      >
        {/* THE TRACK IS GRADED (§4). A grey track with a dot tells a member
            WHERE the number is but not WHAT IT MEANS. */}
        <ZoneBed radius={3} />
        {/* Span between standard and this course, in this tee's zone colour -
            works in both directions. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${left}%`,
            width: `${width}%`,
            borderRadius: 3,
            background: zone,
          }}
        />
        {/* Standard notch, overhanging 3px top and bottom. */}
        <div
          style={{
            position: 'absolute',
            left: `${std}%`,
            top: -3,
            bottom: -3,
            width: 1.5,
            marginLeft: -0.75,
            background: 'rgba(14,18,22,0.28)',
          }}
        />
        {/* This course. Clamped so the dot never hangs off the track. */}
        <div
          style={{
            position: 'absolute',
            left: `clamp(${DOT / 2}px, ${here}%, calc(100% - ${DOT / 2}px))`,
            top: '50%',
            width: DOT,
            height: DOT,
            marginLeft: -DOT / 2,
            marginTop: -DOT / 2,
            borderRadius: '50%',
            background: zone,
            border: '2.5px solid #FFFFFF',
            boxShadow: '0 1px 3px rgba(14,18,22,0.22)',
            boxSizing: 'border-box',
          }}
        />
      </div>
      {/* Range labels. Standard is centred on the notch but kept inside the
          card, and the range ends hold their own space so nothing overlaps. */}
      <div
        style={{
          position: 'relative',
          marginTop: 6,
          display: 'flex',
          justifyContent: 'space-between',
          ...LABEL,
          fontSize: 7,
        }}
      >
        <span>{SCALE_MIN}</span>
        <span
          style={{
            position: 'absolute',
            left: `clamp(22%, ${std}%, 78%)`,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          {t('courses:courseDetail.card.standardMark', { standard: STANDARD_SLOPE })}
        </span>
        <span>{SCALE_MAX}</span>
      </div>
    </div>
  );
};


/* ── The tee list (BRIEF_COURSE_CARD_EVERY_TEE §2) ───────────────────────
   The panel already receives EVERY tee set. WHICH TEES TO PLAY OFF is the
   decision a golfer is making on this screen, so all of them go on the panel,
   on one graded scale, hardest first.

   Ordered BY SLOPE, never by the tee's colour name: "Blue, White, Yellow, Red"
   is a convention at some clubs and meaningless at others, and this catalogue
   spans ten countries.

   The resolved tee is at full opacity and the rest at 0.34 - that is what makes
   the block a comparison rather than a list. */
/* 40px is the floor, not the rule: the rule is that every track starts on the
   same x. Where the catalogue maps several WHS courses onto one club the labels
   arrive composited ("Black - Himalayas") and 40px truncates them all to
   "BLAC...", which destroys the comparison the rows exist to make. The column
   takes the widest label in THIS list, capped, and every row shares it. */
const TEE_LABEL_W_MIN = 40;
const TEE_LABEL_W_MAX = 104;
const TEE_YARDS_W = 46;
const FADED = 0.34;

const TeeRow: React.FC<{
  tee: TeeSet;
  slope: number | null;
  on: boolean;
  labelW: number;
  /** §3: THESE ARE REAL CONTROLS. The name says the tee and its slope; the bar
      inside stays decorative. */
  a11yName: string;
  onPick: () => void;
}> = ({ tee, slope, on, labelW, a11yName, onPick }) => (
  <button
    type="button"
    onClick={onPick}
    aria-pressed={on}
    aria-label={a11yName}
    style={{
      display: 'grid',
      gridTemplateColumns: `${labelW}px 1fr auto ${TEE_YARDS_W}px`,
      alignItems: 'center',
      gap: 10,
      width: '100%',
      border: 'none',
      background: 'transparent',
      padding: '7px 0',
      cursor: 'pointer',
      fontFamily: SANS,
      textAlign: 'left',
      opacity: on ? 1 : FADED,
      transition: 'opacity 160ms ease',
      ...FIGS,
    }}
  >
    <span
      style={{
        ...LABEL,
        fontSize: 8.5,
        color: A.INK,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {tee.tee_label}
    </span>
    {/* A TEE WITH NO SLOPE DRAWS NO TRACK (§5). A zero-width bar is worse than
        an empty column: it reads as "no difficulty" rather than "not rated". */}
    {slope != null ? (
      <span style={{ position: 'relative', height: 6, borderRadius: 3, background: A.TRACK }}>
        <ZoneBed radius={3} />
        <span
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${scalePct(slope)}%`,
            borderRadius: 3,
            background: zoneColour(slope),
          }}
        />
      </span>
    ) : (
      <span aria-hidden="true" />
    )}
    <span style={{ fontSize: 14, fontWeight: 700, color: A.INK, minWidth: 24, textAlign: 'right' }}>
      {slope != null ? slope : ''}
    </span>
    <span style={{ ...LABEL, fontSize: 8.5, color: A.DIM, textAlign: 'right' }}>
      {tee.total_yards == null ? '' : fmtInt(tee.total_yards)}
    </span>
  </button>
);

const TeeList: React.FC<{
  tees: TeeSet[];
  activeLabel: string;
  /**
   * THE SHEET USES THIS LIST AS ITS TEE SELECTOR (§3), so it cannot vanish the
   * way the panel's comparison can: with showAll the rows render whenever there
   * is more than one tee, slope or no slope. The panel passes nothing and keeps
   * its own behaviour exactly.
   */
  showAll?: boolean;
  onPick: (label: string) => void;
}> = ({ tees, activeLabel, showAll = false, onPick }) => {
  const { t } = useTranslation(['courses']);
  const rows = useMemo(() => {
    const withSlope = (x: TeeSet) =>
      x.slope_rating && x.slope_rating > 0 ? Math.round(x.slope_rating) : null;
    return [...tees]
      .map((tee) => ({ tee, slope: withSlope(tee) }))
      // Hardest first; unrated tees fall to the bottom, then longest first.
      .sort(
        (a, b) =>
          (b.slope ?? -1) - (a.slope ?? -1) || (b.tee.total_yards ?? 0) - (a.tee.total_yards ?? 0),
      );
  }, [tees]);

  // ONE TEE ONLY (§6): no comparison to make, and one row at full opacity is
  // just the headline repeated. IF NO TEE CARRIES A SLOPE (§5): no list at all -
  // a column of empty tracks is worse than the panel as it ships.
  if (tees.length < 2) return null;
  if (!showAll && !rows.some((r) => r.slope != null)) return null;

  // ~5.4px per character at LABEL 8.5 uppercase with 0.13em tracking.
  const labelW = Math.min(
    TEE_LABEL_W_MAX,
    Math.max(TEE_LABEL_W_MIN, ...rows.map((r) => Math.ceil(r.tee.tee_label.length * 5.4) + 2)),
  );

  return (
    <div style={{ marginTop: 14 }}>
      {rows.map(({ tee, slope }) => (
        <TeeRow
          key={tee.tee_label}
          tee={tee}
          slope={slope}
          on={tee.tee_label === activeLabel}
          labelW={labelW}
          a11yName={
            slope != null
              ? t('courses:courseDetail.card.a11yTeeRow', { tee: tee.tee_label, slope })
              : t('courses:courseDetail.card.a11yTeeRowNoSlope', { tee: tee.tee_label })
          }
          onPick={() => onPick(tee.tee_label)}
        />
      ))}
    </div>
  );
};

/* ── The sheet's TYPE SCALE (§6) ─────────────────────────────────────────
   Ben's words: slick, clean, professional. Not thick bold text.

   NOTHING HERE RENDERS AT WEIGHT 800 and NOTHING BELOW 8.5px. The principle,
   which matters more than the numbers: FIGURES GET BIGGER AND TIGHTER, NEVER
   HEAVIER. A figure should be the heaviest thing in its own block and nothing
   else needs to be.

   Declared locally ON PURPOSE. Repointing the canonical KICKER / LABEL / TITLE
   in ./tokens is an app-wide run of its own - ~76 files import them. */
const SH_KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: A.MUTE,
};

/** NO LABEL RENDERS IN DIM (§6): labels take the readable muted tone. */
const SH_LABEL: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: A.MUTE,
};

const SH_BODY: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.55,
  color: A.BODY,
};

/** Figures are tight and tabular. Size and tracking vary; weight does not. */
const shFig = (size: number, color: string = A.INK): React.CSSProperties => ({
  fontSize: size,
  fontWeight: 700,
  letterSpacing: '-0.04em',
  color,
  ...FIGS,
});

const SUMMARY_CELL: React.CSSProperties = { textAlign: 'center', minWidth: 0 };

const SHEET_PANEL: React.CSSProperties = {
  background: A.PANEL,
  border: `1px solid ${A.BORDER}`,
  borderRadius: 16,
};

/**
 * Fixed, load-bearing grid: HOLE / LENGTH (bar) / YARDS / PAR / SI (§4).
 * No cell sizes to content - the existing rule.
 */
const CARD_GRID = '26px 1fr 46px 30px 30px';
const CARD_GAP = 9;

/**
 * WHITE OR INK ON THE SI CHIP (§4.1) - COMPUTED, never a hardcoded stroke-index
 * threshold, because the ramp is imported and its darkness is not ours to
 * assume. Standard sRGB relative luminance off the ramp's own rgb() string.
 */
function chipInk(rgb: string): string {
  const m = rgb.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) return A.INK;
  const lin = m.slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return L < 0.45 ? '#FFFFFF' : A.INK;
}

/** SI 1 sits at the ramp's hard end, SI 18 at its light end. */
function siRampT(si: number, minSi: number, maxSi: number): number {
  if (maxSi <= minSi) return 1;
  return (maxSi - si) / (maxSi - minSi);
}

/**
 * LENGTH BARS ARE NORMALISED WITHIN PAR TYPE (§4.2), and this is the part that
 * matters. Normalised across all eighteen, every par 3 is a stub and the bar
 * only repeats what the PAR column already says. Within type, a 194-yard par 3
 * reads as the harder tee shot than a 161.
 *
 * The shortest hole of a type is FLOORED near a quarter width so it is still a
 * bar; a par type holding one hole renders full width.
 */
const BAR_FLOOR = 0.26;

function lengthBarWidths(
  holes: { hole_no: number; par: number | null; yards: number | null }[],
): Map<number, number> {
  const byPar = new Map<number, { hole_no: number; yards: number }[]>();
  for (const h of holes) {
    if (h.par == null || h.yards == null || !Number.isFinite(Number(h.yards))) continue;
    const key = Number(h.par);
    const list = byPar.get(key) ?? [];
    list.push({ hole_no: h.hole_no, yards: Number(h.yards) });
    byPar.set(key, list);
  }
  const out = new Map<number, number>();
  for (const list of byPar.values()) {
    const min = Math.min(...list.map((x) => x.yards));
    const max = Math.max(...list.map((x) => x.yards));
    for (const x of list) {
      const k = max === min ? 1 : BAR_FLOOR + (1 - BAR_FLOOR) * ((x.yards - min) / (max - min));
      out.set(x.hole_no, k);
    }
  }
  return out;
}

/**
 * TOUGHEST RUN IS DEFINED, NOT PICKED (§5): the three CONSECUTIVE holes with
 * the lowest mean stroke index, ties resolving to the EARLIEST run.
 *
 * IT DOES NOT WRAP 18 -> 1. A run of "17-18-1" cannot be printed as a range
 * without reading as a typo, and printing it as "17-1" reads as a range running
 * backwards. A stretch on the card is a stretch a member walks in order, so the
 * runs considered are 1-3 through 16-18 only.
 */
function toughestRun(
  holes: { hole_no: number; si: number | null }[],
): { from: number; to: number } | null {
  const si = holes.map((h) => (h.si == null ? null : Number(h.si)));
  let best: { from: number; to: number; mean: number } | null = null;
  for (let i = 0; i + 2 < holes.length; i++) {
    const trio = [si[i], si[i + 1], si[i + 2]];
    if (trio.some((v) => v == null || !Number.isFinite(v))) continue;
    const mean = (trio as number[]).reduce((a, b) => a + b, 0) / 3;
    if (!best || mean < best.mean) {
      best = { from: holes[i].hole_no, to: holes[i + 2].hole_no, mean };
    }
  }
  return best ? { from: best.from, to: best.to } : null;
}

/** Shape cell: figure over a label, with an optional small uppercase tail. */
const ShapeCell: React.FC<{
  label: string;
  value: string;
  tail?: string | null;
  size?: number;
  color?: string;
}> = ({ label, value, tail, size = 20, color = A.INK }) => (
  <div style={{ minWidth: 0 }}>
    <div style={SH_LABEL}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 6 }}>
      <span style={{ ...shFig(size, color), whiteSpace: 'nowrap' }}>{value}</span>
      {tail ? (
        <span style={{ ...SH_LABEL, fontSize: 8.5, whiteSpace: 'nowrap' }}>{tail}</span>
      ) : null}
    </div>
  </div>
);

/**
 * THE SHAPE PANEL (§5) - what the card currently makes a member count by eye.
 * Every figure derives from the tee set the page ALREADY loads: no new query,
 * no SQL, nothing scoring-derived (§7).
 *
 * A CELL WITHOUT A VALUE IS OMITTED and the row rebalances - no dashes, no
 * zeros. If nothing resolves, the panel does not render at all.
 */
const ShapePanel: React.FC<{
  holes: { hole_no: number; par: number | null; yards: number | null; si: number | null }[];
}> = ({ holes }) => {
  const { t } = useTranslation(['courses']);

  const parMix = useMemo(() => {
    const counts = [3, 4, 5].map((par) => ({
      par,
      n: holes.filter((h) => h.par != null && Number(h.par) === par).length,
    }));
    return counts.some((c) => c.n > 0) ? counts : null;
  }, [holes]);

  const longest = useMemo(() => {
    const withYards = holes.filter((h) => h.yards != null && Number.isFinite(Number(h.yards)));
    if (withYards.length === 0) return null;
    return withYards.reduce((a, b) => (Number(b.yards) > Number(a.yards) ? b : a));
  }, [holes]);

  const si1 = useMemo(() => {
    const withSi = holes.filter((h) => h.si != null && Number.isFinite(Number(h.si)));
    if (withSi.length === 0) return null;
    return withSi.reduce((a, b) => (Number(b.si) < Number(a.si) ? b : a));
  }, [holes]);

  const run = useMemo(() => toughestRun(holes), [holes]);

  const cells: React.ReactNode[] = [];
  if (longest) {
    cells.push(
      <ShapeCell
        key="longest"
        label={t('courses:courseDetail.card.shape.longest')}
        value={fmtInt(longest.yards)}
        tail={t('courses:courseDetail.card.shape.holeTail', { n: longest.hole_no })}
      />,
    );
  }
  if (si1) {
    cells.push(
      <ShapeCell
        key="si1"
        label={t('courses:courseDetail.card.shape.strokeIndexOne')}
        value={String(si1.hole_no)}
        tail={
          si1.yards != null
            ? t('courses:courseDetail.card.shape.yardsTail', { yards: fmtInt(si1.yards) })
            : null
        }
        color={DIFFICULTY_HARD_HEX}
      />,
    );
  }
  if (run) {
    /* ONE SIZE DOWN so the range never wraps, and NO TAIL - the stroke indices
       are not shown here. */
    cells.push(
      <ShapeCell
        key="run"
        label={t('courses:courseDetail.card.shape.toughestRun')}
        value={`${run.from}\u2013${run.to}`}
        size={17}
        color={difficultyRampColor(0.72)}
      />,
    );
  }

  if (!parMix && cells.length === 0) return null;

  return (
    <div style={{ ...SHEET_PANEL, padding: '16px 16px 15px' }}>
      {/* THE PAR MIX: three counts spread evenly across the FULL panel width,
          each figure CENTRED DIRECTLY ABOVE ITS OWN LABEL. No bar, no stacked
          segments, no legend. */}
      {parMix ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {parMix.map((c) => (
            <div key={c.par} style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={shFig(24)}>{c.n}</div>
              <div style={{ ...SH_LABEL, marginTop: 5 }}>
                {t('courses:courseDetail.card.shape.parN', { n: c.par })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {cells.length > 0 ? (
        <>
          {parMix ? <Hairline style={{ marginTop: 15 }} /> : null}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
              gap: 10,
              paddingTop: parMix ? 14 : 0,
            }}
          >
            {cells}
          </div>
        </>
      ) : null}
    </div>
  );
};

/* The sheet does NOT hold its own selected tee (§2): the panel owns it, and the
   tee ROWS - the sheet's only tee control now that the pills are gone - write
   to the same state, so the two surfaces can never diverge. */
const SheetBody: React.FC<{
  tees: TeeSet[];
  selected: string;
  onPick: (label: string) => void;
}> = ({ tees, selected, onPick }) => {
  const { t } = useTranslation(['courses']);

  const active = useMemo(
    () => tees.find((x) => x.tee_label === selected) ?? tees[0],
    [tees, selected],
  );

  const holes = useMemo(
    () => [...(active?.holes ?? [])].sort((a, b) => a.hole_no - b.hole_no),
    [active],
  );
  const out = holes.filter((h) => h.hole_no <= 9);
  const inn = holes.filter((h) => h.hole_no > 9);

  const bars = useMemo(() => lengthBarWidths(holes), [holes]);

  /** SI chips grade across the card's OWN spread, not an assumed 1-18. */
  const siRange = useMemo(() => {
    const vals = holes
      .map((h) => (h.si == null ? null : Number(h.si)))
      .filter((v): v is number => v != null && Number.isFinite(v));
    if (vals.length === 0) return null;
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [holes]);

  /** An incomplete total is not a total: one missing hole omits the figure. */
  const sum = (list: typeof holes, key: 'par' | 'yards'): number | null => {
    let total = 0;
    for (const h of list) {
      const v = h[key];
      if (v == null || !Number.isFinite(Number(v))) return null;
      total += Number(v);
    }
    return total;
  };

  if (!active) return null;

  /* THE SLOPE SECTION LEADS THE SHEET (§2), and the FALLBACK CARRIES: a tee with
     no slope promotes LENGTH to the headline exactly as the panel does, so a
     panel whose hero figure is missing never renders blank. */
  const slope =
    active.slope_rating && active.slope_rating > 0 ? Math.round(active.slope_rating) : null;
  const delta = slope != null ? slope - STANDARD_SLOPE : null;
  const deltaText =
    delta == null ? '' : delta > 0 ? `+${delta}` : delta < 0 ? `\u2212${Math.abs(delta)}` : 'E';
  const sentence =
    delta == null
      ? null
      : delta > 0
      ? t('courses:courseDetail.card.playsHarder')
      : delta < 0
      ? t('courses:courseDetail.card.playsEasier')
      : t('courses:courseDetail.card.playsAverage');

  const footCells = [
    { label: t('courses:teeCard.stat.par'), value: active.par_total ? String(active.par_total) : null },
    {
      label: t('courses:courseDetail.card.courseRating'),
      value:
        active.course_rating && active.course_rating > 0 ? active.course_rating.toFixed(1) : null,
    },
    slope != null
      ? { label: t('courses:teeCard.stat.yards'), value: active.total_yards == null ? null : fmtInt(active.total_yards) }
      : { label: t('courses:teeCard.stat.slope'), value: null },
  ].filter((c) => c.value != null);

  const summaryRow = (label: string, list: typeof holes, figSize: number) => {
    const y = sum(list, 'yards');
    const p = sum(list, 'par');
    return (
      <div
        key={label}
        style={{
          display: 'grid',
          gridTemplateColumns: CARD_GRID,
          alignItems: 'center',
          gap: CARD_GAP,
          padding: '9px 0',
          borderTop: `1px solid ${A.HAIRLINE}`,
        }}
      >
        <span style={{ ...SH_LABEL, color: A.INK }}>{label}</span>
        <span aria-hidden="true" />
        <span style={{ ...shFig(figSize), textAlign: 'right' }}>
          {y == null ? '' : formatNumber(Math.round(y))}
        </span>
        <span style={{ ...shFig(figSize), textAlign: 'right' }}>{p == null ? '' : p}</span>
        <span aria-hidden="true" />
      </div>
    );
  };

  const holeRow = (h: (typeof holes)[number]) => {
    /* PAR 3 SITS ONE STEP BACK (§4.3) - a lighter weight and the muted tone, so
       par type is readable down the column without a fourth colour. */
    const isShort = h.par != null && Number(h.par) === 3;
    const barK = bars.get(h.hole_no) ?? null;
    const siChip =
      h.si != null && siRange != null
        ? difficultyRampColor(siRampT(Number(h.si), siRange.min, siRange.max))
        : null;

    return (
      <div
        key={h.hole_no}
        style={{
          display: 'grid',
          gridTemplateColumns: CARD_GRID,
          alignItems: 'center',
          gap: CARD_GAP,
          padding: '8px 0',
        }}
      >
        <span style={shFig(13)}>{h.hole_no}</span>

        {/* LENGTH: a SOLID ink bar, not a ramp and not a fading gradient - the
            register does not do faded. SI owns the colour on this row. */}
        {barK != null ? (
          <span
            aria-hidden="true"
            style={{ display: 'block', height: 4, borderRadius: 2, background: A.TRACK }}
          >
            <span
              style={{
                display: 'block',
                height: '100%',
                width: `${Math.round(barK * 100)}%`,
                borderRadius: 2,
                background: isShort ? 'rgba(14,18,22,0.34)' : A.INK,
              }}
            />
          </span>
        ) : (
          <span aria-hidden="true" />
        )}

        <span
          style={{
            ...shFig(13, isShort ? A.MUTE : A.BODY),
            fontWeight: isShort ? 500 : 600,
            textAlign: 'right',
          }}
        >
          {h.yards == null ? '' : formatNumber(Math.round(h.yards))}
        </span>

        <span
          style={{
            ...shFig(13, isShort ? A.MUTE : A.INK),
            fontWeight: isShort ? 500 : 700,
            textAlign: 'right',
          }}
        >
          {h.par}
        </span>

        {/* SI TAKES THE RAMP (§4.1). Numerals go white or ink by COMPUTED
            luminance - never a hardcoded stroke-index threshold. */}
        <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {siChip ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 24,
                height: 19,
                padding: '0 5px',
                borderRadius: 5,
                background: siChip,
                ...shFig(11.5, chipInk(siChip)),
                letterSpacing: '-0.02em',
              }}
            >
              {h.si}
            </span>
          ) : null}
        </span>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 16px 32px', display: 'grid', gap: 12 }}>
      {/* ── a-f: THE SLOPE SECTION, one panel, leading the sheet ───────────── */}
      <div style={{ ...SHEET_PANEL, padding: '16px 16px 15px' }}>
        <div style={SH_KICKER}>
          {`${
            slope != null
              ? t('courses:courseDetail.card.slopeLabel')
              : t('courses:courseDetail.card.lengthLabel')
          } \u00B7 ${t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })}`}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span style={{ ...shFig(44), letterSpacing: '-0.05em', lineHeight: 0.94 }}>
            {slope != null ? slope : fmtInt(active.total_yards)}
          </span>
          {slope != null ? (
            <>
              {/* The delta takes the ramp's HARD END. Red means DEMANDING: a
                  demanding course is a good course, and nothing on this sheet is
                  a score or a member, so nothing here takes the to-par red. */}
              <span style={shFig(17, DIFFICULTY_HARD_HEX)}>{deltaText}</span>
              <span style={SH_BODY}>
                {t('courses:courseDetail.card.vsStandard', { standard: STANDARD_SLOPE })}
              </span>
            </>
          ) : (
            <span style={SH_BODY}>{t('courses:courseDetail.card.yardsUnit')}</span>
          )}
        </div>

        {/* THE SAME SlopeScale THE PANEL DRAWS - shared, not forked. */}
        {slope != null ? <SlopeScale slope={slope} /> : null}

        {/* THE TEE ROWS ARE THE TEE SELECTOR (§3). The pills are gone: tapping a
            row switches the whole sheet, and it writes the same remembered tee. */}
        <TeeList tees={tees} activeLabel={active.tee_label} showAll onPick={onPick} />

        {slope != null && sentence ? (
          <p style={{ ...SH_BODY, margin: '14px 0 0' }}>{sentence}</p>
        ) : null}

        {footCells.length > 0 ? (
          <>
            <Hairline style={{ marginTop: 15 }} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${footCells.length}, minmax(0, 1fr))`,
                paddingTop: 14,
              }}
            >
              {footCells.map((cell) => (
                <div key={cell.label} style={SUMMARY_CELL}>
                  <div style={SH_LABEL}>{cell.label}</div>
                  <div style={{ ...shFig(21), marginTop: 6, whiteSpace: 'nowrap' }}>
                    {cell.value}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* ── §5: THE SHAPE PANEL, between the slope section and the table ───── */}
      <ShapePanel holes={holes} />

      {/* ── §4: THE HOLE TABLE. No zebra striping; hairlines only above the
             summaries. NOTE: no overflow: hidden here - it kills the sticky
             header. */}
      <div style={{ ...SHEET_PANEL, padding: '0 16px 12px' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            background: A.PANEL,
            margin: '0 -16px',
            padding: '14px 16px 10px',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            display: 'grid',
            gridTemplateColumns: CARD_GRID,
            gap: CARD_GAP,
          }}
        >
          <span style={SH_LABEL}>{t('courses:teeCard.col.hole')}</span>
          <span style={SH_LABEL}>{t('courses:teeCard.col.length')}</span>
          <span style={{ ...SH_LABEL, textAlign: 'right' }}>{t('courses:teeCard.col.yards')}</span>
          <span style={{ ...SH_LABEL, textAlign: 'right' }}>{t('courses:teeCard.col.par')}</span>
          <span style={{ ...SH_LABEL, textAlign: 'right' }}>{t('courses:teeCard.col.si')}</span>
        </div>

        {out.map(holeRow)}
        {out.length > 0 && summaryRow(t('courses:teeCard.out'), out, 13)}

        {inn.length > 0 ? (
          <>
            <div style={{ height: 14 }} aria-hidden="true" />
            {inn.map(holeRow)}
            {summaryRow(t('courses:teeCard.in'), inn, 13)}
          </>
        ) : null}

        <div style={{ height: 6 }} aria-hidden="true" />
        {summaryRow(t('courses:teeCard.total'), holes, 14)}

        {/* THE RAMP IS EXPLAINED ONCE, AT THE FOOT (§4.4). Not at the head: the
            scorecard sheet has just taught us what happens when a key sits above
            data - its numerals got read as counts. */}
        {siRange ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingTop: 14,
            }}
          >
            <span style={SH_LABEL}>{t('courses:courseDetail.card.rampEasier')}</span>
            <span
              aria-hidden="true"
              style={{
                width: 76,
                height: 5,
                borderRadius: 3,
                background: `linear-gradient(90deg, ${difficultyRampColor(0)}, ${difficultyRampColor(
                  1,
                )})`,
              }}
            />
            <span style={SH_LABEL}>{t('courses:courseDetail.card.rampHarder')}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};


export const CourseCardPanel: React.FC<Props> = ({ courseId, courseName }) => {
  const { t } = useTranslation(['courses']);
  const { profile } = useProfileData();
  const { data } = useCourseTeeSets(courseId);
  const tees = useMemo<TeeSet[]>(() => data ?? [], [data]);

  const [open, setOpen] = useState(false);

  /* THE SELECTED TEE LIVES HERE (§2). The tee list and the sheet's pills are
     two doors onto ONE selection; two places holding a selected tee diverge.
     The member's remembered tee, via resolveDefaultTee and its storageKey, is
     the initial value, and a pick from either surface persists the same way. */
  const [picked, setPicked] = useState<string | null>(null);

  const resolved = useMemo<string>(() => {
    if (!courseId || tees.length === 0) return '';
    return resolveDefaultTee(tees, courseId, profile?.gender ?? null);
  }, [courseId, tees, profile?.gender]);

  const activeLabel = picked && tees.some((x) => x.tee_label === picked) ? picked : resolved;

  const active = useMemo<TeeSet | null>(() => {
    if (!courseId || tees.length === 0) return null;
    return tees.find((x) => x.tee_label === activeLabel) ?? tees[0];
  }, [courseId, tees, activeLabel]);

  const pickTee = (label: string) => {
    setPicked(label);
    try {
      window.localStorage.setItem(storageKey(courseId ?? ''), label);
    } catch {
      /* private mode - the selection is in-memory only */
    }
  };

  const slope = active?.slope_rating && active.slope_rating > 0 ? Math.round(active.slope_rating) : null;

  // Fallback telemetry: how often the catalogue has no slope for the resolved tee.
  useEffect(() => {
    if (!courseId || !active) return;
    if (slope == null) {
      analyticsEvents.track('course_card_slope_fallback', {
        course_id: courseId,
        tee: active.tee_label,
      });
    }
  }, [courseId, active, slope]);

  if (!courseId || !active) return null;

  const openSheet = () => {
    analyticsEvents.track('course_card_sheet_opened', { course_id: courseId });
    setOpen(true);
  };
  const closeSheet = () => setOpen(false);

  const yards = active.total_yards ?? null;
  const delta = slope != null ? slope - STANDARD_SLOPE : null;
  const deltaText =
    delta == null
      ? ''
      : delta > 0
      ? `+${delta}`
      : delta < 0
      ? `\u2212${Math.abs(delta)}`
      : 'E';
  const sentence =
    delta == null
      ? null
      : delta > 0
      ? t('courses:courseDetail.card.playsHarder')
      : delta < 0
      ? t('courses:courseDetail.card.playsEasier')
      : t('courses:courseDetail.card.playsAverage');

  return (
    <>
      <section
        style={{
          margin: '0 16px',
          background: A.PANEL,
          border: `1px solid ${A.BORDER}`,
          borderRadius: 16,
          padding: '18px 16px 3px',
          fontFamily: SANS,
          ...FIGS,
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span style={SHEET_EYEBROW}>{t('courses:teeCard.eyebrow')}</span>
          <button
            type="button"
            onClick={openSheet}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: SANS,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: A.INK,
              }}
            >
              {t('courses:courseDetail.card.fullCard')}
            </span>
            <span style={{ fontSize: 12, color: A.INK, fontWeight: 700 }} aria-hidden="true">
              {'\u203A'}
            </span>
          </button>
        </header>

        {/* HEADLINE: slope, or length when the catalogue carries no slope.
            The label carries the TEE - it qualifies every figure beneath it. */}
        <div
          style={{
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.DIM,
          }}
        >
          {`${
            slope != null
              ? t('courses:courseDetail.card.slopeLabel')
              : t('courses:courseDetail.card.lengthLabel')
          } \u00B7 ${t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
          <span
            style={{
              fontSize: 46,
              fontWeight: 700,
              letterSpacing: '-0.035em',
              color: A.INK,
              lineHeight: 0.92,
            }}
          >
            {slope != null ? slope : fmtInt(yards)}
          </span>
          {slope != null ? (
            <>
              {/* Difficulty is neither a score nor the viewing member - no colour. */}
              <span style={{ fontSize: 16, fontWeight: 700, color: A.INK }}>{deltaText}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: A.MUTE }}>
                {t('courses:courseDetail.card.vsStandard', { standard: STANDARD_SLOPE })}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 600, color: A.MUTE }}>
              {t('courses:courseDetail.card.yardsUnit')}
            </span>
          )}
        </div>

        {/* SLOPE SCALE - only when there is a slope to place. */}
        {slope != null ? <SlopeScale slope={slope} /> : null}

        {/* EVERY TEE SET, on the one graded scale. Tapping a row re-reads the
            whole panel: headline, scale, sentence and counter strip. */}
        <TeeList tees={tees} activeLabel={active.tee_label} onPick={pickTee} />

        {slope != null && sentence ? (
          <p
            style={{
              margin: '15px 0 0',
              fontSize: 13.5,
              fontWeight: 500,
              color: A.BODY,
              lineHeight: 1.4,
            }}
          >
            {sentence}
          </p>
        ) : null}

        {/* COUNTER STRIP under a hairline. */}
        <Hairline style={{ marginTop: 16 }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            paddingTop: 15,
          }}
        >
          <Counter label={t('courses:teeCard.stat.par')} value={active.par_total} />
          <Counter
            label={t('courses:courseDetail.card.courseRating')}
            value={fmtRating(active.course_rating)}
          />
          {slope != null ? (
            <Counter label={t('courses:teeCard.stat.yards')} value={fmtInt(yards)} />
          ) : (
            <Counter
              label={t('courses:teeCard.stat.slope')}
              value={DASH}
            />
          )}
        </div>
      </section>


      <BottomSheet
        open={open}
        onClose={closeSheet}
        variant="light"
        ariaLabelledBy="course-card-sheet-title"
        style={{
          height: 'auto',
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
          background: A.CANVAS,
        }}
      >
        <div style={{ padding: '0 16px 12px' }}>
          <div style={SHEET_EYEBROW}>{t('courses:teeCard.eyebrow')}</div>
          {/* The heading names the COURSE - it must not restate the tee pill. */}
          <h2
            id="course-card-sheet-title"
            style={{
              margin: '3px 0 0',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: A.INK,
            }}
          >
            {courseName && courseName.trim()
              ? shortCourseName(courseName)
              : t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })}
          </h2>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', fontFamily: SANS, ...FIGS }}>
          <SheetBody tees={tees} selected={active.tee_label} onPick={pickTee} />
        </div>
      </BottomSheet>
    </>
  );
};

export default CourseCardPanel;
