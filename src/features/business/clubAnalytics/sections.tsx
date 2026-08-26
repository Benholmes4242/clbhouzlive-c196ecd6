/**
 * BRIEF_CLUB_ANALYTICS_PAGE_REBUILD — THE SECTIONS OF ONE COURSE BLOCK.
 *
 * IT READS AS A PAGE, NOT ONE LONG TILE (§1). Every section is its OWN CARD on
 * the canvas — A.PANEL, 1px A.BORDER, 12px radius, 16px padding — with 14px
 * between them. There is no outer container with internal rules.
 *
 * ORDER, and the order is an argument:
 *   verdict strip, WHERE YOUR INDEX DISAGREES, THE SAMPLE, HOLE BY HOLE,
 *   STROKE INDEX CHECK (locked), WHAT GETS MADE HERE, THE COURSE RECORD,
 *   YOUR TEES, WHEN YOUR COURSE PLAYS, WHO PLAYS HERE, COMPETITION OR SOCIAL.
 * The ladder leads deliberately: it is the one thing on this page no other
 * product can show a club, and it is readable in two seconds.
 *
 * FOUR RULES CARRIED FORWARD:
 *   - ZERO IS A FACT. A club with no albatrosses renders 0. The dash is
 *     reserved for "not measured" and nothing else.
 *   - NO INVENTED ROWS, and NO INVENTED TEE NAMES (§6.1). The RPC returns no
 *     tee name on purpose; the yardage IS the label.
 *   - TWO ROUND COUNTS. `rounds` is every measured round; `complete_rounds` is
 *     rounds carrying all 18 holes. A HOLE figure cites the second.
 *   - SCORING COLOUR COMES FROM THE CANON (§4). red = under par, neutral = over
 *     par. Birdie is NEVER the same colour as Double+.
 */
import React from 'react';
import {
  A, SANS, FIGS, NUM, LABEL, Panel, BIZ_LABEL, BIZ_BODY, BIZ_TITLE, bizFigure,
  BIZ_INSET, difficultyRampColor, difficultyRampStop, RAMP_TOPAR, TOPAR_RED, toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import {
  SC_BIRDIE_DARK, SC_EAGLE_DARK, SC_ALBATROSS_DARK, SC_ACE_DARK,
  SC_PAR_DARK, SC_BOGEY_DARK, SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';
import { PCT_MIN_N, MIN_BAR_PCT } from './constants';
import type { ClubCourseAnalytics, ClubAnalyticsHole, ClubAnalyticsTee } from './types';
import { sortTees, yd } from './tees';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** §2 — the ladder's colours. The verdict, not a hue for its own sake. */
const HARDER = '#FF6B60';
const EASIER = '#34D399';
const LINE_QUIET = 'rgba(255,255,255,0.13)';

/** A share below PCT_MIN_N is an absolute, not a percentage. */
function share(count: number, total: number): string {
  if (total < PCT_MIN_N) return count.toLocaleString();
  const pct = (count / total) * 100;
  if (count === 0) return '0%';
  return pct >= 1 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
}

function monthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function dayMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Whole years elapsed since a date, for the "has stood since" phrasing. */
function yearsSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
}

/* §1a — EVERY SECTION IS ITS OWN CARD. 12px radius, not the 16 the generic
   Panel carries: this page sits card-on-canvas and a softer corner reads as
   one tile again. */
const CARD: React.CSSProperties = { borderRadius: 12, padding: 16 };

const Inset: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ ...BIZ_INSET, padding: 14, ...style }}>{children}</div>
);

const Body: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <p style={{ ...BIZ_BODY, margin: 0, ...style }}>{children}</p>
);

const roundsLabel = (n: number) => `${n.toLocaleString()} ${n === 1 ? 'round' : 'rounds'}`;

/* ─────────────────── THE THREE-FIGURE STRIP ─────────────────── */

/**
 * §1b / §7 — ONE GRID SERVES THE VERDICT STRIP AND THE SAMPLE. 1fr/1fr/1fr,
 * 1px gaps showing the border through, so the figures read as one instrument
 * rather than three loose numbers.
 */
export const StatStrip: React.FC<{ cells: { figure: string; label: string; tone?: string }[] }> = ({ cells }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
      gap: 1,
      background: A.BORDER,
      border: `1px solid ${A.BORDER}`,
      borderRadius: 12,
      overflow: 'hidden',
      fontFamily: SANS,
      ...FIGS,
    }}
  >
    {cells.map((c) => (
      <div key={c.label} style={{ background: A.PANEL, padding: '13px 12px' }}>
        <div style={bizFigure(21, c.tone ?? A.INK)}>{c.figure}</div>
        <div style={{ ...LABEL, fontSize: 8.5, marginTop: 6 }}>{c.label}</div>
      </div>
    ))}
  </div>
);

/**
 * §1b — THE VERDICT STRIP OPENS EACH COURSE BLOCK, above everything. Mean
 * gross, the hardest hole, and the competition share: the three things a club
 * secretary looks for before deciding whether to keep reading.
 */
export const VerdictStrip: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const hardest = [...(data.holes ?? [])].sort((a, b) => a.measured_rank - b.measured_rank)[0];
  const c = data.competition;
  const compTotal = (c?.competition ?? 0) + (c?.social ?? 0);
  const compPct = compTotal > 0 ? Math.round(((c?.competition ?? 0) / compTotal) * 100) : null;

  return (
    <StatStrip
      cells={[
        { figure: data.avg_gross == null ? '—' : String(data.avg_gross), label: 'Mean gross' },
        { figure: hardest ? String(hardest.hole_no) : '—', label: 'Hardest hole' },
        { figure: compPct == null ? '—' : `${compPct}%`, label: 'Competition' },
      ]}
    />
  );
};

/* ─────────────────── WHERE YOUR INDEX DISAGREES ─────────────────── */

/**
 * §2 — THE LADDER. Three columns that NEVER reorder: HOLE, SI, PLAYS.
 *
 * THE FLAG IS COMPUTED FROM places_gap AND shots_gap, NEVER FROM THE LINE'S
 * SLOPE. In the Holes view the left axis is hole number, which is not a
 * ranking — a slope-based colour there would flag holes for sitting late on the
 * scorecard. Flip the toggle and the same three lines stay coloured.
 *
 * BOTH thresholds are required. Places alone flags rank noise: Sundridge's
 * holes 3, 6 and 13 sit at +0.377, +0.370 and +0.366 and occupy three separate
 * ranks. The shots gate drops those and keeps the three real ones.
 */
const PLACES_GATE = 4;
const SHOTS_GATE = 0.10;

type Flag = 'harder' | 'easier' | null;

function flagFor(h: ClubAnalyticsHole): Flag {
  const p = h.places_gap;
  const s = h.shots_gap;
  if (p == null || s == null) return null;
  if (Math.abs(p) < PLACES_GATE || Math.abs(s) < SHOTS_GATE) return null;
  return p < 0 ? 'harder' : 'easier';
}

const flagColour = (f: Flag) => (f === 'harder' ? HARDER : f === 'easier' ? EASIER : LINE_QUIET);

const LADDER_GRID = '22px 14px 20px 1fr 26px';
const ROW_H = 16;

export const IndexDisagreesSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const [sort, setSort] = React.useState<'si' | 'hole'>('si');
  const holes = (data.holes ?? []).filter((h) => h.stroke_index != null);

  if (holes.length === 0) {
    return (
      <Panel kicker="Where your index disagrees" style={CARD}>
        <Body>
          Your card declares no stroke index on the rounds we hold, so there is nothing to measure your index against.
        </Body>
      </Panel>
    );
  }

  const rows = [...holes].sort((a, b) =>
    sort === 'si' ? (a.stroke_index ?? 99) - (b.stroke_index ?? 99) : a.hole_no - b.hole_no,
  );
  const n = rows.length;
  const height = n * ROW_H;
  const yFor = (i: number) => i * ROW_H + ROW_H / 2;

  const flagged = [...holes]
    .filter((h) => flagFor(h) !== null)
    .sort((a, b) => a.measured_rank - b.measured_rank);

  const holeInk = (h: ClubAnalyticsHole) => {
    const f = flagFor(h);
    if (f) return flagColour(f);
    return sort === 'hole' ? A.INK : A.DIM;
  };
  const siInk = (h: ClubAnalyticsHole) => {
    const f = flagFor(h);
    if (f) return flagColour(f);
    return sort === 'si' ? A.INK : A.DIM;
  };

  return (
    <Panel
      kicker="Where your index disagrees"
      aside={`${data.complete_rounds.toLocaleString()} full rounds`}
      subline="Your declared stroke index on the left, the position each hole actually plays in on the right."
      style={CARD}
    >
      {/* THE TOGGLE RE-SORTS THE ROWS ONLY. The columns do not swap, do not
          reorder and do not change label. */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        {[
          { label: 'Official SI', key: 'si' as const },
          { label: 'Holes', key: 'hole' as const },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSort(t.key)}
            aria-pressed={sort === t.key}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: sort === t.key ? 700 : 600,
              color: sort === t.key ? A.INK : A.DIM,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* HEADERS AND ROWS SHARE ONE GRID, so Hole and SI cannot collide. */}
      <div style={{ display: 'grid', gridTemplateColumns: LADDER_GRID, gap: 0, marginBottom: 6 }}>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'center', color: sort === 'hole' ? A.MUTE : A.DIM }}>Hole</span>
        <span />
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'center', color: sort === 'si' ? A.MUTE : A.DIM }}>SI</span>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'center' }}>Plays</span>
        <span />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: LADDER_GRID, gap: 0, alignItems: 'start' }}>
        {/* HOLE */}
        <div>
          {rows.map((h) => (
            <div
              key={h.hole_no}
              style={{ height: ROW_H, lineHeight: `${ROW_H}px`, textAlign: 'center', fontSize: 11, fontWeight: 700, color: holeInk(h), ...FIGS }}
            >
              {h.hole_no}
            </div>
          ))}
        </div>
        <div />
        {/* SI */}
        <div>
          {rows.map((h) => (
            <div
              key={h.hole_no}
              style={{ height: ROW_H, lineHeight: `${ROW_H}px`, textAlign: 'center', fontSize: 11, fontWeight: 700, color: siInk(h), ...FIGS }}
            >
              {h.stroke_index}
            </div>
          ))}
        </div>

        {/* ONE LINE PER HOLE, left position to right position. */}
        <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
          {rows.map((h, i) => {
            const f = flagFor(h);
            return (
              <line
                key={h.hole_no}
                x1={2}
                y1={yFor(i)}
                x2={98}
                y2={yFor(h.measured_rank - 1)}
                stroke={flagColour(f)}
                strokeWidth={f ? 2.2 : 1.1}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* A BARE SCALE, 1 to 18, 1 hardest at top. No hole numbers — the line
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

      {/* THE LEGEND SAYS WHAT THE COLOURS MEAN, not which is which. Same weight
          on both: neither error is the acceptable one. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14 }}>
        {[
          { colour: HARDER, text: 'Plays harder than you index it' },
          { colour: EASIER, text: 'Plays easier than you index it' },
        ].map((l) => (
          <span key={l.text} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i style={{ width: 12, height: 2.2, borderRadius: 2, background: l.colour }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: A.BODY }}>{l.text}</span>
          </span>
        ))}
      </div>

      {/* THE VERDICT SURVIVES EVEN IF NOBODY READS THE CHART. */}
      {flagged.length > 0 ? (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {flagged.map((h) => {
            const f = flagFor(h);
            const gap = h.shots_gap ?? 0;
            return (
              <div
                key={h.hole_no}
                style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, fontFamily: SANS, ...FIGS }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 600, color: A.BODY }}>
                  Hole {h.hole_no} — you say {h.stroke_index}, plays {h.measured_rank}
                </span>
                <span style={{ ...bizFigure(12.5, flagColour(f)), flexShrink: 0 }}>
                  {gap > 0 ? '+' : '\u2212'}
                  {Math.abs(gap).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <Body style={{ marginTop: 14 }}>
          No hole sits far enough out of position, in places and in shots, for us to call your index wrong on it.
        </Body>
      )}

      <Body style={{ marginTop: 12, fontSize: 11.5, color: A.DIM }}>
        A hole is marked only when it sits at least four places out AND at least a tenth of a shot away from what its
        declared index should return. Places alone flags rank noise.
      </Body>
    </Panel>
  );
};

/* ─────────────────── THE SAMPLE, STATED PLAINLY ─────────────────── */

/**
 * §7 — THE SAMPLE IS A STAT ROW, in the same grid as the verdict strip. It is
 * the honest bit and it is also the pitch: seventeen of Sundridge's members
 * have connected and the club has hundreds. A club shown 817 rounds without the
 * member count reads it as the whole picture.
 */
export const SampleSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const since = monthYear(data.first_round);
  const sinceYear = data.first_round ? data.first_round.slice(0, 4) : null;

  return (
    <Panel kicker="The sample" style={CARD}>
      <StatStrip
        cells={[
          { figure: data.members.toLocaleString(), label: data.members === 1 ? 'Member' : 'Members' },
          { figure: data.rounds.toLocaleString(), label: data.rounds === 1 ? 'Round' : 'Rounds' },
          { figure: sinceYear ?? '—', label: 'Since' },
        ]}
      />
      <Body style={{ marginTop: 12 }}>
        That is every member of your club who has connected their handicap record to clbhouz, and every round of theirs
        played here{since ? ` since ${since}` : ''}. The more of your members are connected, the sharper this picture
        gets — each one adds rounds to every figure below, and to the stroke index check.
      </Body>
      <Body style={{ marginTop: 10, fontSize: 12, color: A.DIM }}>
        {data.complete_rounds.toLocaleString()} of those rounds carry all 18 holes, and hole figures are taken from
        those. {data.avg_gross != null ? `The mean 18-hole gross returned here is ${data.avg_gross}.` : ''}
      </Body>
    </Panel>
  );
};

/* ─────────────────── HOLE BY HOLE ─────────────────── */

/**
 * §3 — HOLE BY HOLE TAKES THE DIFFICULTY RAMP, the same one the course detail
 * page uses. Tinted across the 18 avg_to_par values, min to max. There is NO
 * second ramp.
 *
 * §6.5 — HOLE AND PAR GET THEIR OWN GRID COLUMNS. They had collided into
 * "HOLEPAR" at 26px each.
 */
const CLUB_HOLE_GRID = '34px 30px 28px 1fr 38px 48px';

/** §3 / §4 — the four-way split, in scorecard colours. */
const SPLIT_TIERS = [
  { key: 'birdie_plus' as const, label: 'Birdie +', colour: SC_BIRDIE_DARK },
  { key: 'par_count' as const, label: 'Par', colour: SC_PAR_DARK },
  { key: 'bogey' as const, label: 'Bogey', colour: SC_BOGEY_DARK },
  { key: 'double_plus' as const, label: 'Double +', colour: SC_DOUBLE_DARK },
];

const DistributionStrip: React.FC<{ counts: number[]; total: number }> = ({ counts, total }) => (
  <Inset style={{ padding: 12 }}>
    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: A.TRACK }}>
      {SPLIT_TIERS.map((t, i) => {
        const c = counts[i] ?? 0;
        if (c === 0) return null;
        return <i key={t.key} style={{ width: `${Math.max(MIN_BAR_PCT, (c / total) * 100)}%`, background: t.colour }} />;
      })}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12 }}>
      {SPLIT_TIERS.map((t, i) => (
        <span key={t.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 7, height: 7, borderRadius: 2, background: t.colour, flexShrink: 0 }} />
          <span style={{ ...LABEL, fontSize: 9 }}>{t.label}</span>
          <span style={bizFigure(12, A.INK)}>{(counts[i] ?? 0).toLocaleString()}</span>
          <span style={bizFigure(11, A.DIM)}>{share(counts[i] ?? 0, total)}</span>
        </span>
      ))}
    </div>
  </Inset>
);

export const HoleBySection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const [hardestFirst, setHardestFirst] = React.useState(false);
  const [openHole, setOpenHole] = React.useState<number | null>(null);
  const holes = data.holes ?? [];

  if (holes.length === 0) {
    return (
      <Panel kicker="Hole by hole" style={CARD}>
        <Body>We hold no hole rows for this course, so there is nothing to rank.</Body>
      </Panel>
    );
  }

  const rows = [...holes].sort((a, b) =>
    hardestFirst ? a.measured_rank - b.measured_rank : a.hole_no - b.hole_no,
  );

  // THE RAMP IS TAKEN ACROSS THE OBSERVED SPREAD, min to max, exactly as the
  // course detail page does it.
  const values = holes.map((h) => h.avg_to_par);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const tFor = (v: number) => (hi === lo ? 1 : (v - lo) / (hi - lo));

  const o = data.outcomes;
  const stripCounts = o
    ? [o.birdie + o.eagle + o.albatross + o.ace, o.par, o.bogey, o.double_plus]
    : null;
  const stripTotal = stripCounts ? stripCounts.reduce((s, v) => s + v, 0) : 0;

  return (
    <Panel
      kicker="Hole by hole"
      aside={`${data.complete_rounds.toLocaleString()} full rounds`}
      subline="Your declared stroke index beside the position each hole actually plays in, 1 being the hardest."
      style={CARD}
    >
      {stripCounts && stripTotal > 0 && (
        <div style={{ marginBottom: 14 }}>
          <DistributionStrip counts={stripCounts} total={stripTotal} />
        </div>
      )}

      {/* CARD ORDER IS THE DEFAULT. Text-only toggle, no fills. */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        {[
          { label: 'Card order', on: !hardestFirst, next: false },
          { label: 'Hardest first', on: hardestFirst, next: true },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setHardestFirst(t.next)}
            aria-pressed={t.on}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: t.on ? 700 : 600,
              color: t.on ? A.INK : A.DIM,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: CLUB_HOLE_GRID, gap: 8, paddingBottom: 8 }}>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'center' }}>Hole</span>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'center' }}>Par</span>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'center' }}>SI</span>
        <span style={{ ...LABEL, fontSize: 8.5 }}>Measured</span>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'right' }}>Rank</span>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'right' }}>To par</span>
      </div>

      {rows.map((h) => {
        const parts = toParParts(h.avg_to_par);
        const t = tFor(h.avg_to_par);
        const width = Math.max(4, t * 100);
        const out = h.stroke_index != null ? Math.abs(h.stroke_index - h.measured_rank) : null;
        const open = openHole === h.hole_no;
        const holeTotal = h.birdie_plus + h.par_count + h.bogey + h.double_plus;
        return (
          <div key={h.hole_no}>
            <button
              type="button"
              onClick={() => setOpenHole(open ? null : h.hole_no)}
              aria-expanded={open}
              style={{
                display: 'grid',
                gridTemplateColumns: CLUB_HOLE_GRID,
                gap: 8,
                alignItems: 'center',
                width: '100%',
                padding: '8px 0',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: SANS,
                ...FIGS,
              }}
            >
              <span style={{ ...NUM, fontSize: 15, color: A.INK, textAlign: 'center' }}>{h.hole_no}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: A.MUTE, textAlign: 'center' }}>
                {h.par ?? '\u2014'}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: out != null && out >= 6 ? 700 : 600,
                  color: out != null && out >= 6 ? A.INK : A.MUTE,
                  textAlign: 'center',
                }}
              >
                {h.stroke_index ?? '\u2014'}
              </span>
              <span style={{ height: 5, borderRadius: 3, background: A.TRACK, display: 'block', overflow: 'hidden' }}>
                <i style={{ display: 'block', height: '100%', width: `${width}%`, background: difficultyRampColor(t) }} />
              </span>
              <span style={{ ...NUM, fontSize: 13, color: A.INK, textAlign: 'right' }}>{h.measured_rank}</span>
              <span style={{ ...NUM, fontSize: 13, color: parts?.tone ?? A.INK, textAlign: 'right' }}>
                {parts?.text ?? '\u2014'}
              </span>
            </button>

            {/* TAP A HOLE for its own split, in scorecard colours. */}
            {open && holeTotal > 0 && (
              <div style={{ paddingBottom: 10 }}>
                <Inset style={{ padding: 12 }}>
                  <div style={{ ...LABEL, fontSize: 9, marginBottom: 10 }}>
                    Hole {h.hole_no} · {holeTotal.toLocaleString()} rounds
                  </div>
                  <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: A.TRACK }}>
                    {SPLIT_TIERS.map((tier) => {
                      const c = h[tier.key] ?? 0;
                      if (c === 0) return null;
                      return <i key={tier.key} style={{ width: `${Math.max(MIN_BAR_PCT, (c / holeTotal) * 100)}%`, background: tier.colour }} />;
                    })}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
                    {SPLIT_TIERS.map((tier) => (
                      <span key={tier.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <i style={{ width: 7, height: 7, borderRadius: 2, background: tier.colour, flexShrink: 0 }} />
                        <span style={{ ...LABEL, fontSize: 9 }}>{tier.label}</span>
                        <span style={bizFigure(12, A.INK)}>{(h[tier.key] ?? 0).toLocaleString()}</span>
                      </span>
                    ))}
                  </div>
                </Inset>
              </div>
            )}
          </div>
        );
      })}

      <Body style={{ marginTop: 10, fontSize: 11.5, color: A.DIM }}>
        SI is the stroke index your card declares. Rank is where the hole sits on mean strokes over par across
        {` ${data.complete_rounds.toLocaleString()} `}
        full rounds. Tap a hole for its own split. A dash means we hold no figure for that hole.
      </Body>
    </Panel>
  );
};

/* ─────────────────── THE STROKE INDEX RECOMMENDATION ─────────────────── */

/**
 * GATED, AND THE GATE IS THE POINT. Read si_advice_state, never si_advice's
 * presence.
 *
 * A stroke index ranks WHERE A HIGHER HANDICAPPER NEEDS A SHOT MOST relative to
 * a lower one — not raw difficulty. That needs both bands well sampled. At
 * Sundridge East there are 541 low-handicap hole rows and 18 high; eighteen rows
 * is roughly one round, and a recommendation built on it falls apart the moment
 * a handicap secretary asks how many players it came from.
 *
 * So below the gate NO RANKING RENDERS ANYWHERE HERE, the shortfall is named,
 * and that is the strongest "get your members on clbhouz" argument on the page.
 * It is the commercial mechanic: it is NEVER softened into a generic
 * "not enough data".
 */
export const StrokeIndexSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const gate = data.si_band_rows;
  const ready = data.si_advice_state === 'ready' && (data.si_advice?.length ?? 0) > 0;

  if (!ready) {
    const threshold = gate?.threshold ?? 200;
    return (
      <Panel kicker="Stroke index check" aside="Locked" style={CARD}>
        <div style={{ ...BIZ_TITLE, marginBottom: 8 }}>We will not rank your stroke index on this sample</div>
        <Body>
          A stroke index is not a difficulty order. It ranks where a higher handicapper needs a shot most relative to a
          lower one, so it can only be measured when both ends of the handicap range have played every hole enough
          times.
        </Body>
        {gate && (
          <Inset style={{ marginTop: 12 }}>
            <div style={{ ...BIZ_LABEL, marginBottom: 10 }}>What we hold on your thinnest hole</div>
            <div style={{ display: 'flex', gap: 22 }}>
              {[
                { label: 'Lower handicaps', value: gate.min_low_rows },
                { label: 'Higher handicaps', value: gate.min_high_rows },
                { label: 'Needed, each', value: threshold },
              ].map((s) => (
                <div key={s.label}>
                  <div style={bizFigure(19, s.value < threshold ? TOPAR_RED : A.INK)}>
                    {s.value.toLocaleString()}
                  </div>
                  <div style={{ ...LABEL, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Inset>
        )}
        <Body style={{ marginTop: 12 }}>
          {gate
            ? `Your higher-handicap side stands at ${gate.min_high_rows.toLocaleString()} hole ${
                gate.min_high_rows === 1 ? 'row' : 'rows'
              } on the thinnest hole — roughly ${Math.max(1, Math.round(gate.min_high_rows / 18))} ${
                Math.round(gate.min_high_rows / 18) === 1 ? 'round' : 'rounds'
              }. We need ${threshold.toLocaleString()} on every hole in both bands before we will put a recommendation in front of your handicap secretary.`
            : `We need ${threshold.toLocaleString()} hole rows in each handicap band, on every hole, before we will put a recommendation in front of your handicap secretary.`}{' '}
          Every higher-handicap member who connects to clbhouz moves that number, and they are the members this
          measurement is waiting on.
        </Body>
      </Panel>
    );
  }

  const rows = data.si_advice ?? [];
  return (
    <Panel
      kicker="Stroke index check"
      aside={`${data.complete_rounds.toLocaleString()} full rounds`}
      subline="Where a higher handicapper needs the shot most, measured against the index your card declares."
      style={CARD}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr 48px 48px', gap: 10, paddingBottom: 8 }}>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'center' }}>Hole</span>
        <span style={{ ...LABEL, fontSize: 8.5 }}>Shot needed</span>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'right' }}>Declared</span>
        <span style={{ ...LABEL, fontSize: 8.5, textAlign: 'right' }}>Measured</span>
      </div>
      {rows.map((r) => {
        const spread = r.spread ?? 0;
        const max = rows.reduce((m, x) => Math.max(m, Math.abs(x.spread ?? 0)), 0.01);
        const t = Math.min(1, Math.abs(spread) / max);
        return (
          <div
            key={r.hole_no}
            style={{
              display: 'grid',
              gridTemplateColumns: '26px 1fr 48px 48px',
              gap: 10,
              alignItems: 'center',
              padding: '8px 0',
              fontFamily: SANS,
              ...FIGS,
            }}
          >
            <span style={{ ...NUM, fontSize: 15, color: A.INK, textAlign: 'center' }}>{r.hole_no}</span>
            <span style={{ height: 5, borderRadius: 3, background: A.TRACK, display: 'block', overflow: 'hidden' }}>
              <i style={{ display: 'block', height: '100%', width: `${Math.max(4, t * 100)}%`, background: difficultyRampColor(t) }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: A.MUTE, textAlign: 'right' }}>
              {r.declared ?? '\u2014'}
            </span>
            <span style={{ ...NUM, fontSize: 13, color: A.INK, textAlign: 'right' }}>
              {r.should_be ?? '\u2014'}
            </span>
          </div>
        );
      })}
      <Body style={{ marginTop: 10, fontSize: 11.5, color: A.DIM }}>
        Measured is the order of the gap between what higher and lower handicaps return on each hole. It is a
        measurement of your course, not a statement that your card is incorrect.
      </Body>
    </Panel>
  );
};

/* ─────────────────── WHAT GETS MADE HERE ─────────────────── */

interface Outcome { key: string; label: string; count: number; colour: string }

/**
 * §4 — SCORING COLOURS COME FROM THE CANON. red = under par, neutral = over
 * par, gold = celebration. Bogey and double are separated by BRIGHTNESS, not
 * hue: that is deliberate and recorded in _constants.ts. Do not colour them.
 *
 * EMPTY TIERS COLLAPSE. Three consecutive zero rows eat a third of the card, so
 * only tiers with a count are drawn and the rest fold into one sentence.
 */
export const ScoringSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const o = data.outcomes;
  if (!o) {
    return (
      <Panel kicker="What gets made here" style={CARD}>
        <Body>We hold no scored holes for this course, so there is no distribution to show.</Body>
      </Panel>
    );
  }

  const rows: Outcome[] = [
    { key: 'double_plus', label: 'Double +', count: o.double_plus, colour: SC_DOUBLE_DARK },
    { key: 'bogey', label: 'Bogey', count: o.bogey, colour: SC_BOGEY_DARK },
    { key: 'par', label: 'Par', count: o.par, colour: SC_PAR_DARK },
    { key: 'birdie', label: 'Birdie', count: o.birdie, colour: SC_BIRDIE_DARK },
    { key: 'eagle', label: 'Eagle', count: o.eagle, colour: SC_EAGLE_DARK },
    { key: 'albatross', label: 'Albatross', count: o.albatross, colour: SC_ALBATROSS_DARK },
    { key: 'ace', label: 'Hole in one', count: o.ace, colour: SC_ACE_DARK },
  ];
  const total = data.outcomes_total || rows.reduce((s, r) => s + r.count, 0);

  if (total === 0) {
    return (
      <Panel kicker="What gets made here" style={CARD}>
        <Body>We hold no scored holes for this course, so there is no distribution to show.</Body>
      </Panel>
    );
  }

  const present = rows.filter((r) => r.count > 0);
  const absent = rows.filter((r) => r.count === 0);
  const absentNames = absent.map((r) => r.label.toLowerCase().replace('double +', 'double bogey or worse'));
  const absentLine =
    absentNames.length === 0
      ? null
      : `No ${absentNames.length === 1 ? absentNames[0] : `${absentNames.slice(0, -1).join(', ')} or ${absentNames[absentNames.length - 1]}`} recorded here yet.`;

  return (
    <Panel kicker="What gets made here" aside={`${total.toLocaleString()} holes`}
      subline="Every scored hole on your course, worst to best." style={CARD}>
      <Inset>
        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: A.TRACK }}>
          {present.map((r) => (
            <i key={r.key} style={{ width: `${Math.max(MIN_BAR_PCT, (r.count / total) * 100)}%`, background: r.colour }} />
          ))}
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {present.map((r) => {
            const pct = Math.max(MIN_BAR_PCT, (r.count / total) * 100);
            return (
              <div key={r.key}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <i style={{ width: 7, height: 7, borderRadius: 2, background: r.colour, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: A.BODY }}>{r.label}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={bizFigure(15, A.INK)}>{r.count.toLocaleString()}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: A.DIM, minWidth: 34, textAlign: 'right' }}>
                      {share(r.count, total)}
                    </span>
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: A.TRACK, marginTop: 5, overflow: 'hidden' }}>
                  <i style={{ display: 'block', height: '100%', width: `${pct}%`, background: r.colour }} />
                </div>
              </div>
            );
          })}
        </div>
      </Inset>
      {absentLine && (
        <Body style={{ marginTop: 12, fontSize: 12 }}>{absentLine}</Body>
      )}
    </Panel>
  );
};

/* ─────────────────── THE COURSE RECORD ─────────────────── */

/**
 * §5 — THE COURSE RECORD, AND WHY IT CARRIES NO NAMES.
 *
 * NO NAMES ANYWHERE IN THIS SECTION. Champions is filtered per member by
 * champions_visibility, so a named list here would be a PARTIAL list shown as a
 * complete one — and this page promises that no individual member, round or
 * score is shown. We link out instead; names live there under each member's own
 * control.
 *
 * most_birdies IS A CAREER TOTAL, NOT A ROUND. gam-evaluator aggregates that
 * category with `sum`, so Sundridge East's 129 is one member's birdies across
 * eight years. "Most birdies in a round" would be nonsense.
 *
 * EMPTY IS EMPTY. Any figure can be null on a course with no legends rows; that
 * figure is omitted rather than rendered as a dash or a zero.
 */
export const RecordBookSection: React.FC<{ data: ClubCourseAnalytics; onSeeChampions?: () => void }> = ({
  data,
  onSeeChampions,
}) => {
  const rb = data.record_book;
  const gross = rb?.lowest_gross;
  const birdies = rb?.most_birdies;
  const stableford = rb?.best_stableford;
  const holders = rb?.holders_ever ?? gross?.changed_hands ?? null;
  const since = rb?.rounds_since_record ?? null;

  if (!rb || (gross?.value == null && birdies?.value == null && stableford?.value == null)) {
    return (
      <Panel kicker="The course record" style={CARD}>
        <Body>
          No record has been set on this course by a connected member yet. The first one appears here as soon as it is.
        </Body>
      </Panel>
    );
  }

  const cells: { label: string; value: string }[] = [];
  if (birdies?.value != null) cells.push({ label: 'Most birdies here', value: birdies.value.toLocaleString() });
  if (stableford?.value != null) cells.push({ label: 'Best Stableford', value: stableford.value.toLocaleString() });
  if (holders != null) cells.push({ label: holders === 1 ? 'Holder, all time' : 'Holders, all time', value: holders.toLocaleString() });
  if (since != null) cells.push({ label: 'Rounds since', value: since.toLocaleString() });

  // The "has stood since" story belongs to whichever record is actually old —
  // derived from attained_at, never assumed.
  const oldest = [
    { label: 'gross record', at: gross?.attained_at, has: gross?.value != null },
    { label: 'Stableford record', at: stableford?.attained_at, has: stableford?.value != null },
  ]
    .filter((r) => r.has && r.at)
    .sort((a, b) => String(a.at).localeCompare(String(b.at)))[0];
  const oldestYears = oldest ? yearsSince(oldest.at) : null;

  return (
    <Panel kicker="The course record" style={CARD}>
      {gross?.value != null && (
        <>
          <div style={bizFigure(46, A.INK)}>{gross.value}</div>
          <div style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>
            Lowest gross{gross.attained_at ? ` · ${dayMonthYear(gross.attained_at)}` : ''}
          </div>
        </>
      )}

      {cells.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: A.BORDER, border: `1px solid ${A.BORDER}`, borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
          {cells.map((c) => (
            <div key={c.label} style={{ background: A.PANEL, padding: '12px 12px' }}>
              <div style={bizFigure(17, A.INK)}>{c.value}</div>
              <div style={{ ...LABEL, fontSize: 8.5, marginTop: 6 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {oldest && oldestYears != null && oldestYears >= 2 && (
        <Body style={{ marginTop: 12 }}>
          Your {oldest.label} has stood for {Math.floor(oldestYears)} years, set {dayMonthYear(oldest.at)}.
        </Body>
      )}

      <Body style={{ marginTop: 12, fontSize: 11.5, color: A.DIM }}>
        Most birdies here is a career total on this course, not a single round. Nobody is named on this page: names live
        on your course's Champions tab, where each member controls whether they appear.
      </Body>

      {onSeeChampions && (
        <button
          type="button"
          onClick={onSeeChampions}
          style={{
            marginTop: 12,
            border: 'none',
            background: 'transparent',
            padding: 0,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 700,
            color: A.AMBER,
            cursor: 'pointer',
          }}
        >
          See who holds them
        </button>
      )}
    </Panel>
  );
};

/* ─────────────────── YOUR TEES, AND WHO PLAYS THEM ─────────────────── */

/**
 * §6.1 / §6.2 — THE YARDAGE IS THE LABEL. The shipped page invented "back",
 * "middle", "middle", "middle", "forward" directly above its own footnote saying
 * we do not guess what a club calls a tee. The names are gone.
 *
 * And the table is now readable: one yardage, its score, a bar for how much of
 * the play sits there, and ONE PLAIN SENTENCE naming who plays it. Three counts
 * and three percentages per row was a spreadsheet, not a page.
 *
 * The mix denominator is `with_index`, NEVER `rounds`. Below ten indexed rounds
 * a split is noise and no sentence is drawn.
 */
const MIX_FLOOR = 10;

function whoPlaysIt(t: ClubAnalyticsTee): string | null {
  const withIndex = t.with_index ?? 0;
  if (withIndex < MIX_FLOOR) return null;
  const low = (t.low ?? 0) / withIndex;
  const mid = (t.mid ?? 0) / withIndex;
  if (low >= 0.9) return 'Almost entirely single figures';
  if (low >= 0.72) return 'Mostly single figures';
  if (low + mid >= 0.55) return 'Single figures and mid handicaps';
  return 'A mixed field';
}

export const TeesSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const tees = sortTees(data.tees ?? []);
  const totalRounds = tees.reduce((s, t) => s + t.rounds, 0);
  const maxRounds = tees.reduce((m, t) => Math.max(m, t.rounds), 1);

  if (tees.length === 0) {
    return (
      <Panel kicker="Your tees" style={CARD}>
        <Body>
          We hold no yardages on these rounds, so we cannot tell which tees were played. Nothing here is estimated.
        </Body>
      </Panel>
    );
  }

  return (
    <Panel
      kicker="Your tees"
      aside={`${totalRounds.toLocaleString()} rounds`}
      subline={
        tees.length === 1
          ? 'Every measured round was played off one yardage.'
          : `Your rounds were played off ${tees.length} measured yardages, longest first.`
      }
      style={CARD}
    >
      <Inset>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tees.map((t) => {
            const parts = toParParts(t.avg_to_par);
            const who = whoPlaysIt(t);
            return (
              <div key={t.yards} style={{ fontFamily: SANS, ...FIGS }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  {/* NO NAME. The yardage is the label. */}
                  <span style={bizFigure(15, A.INK)}>{yd(t.yards)}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={bizFigure(13, parts?.tone ?? A.INK)}>{parts?.text ?? '0'}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: A.DIM }}>
                      {t.rounds.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: A.TRACK, marginTop: 6, overflow: 'hidden' }}>
                  <i
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${Math.max(MIN_BAR_PCT, (t.rounds / maxRounds) * 100)}%`,
                      background: difficultyRampStop(2),
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: A.BODY, marginTop: 7 }}>
                  {who ?? `Mix not available — ${(t.with_index ?? 0).toLocaleString()} indexed rounds`}
                  {t.mean_index != null && who ? ` · mean index ${t.mean_index.toFixed(1)}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </Inset>
      <Body style={{ marginTop: 12 }}>
        Scoring differences between yardages largely reflect who chooses them, so nothing here ranks your tees by
        difficulty.
      </Body>
      <Body style={{ marginTop: 8, fontSize: 11.5, color: A.DIM }}>
        To par is the mean 18-hole score against each round's own par. Yardages come from the rounds themselves,
        bucketed to the nearest hundred; we do not know which colour your club calls each tee, so we do not name them.
      </Body>
    </Panel>
  );
};

/* ─────────────────── WHEN YOUR COURSE PLAYS ─────────────────── */

const BarRow: React.FC<{
  labels: string[];
  values: number[];
  peakInk?: boolean;
  /** §6.4 — a partial period is drawn HOLLOW and never read as a fall. */
  hollow?: boolean[];
}> = ({ labels, values, peakInk = true, hollow }) => {
  const max = Math.max(1, ...values);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 96 }}>
      {labels.map((label, i) => {
        const count = values[i] ?? 0;
        const isHollow = hollow?.[i] ?? false;
        const isPeak = peakInk && !isHollow && count > 0 && count === max;
        return (
          <div key={label} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div style={{ ...bizFigure(10, isPeak ? A.INK : A.DIM), marginBottom: 4 }}>{count}</div>
            <div
              style={{
                height: Math.max(count > 0 ? 4 : 2, (count / max) * 58),
                borderRadius: 2,
                background: isHollow ? 'transparent' : isPeak ? A.INK : 'rgba(248,250,252,0.22)',
                border: isHollow ? `1px dashed ${A.MUTE}` : undefined,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ ...LABEL, fontSize: 10, letterSpacing: '0.04em', marginTop: 5 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const SeasonalitySection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const months = data.months ?? [];
  const total = months.reduce((s, m) => s + m.rounds, 0);
  if (total === 0) {
    return (
      <Panel kicker="When your course plays" style={CARD}>
        <Body>We hold no dated rounds on this course, so there is no seasonal pattern to show.</Body>
      </Panel>
    );
  }

  const values = MONTHS.map((_, i) => months.find((m) => m.month === i + 1)?.rounds ?? 0);
  const peakIdx = values.indexOf(Math.max(...values));
  const summer = values.slice(3, 9).reduce((s, v) => s + v, 0);

  const weekdays = data.weekdays ?? [];
  const dowValues = DOW.map((_, i) => weekdays.find((w) => w.dow === i + 1)?.rounds ?? 0);
  const midweek = dowValues.slice(0, 5).reduce((s, v) => s + v, 0);
  const weekend = dowValues[5] + dowValues[6];
  const dowTotal = midweek + weekend;

  const years = [...(data.years ?? [])].sort((a, b) => a.year - b.year);
  const partialYear = years.find((y) => y.partial);

  return (
    <Panel kicker="When your course plays" aside={`${total.toLocaleString()} rounds`} style={CARD}>
      <div style={{ ...BIZ_LABEL, marginBottom: 8 }}>Across the year</div>
      <Inset>
        <BarRow labels={MONTHS.map((m) => m[0])} values={values} />
      </Inset>
      <Body style={{ marginTop: 10 }}>
        {MONTHS[peakIdx]} is your busiest month
        {summer / total >= 0.7
          ? ', and the great majority of play lands between April and September.'
          : ', and play is spread fairly evenly across the year.'}
      </Body>

      {dowTotal > 0 && (
        <>
          <div style={{ ...BIZ_LABEL, margin: '18px 0 8px' }}>Across the week</div>
          <Inset>
            <BarRow labels={DOW.map((d) => d[0])} values={dowValues} />
          </Inset>
          <Body style={{ marginTop: 10 }}>
            {weekend / dowTotal >= 0.5
              ? 'Most of the play we hold lands at the weekend, so midweek is where your tee sheet has room.'
              : 'Most of the play we hold lands midweek, which is unusual and worth reading against your visitor pricing.'}
          </Body>
        </>
      )}

      {years.length > 1 && (
        <>
          <div style={{ ...BIZ_LABEL, margin: '18px 0 8px' }}>Year on year</div>
          <Inset>
            <BarRow
              labels={years.map((y) => String(y.year).slice(2))}
              values={years.map((y) => y.rounds)}
              hollow={years.map((y) => Boolean(y.partial))}
            />
          </Inset>
          {/* §6.4 — A PART-YEAR IS NOT A FALL. */}
          {partialYear && (
            <Body style={{ marginTop: 10, fontSize: 12, color: A.AMBER }}>
              {partialYear.year} is still in progress, drawn hollow. It is not comparable with a completed year yet.
            </Body>
          )}
          <Body style={{ marginTop: 10, fontSize: 11.5, color: A.DIM }}>
            This is rounds we hold, not rounds played. It rises as more of your members connect, so read it as coverage
            first and demand second.
          </Body>
        </>
      )}
    </Panel>
  );
};

/* ─────────────────── WHO PLAYS HERE ─────────────────── */

export const WhoPlaysSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const bands = data.handicap_bands ?? [];
  const total = data.handicap_rounds || bands.reduce((s, b) => s + b.rounds, 0);
  if (bands.length === 0 || total === 0) {
    return (
      <Panel kicker="Who plays here" style={CARD}>
        <Body>None of the rounds we hold carried a handicap index at the time of play, so there is no split to show.</Body>
      </Panel>
    );
  }

  const max = bands.reduce((m, b) => Math.max(m, b.rounds), 1);
  const memberSum = bands.reduce((s, b) => s + b.members, 0);

  return (
    <Panel
      kicker="Who plays here"
      aside={`${total.toLocaleString()} rounds`}
      subline="The handicap index each player held at the time of the round, not the index they hold today."
      style={CARD}
    >
      <Inset>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bands.map((b) => (
            <div key={b.label}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: A.BODY }}>{b.label}</span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={bizFigure(15, A.INK)}>{b.rounds.toLocaleString()}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: A.DIM, minWidth: 34, textAlign: 'right' }}>
                    {share(b.rounds, total)}
                  </span>
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: A.TRACK, marginTop: 5, overflow: 'hidden' }}>
                {b.rounds > 0 && (
                  <i style={{ display: 'block', height: '100%', width: `${(b.rounds / max) * 100}%`, background: 'rgba(248,250,252,0.42)' }} />
                )}
              </div>
              {/* A BAND WITH 400 ROUNDS FROM 2 MEMBERS IS NOT 400 GOLFERS. */}
              <div style={{ ...LABEL, fontSize: 10, marginTop: 5 }}>
                {b.members.toLocaleString()} {b.members === 1 ? 'member' : 'members'}
              </div>
            </div>
          ))}
        </div>
      </Inset>
      {/* §6.3 — THE COUNTS ADD TO MORE THAN THE MEMBER TOTAL ON PURPOSE. */}
      <Body style={{ marginTop: 12, fontSize: 11.5, color: A.DIM }}>
        These member counts add to {memberSum.toLocaleString()}, more than the {data.members.toLocaleString()} members
        behind this course, and that is correct: an index moves over the years, so one person appears in every band they
        have played to. Rounds and members are separate figures — a band can carry hundreds of rounds from a handful of
        regulars, and it should not be read as a headcount.
      </Body>
    </Panel>
  );
};

/* ─────────────────── COMPETITION OR SOCIAL ─────────────────── */

export const CompetitionSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const c = data.competition;
  const total = (c?.competition ?? 0) + (c?.social ?? 0);
  if (!c || total === 0) {
    return (
      <Panel kicker="Competition or social" style={CARD}>
        <Body>We hold no rounds marked competition or social for this course.</Body>
      </Panel>
    );
  }

  const rows = [
    { label: 'Competition', count: c.competition, colour: A.INK },
    { label: 'Social', count: c.social, colour: 'rgba(248,250,252,0.42)' },
  ];

  return (
    <Panel kicker="Competition or social" aside={`${total.toLocaleString()} rounds`} style={CARD}>
      <Inset>
        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: A.TRACK }}>
          {rows.map((r) =>
            r.count === 0 ? null : (
              <i key={r.label} style={{ width: `${Math.max(MIN_BAR_PCT, (r.count / total) * 100)}%`, background: r.colour }} />
            ),
          )}
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 24 }}>
          {rows.map((r) => (
            <div key={r.label}>
              <div style={bizFigure(19, A.INK)}>{r.count.toLocaleString()}</div>
              <div style={{ ...LABEL, marginTop: 4 }}>
                {r.label} · {share(r.count, total)}
              </div>
            </div>
          ))}
        </div>
      </Inset>
      <Body style={{ marginTop: 12, fontSize: 11.5, color: A.DIM }}>
        A competition round is one the member entered in a club competition rather than played socially, as recorded on
        their handicap record.
      </Body>
    </Panel>
  );
};

/** Kept exported for the page's own copy needs. */
export { roundsLabel, RAMP_TOPAR };
