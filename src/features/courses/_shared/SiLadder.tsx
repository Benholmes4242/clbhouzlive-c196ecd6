/**
 * BRIEF_SI_LADDER_SHARED §2/§3 — THE CHART, SHARED BY BOTH SURFACES.
 *
 * ONE COMPONENT, ONE RULE, TWO VOICES. The course detail Course tab and the
 * club analytics page render THIS, differing only in copy passed as a prop.
 * There is no fork: a fork is how the two pages start disagreeing.
 *
 * §3 — WHY THE VOICE IS A PROP AND NOT A CONSTANT. On the club page the reader
 * owns the card and can act on it, so the copy says "you index it". On the
 * course tab the reader is a member who may not belong to that club at all, so
 * it says "the card indexes it" — a member reading another club's course does
 * not own that card, and a member reading their own should not be told it is
 * theirs to fix.
 *
 * §2 — THE TOGGLE RE-SORTS ROWS ONLY. Columns never swap, reorder or relabel,
 * and A FLAGGED HOLE KEEPS ITS COLOUR IN BOTH VIEWS: the verdict outranks the
 * sort indicator. Colour comes from the helper's `direction`, NEVER from a
 * line's slope — in the Holes view the left axis is hole number, which is not a
 * ranking, so slope-based colour there would flag holes for sitting late on the
 * scorecard.
 *
 * Eligibility is the caller's job only in the sense that it passes the built
 * ladder: `buildSiLadder` returns null under 100 rounds and this renders
 * nothing, so neither page needs its own gate.
 */
import React from 'react';
import RailChips from '@/components/ui/RailChips';
import { A, SANS, FIGS, LABEL, Panel, bizFigure, BIZ_BODY } from '@/features/courses/components/holes/analytical/tokens';
import type { SiLadder as SiLadderData, SiLadderRow } from './siLadder';
import { SC_FILL_BIRDIE_DK } from '@/features/courses/components/holes/_constants';

/** §2 — the verdict's two colours. Nothing else on the chart is coloured. */
const HARDER = SC_FILL_BIRDIE_DK;
const EASIER = '#34D399';
const LINE_QUIET = 'rgba(255,255,255,0.13)';

const GRID = '22px 14px 20px 1fr 26px';
const ROW_H = 16;

export type SiLadderVoice = 'club' | 'course';

/** §3 — the only difference between the two surfaces. */
const COPY: Record<SiLadderVoice, { heading: string; subline: string; closing: string; harder: string; easier: string }> = {
  club: {
    heading: 'Where your card and your difficulty order part company',
    subline:
      'How hard each hole plays for your members overall, against the position your card gives it. This is a difficulty order, which is not the same thing as a stroke index \u2014 the Stroke index check below is the one that measures a stroke index properly.',
    closing:
      'A stroke index ranks where a higher handicapper needs a shot most relative to a lower one, not which hole is hardest overall. Nothing here is a recommendation to change your card.',
    harder: 'Plays harder than you index it',
    easier: 'Plays easier than you index it',
  },
  course: {
    heading: 'Where the card and the difficulty order part company',
    subline:
      'How hard each hole plays for golfers here overall, against the position the card gives it. This is a difficulty order, which is not the same thing as a stroke index.',
    closing:
      'A stroke index ranks where a higher handicapper needs a shot most relative to a lower one, not which hole is hardest overall. Nothing here is a recommendation to change the card.',
    harder: 'Plays harder than the card indexes it',
    easier: 'Plays easier than the card indexes it',
  },
};

/** 1 -> 1st, 2 -> 2nd, 11 -> 11th. Copy only; no maths moves. */
const ordinal = (n: number) => {
  const t = n % 100;
  const suffix = t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};

const colourFor = (r: SiLadderRow) =>
  r.direction === 'harder' ? HARDER : r.direction === 'easier' ? EASIER : LINE_QUIET;

export const SiLadder: React.FC<{
  ladder: SiLadderData | null | undefined;
  voice: SiLadderVoice;
  /** Overrides the default "N rounds" basis, where a surface counts differently. */
  basis?: string;
  style?: React.CSSProperties;
}> = ({ ladder, voice, basis, style }) => {
  const [sort, setSort] = React.useState<'si' | 'hole'>('si');

  // §1 — under the eligibility line there is NO section. Not an empty state.
  if (!ladder || ladder.rows.length === 0) return null;

  const copy = COPY[voice];
  const rows = [...ladder.rows].sort((a, b) =>
    sort === 'si' ? a.strokeIndex - b.strokeIndex : a.holeNo - b.holeNo,
  );
  const n = ladder.rows.length;
  const height = n * ROW_H;
  const yFor = (i: number) => i * ROW_H + ROW_H / 2;

  // A flagged hole keeps its colour in BOTH columns; only the unflagged ink
  // follows the sort.
  const holeInk = (r: SiLadderRow) => (r.flagged ? colourFor(r) : sort === 'hole' ? A.INK : A.DIM);
  const siInk = (r: SiLadderRow) => (r.flagged ? colourFor(r) : sort === 'si' ? A.INK : A.DIM);

  return (
    <Panel
      kicker={copy.heading}
      aside={basis ?? `${ladder.rounds.toLocaleString()} rounds`}
      subline={copy.subline}
      style={style}
    >
      {/* Canonical RailChips choice pair — same treatment as the hole-order
          toggle on the club analytics page (BRIEF_ONE_CHIP_APP_WIDE). */}
      <RailChips
        options={[
          { id: 'si', label: 'Official SI' },
          { id: 'hole', label: 'Holes' },
        ]}
        value={sort}
        onChange={(next) => setSort(next as 'si' | 'hole')}
        ariaLabel="Stroke index view"
        style={{ marginBottom: 12 }}
      />

      {/* HEADERS AND ROWS SHARE ONE GRID, so Hole and SI cannot collide. */}
      <div style={{ display: 'grid', gridTemplateColumns: GRID, marginBottom: 6 }}>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'center', color: sort === 'hole' ? A.MUTE : A.DIM }}>
          Hole
        </span>
        <span />
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'center', color: sort === 'si' ? A.MUTE : A.DIM }}>
          SI
        </span>
        <span />
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'right' }}>Plays</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'start' }}>
        {/* LEFT — hole number, then stroke index. THIS ORDER NEVER CHANGES. */}
        <div>
          {rows.map((r) => (
            <div
              key={r.holeNo}
              style={{ height: ROW_H, lineHeight: `${ROW_H}px`, textAlign: 'center', fontSize: 11, fontWeight: 700, color: holeInk(r), ...FIGS }}
            >
              {r.holeNo}
            </div>
          ))}
        </div>
        <div />
        <div>
          {rows.map((r) => (
            <div
              key={r.holeNo}
              style={{ height: ROW_H, lineHeight: `${ROW_H}px`, textAlign: 'center', fontSize: 11, fontWeight: 700, color: siInk(r), ...FIGS }}
            >
              {r.strokeIndex}
            </div>
          ))}
        </div>

        {/* MIDDLE — one line per hole, always. Row position to row position. */}
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          style={{ display: 'block', overflow: 'visible' }}
        >
          {rows.map((r, i) => (
            <line
              key={r.holeNo}
              x1={2}
              y1={yFor(i)}
              x2={98}
              y2={yFor(r.measuredRank - 1)}
              stroke={colourFor(r)}
              strokeWidth={r.flagged ? 2.2 : 1.1}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* RIGHT — a BARE SCALE, 1 hardest at top. No hole numbers: the line
            tells you which hole lands where. */}
        <div>
          {Array.from({ length: n }, (_, i) => (
            <div
              key={i}
              style={{ height: ROW_H, lineHeight: `${ROW_H}px`, textAlign: 'right', fontSize: 10, fontWeight: 600, color: A.DIM, ...FIGS }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* THE LEGEND SAYS WHAT THE COLOURS MEAN, equal weight on both: neither
          error is the acceptable one. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14 }}>
        {[
          { colour: HARDER, text: copy.harder },
          { colour: EASIER, text: copy.easier },
        ].map((l) => (
          <span key={l.text} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i style={{ width: 12, height: 2.2, borderRadius: 2, background: l.colour }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: A.BODY }}>{l.text}</span>
          </span>
        ))}
      </div>

      {/* THE VERDICT SURVIVES WITHOUT READING THE CHART. */}
      {ladder.flagged.length > 0 ? (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ladder.flagged.map((r) => (
            <div
              key={r.holeNo}
              style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, fontFamily: SANS, ...FIGS }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600, color: A.BODY }}>
                {voice === 'club'
                  ? `Hole ${r.holeNo} - your card says ${r.strokeIndex}, plays ${ordinal(r.measuredRank)} hardest`
                  : `Hole ${r.holeNo} - the card says ${r.strokeIndex}, plays ${ordinal(r.measuredRank)} hardest`}
              </span>
              <span style={{ ...bizFigure(12.5, colourFor(r)), flexShrink: 0 }}>
                {r.shotsGap > 0 ? '+' : '\u2212'}
                {Math.abs(r.shotsGap).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ ...BIZ_BODY, margin: '14px 0 0' }}>
          No hole sits far enough out of position, in places and in shots, to call the card wrong on it.
        </p>
      )}

      <p style={{ ...BIZ_BODY, margin: '12px 0 0', fontSize: 11.5, color: A.DIM }}>
        A hole is marked only when it sits at least {4} places out AND at least{' '}
        {ladder.shotsFloor.toFixed(2)} of a shot away from what its declared index should return. That shots figure is
        scaled to this course's own spread, so a flat course is judged no more harshly than a dramatic one.
      </p>

      <p style={{ ...BIZ_BODY, margin: '8px 0 0', fontSize: 11.5, color: A.DIM }}>{copy.closing}</p>
    </Panel>
  );
};

export default SiLadder;
