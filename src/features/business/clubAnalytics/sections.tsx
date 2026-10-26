/**
 * BRIEF_CLUB_ANALYTICS_PAGE_REBUILD — THE SECTIONS OF ONE COURSE BLOCK.
 *
 * IT READS AS A PAGE, NOT ONE LONG TILE (§1). Every section is its OWN CARD on
 * the canvas — A.PANEL, 1px A.BORDER, 12px radius, 16px padding — with 14px
 * between them. There is no outer container with internal rules.
 *
 * ORDER, and the order is an argument:
 *   HOW IT PLAYS (CB92), THE SAMPLE, HOLE BY HOLE, WHERE YOUR INDEX DISAGREES,
 *   THE COURSE RECORD,
 *   YOUR TEES, WHEN MEMBERS PLAY, WHO PLAYS HERE, COMPETITION OR SOCIAL.
 * The ladder leads because it is the richest thing that renders on the samples
 * clubs currently have. It is a DIFFICULTY order and nothing on this page
 * measures a stroke index: that check was removed on 29 Sep 2026 because no
 * course on the platform could reach its sample. Never reintroduce
 * stroke-index-verdict language to any section here.
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
  A, SANS, FIGS, NUM, LABEL, Panel, BIZ_LABEL, BIZ_BODY, bizFigure,
  BIZ_INSET, difficultyRampColor, difficultyRampStop, RAMP_TOPAR, TOPAR_RED, toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import {
  SC_BIRDIE_DARK, SC_EAGLE_DARK, SC_ALBATROSS_DARK, SC_ACE_DARK,
  SC_PAR_DARK, SC_BOGEY_DARK, SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';
import { PCT_MIN_N, MIN_BAR_PCT } from './constants';
import RailChips from '@/components/ui/RailChips';
import { buildSiLadder, SI_PLACES_GATE } from '@/features/courses/_shared/siLadder';
import { numberWord, ordinal } from '@/lib/text/numbers';
import { fmtToPar } from '@/features/courses/_shared/holes/formatToPar';
import type { ClubCourseAnalytics, ClubAnalyticsTee } from './types';
import { sortTees, yd } from './tees';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';
import { courseNameWithinClub } from '@/features/courses/_shared/courseLabel';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];




/** A share below PCT_MIN_N is an absolute, not a percentage. */
function share(count: number, total: number): string {
  if (total < PCT_MIN_N) return fmt(count);
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

/** ONE WAY OF FORMATTING A COUNT. A null cannot find a gap (§1). */
const fmt = (v: number | null | undefined) => (v ?? 0).toLocaleString();

const roundsLabel = (n: number | null | undefined) => `${fmt(n)} ${n === 1 ? 'round' : 'rounds'}`;

/* ─────────────────── THE THREE-FIGURE STRIP ─────────────────── */

/**
 * §1b / §7 — ONE GRID SERVES THE VERDICT STRIP AND THE SAMPLE. 1fr/1fr/1fr,
 * 1px gaps showing the border through, so the figures read as one instrument
 * rather than three loose numbers.
 */
export const StatStrip: React.FC<{ cells: { figure: string; label: string; tone?: string }[]; twoLineLabels?: boolean }> = ({ cells, twoLineLabels }) => (
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
      <div key={c.label} style={{ background: A.PANEL, padding: '13px 12px', textAlign: 'center' }}>
        <div style={bizFigure(21, c.tone ?? A.INK)}>{c.figure}</div>
        {/* LABEL_FITS §3 — every cell reserves two lines so figures share a baseline. */}
        <div style={{ ...LABEL, marginTop: 6, ...(twoLineLabels ? { lineHeight: 1.3, minHeight: '2.6em' } : null) }}>{c.label}</div>
      </div>
    ))}
  </div>
);

/* ─────────────────── WHERE YOUR INDEX DISAGREES ─────────────────── */

/**
 * BRIEF_SI_LADDER_SHARED §0 — THIS SECTION IS NOW A THIN WRAPPER.
 *
 * The ladder, and the rule behind it, moved to `_shared/siLadder.ts` and
 * `_shared/SiLadder.tsx` so the course detail Course tab renders THE SAME chart
 * from THE SAME verdict. The same course must never show different flags on the
 * two pages, which is exactly what two copies of a threshold produce.
 *
 * WHAT CHANGED IN THE RULE, and it is worth knowing here: the shots gate is no
 * longer a fixed 0.10. It is MAX(0.05, sd/3) of this course's own spread of
 * avg_to_par, so a flat course is judged no more harshly than a dramatic one.
 * At Sundridge Park East that yields 0.067 and the flagged set is unchanged.
 *
 * places_gap AND shots_gap FROM THE RPC ARE NO LONGER READ. The helper computes
 * both from stroke_index and avg_to_par, which every hole row already carries.
 * The columns remain on `get_club_course_analytics` — dropping them is another
 * SQL pass — but nothing in the client touches them. Do not wire them back in.
 *
 * ELIGIBILITY: 100 measured rounds on the course. Under that the helper returns
 * null and this renders NOTHING — no empty state, no greyed chart. The section
 * appears by itself once the course crosses the line. That is why the old "your
 * card declares no stroke index" panel is gone too: a club with no declared
 * index has no ladder to show, and an explanation of an absent chart is noise.
 */
/** CB94: club-only list presentation. The shared helper alone owns flags and
 * eligibility; the course-detail SiLadder chart and its rule remain untouched.
 * Render only flagged rows, shotsFloor and rounds from its result.
 */
export const IndexDisagreesSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const ladder = buildSiLadder(data.holes ?? [], data.complete_rounds);
  if (!ladder) return null;
  const count = ladder.flagged.length;
  const n = count < 10 ? numberWord(count) : String(count);
  const title = count === 0 ? 'Every hole plays close to where your card puts it'
    : `${n} ${count === 1 ? 'hole plays' : 'holes play'} well away from where your card puts ${count === 1 ? 'it' : 'them'}`;
  const fine = 'This is a difficulty order across every handicap, not a stroke index, which ranks where a higher handicapper needs a shot.';
  return (
    <section data-testid="card-against-course" style={{ background: HIP.CARD, border: `1px solid ${HIP.LINE}`, borderRadius: 18, padding: 16, fontFamily: SANS, ...FIGS }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}>
        <span>CARD AGAINST COURSE</span>
        <span style={{ letterSpacing: '0.12em', color: HIP.DIM }}>{fmt(ladder.rounds)} FULL ROUNDS</span>
      </div>
      <h3 style={{ margin: '6px 0 0', fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3, color: HIP.INK }}>{title}</h3>
      {count === 0 ? <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.45, color: HIP.MUTE }}>No hole sits {SI_PLACES_GATE} or more places, and a meaningful share of a shot, away from its stroke index.</p>
        : (['harder', 'easier'] as const).map(direction => {
          const rows = ladder.flagged.filter(row => row.direction === direction).sort((a, b) => a.measuredRank - b.measuredRank);
          if (rows.length === 0) return null;
          return <div key={direction} data-testid={`card-group-${direction}`}>
            <h4 style={{ margin: '14px 0 0', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: HIP.DIM }}>{rows.length === 1 ? `Plays ${direction} than its card` : `Play ${direction} than their card`}</h4>
            {rows.map((row, i) => <div key={row.holeNo} data-testid="card-against-row" data-hole={row.holeNo} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: '9px 0', borderTop: i === 0 ? undefined : `1px solid ${A.SOFT}` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: HIP.INK }}>Hole {row.holeNo} plays {ordinal(row.measuredRank)} hardest</div>
                <div style={{ marginTop: 2, fontSize: 11.5, color: HIP.DIM }}>Your card makes it {row.strokeIndex}</div>
              </div>
              <div style={{ alignSelf: 'center', textAlign: 'right' }}>
                <div data-testid="card-shots" style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: direction === 'harder' ? HIP.INK : HIP.MUTE }}>{fmtToPar(row.shotsGap, 2)}</div>
                <div style={{ marginTop: 1, fontSize: 10.5, fontWeight: 600, color: HIP.DIM }}>shots</div>
              </div>
            </div>)}
          </div>;
        })}
      <p style={{ margin: '10px 0 0', fontSize: 11.5, lineHeight: 1.45, color: HIP.DIM }}>{count > 0 ? `The shots figure is how much harder or easier the hole plays than a hole at its card position usually does here. A hole is listed when it sits ${SI_PLACES_GATE} or more places from its card and at least ${ladder.shotsFloor.toFixed(2)} of a shot away. ` : ''}{fine}</p>
    </section>
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
          { figure: fmt(data.members), label: data.members === 1 ? 'Member' : 'Members' },
          { figure: fmt(data.rounds), label: data.rounds === 1 ? 'Round' : 'Rounds' },
          { figure: sinceYear ?? '—', label: 'Since' },
        ]}
      />
      <Body style={{ marginTop: 12 }}>
        That is every member of your club who has connected their handicap record to clbhouz, and every round of theirs
        played here{since ? ` since ${since}` : ''}. The more of your members are connected, the sharper this picture
        gets — each one adds rounds to every figure below.
      </Body>
      <Body style={{ marginTop: 10, fontSize: 12, color: A.DIM }}>
        {fmt(data.complete_rounds)} of those rounds carry all 18 holes, and hole figures are taken from
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
const CLUB_HOLE_GRID = '30px 34px 30px minmax(0,1fr) 44px';

/** §3 / §4 — the four-way split, in scorecard colours. */
const SPLIT_TIERS = [
  { key: 'birdie_plus' as const, label: 'Birdie +', colour: SC_BIRDIE_DARK },
  { key: 'par_count' as const, label: 'Par', colour: SC_PAR_DARK },
  { key: 'bogey' as const, label: 'Bogey', colour: SC_BOGEY_DARK },
  { key: 'double_plus' as const, label: 'Double +', colour: SC_DOUBLE_DARK },
];

/**
 * THIS SECTION DESCRIBES THE COURSE. IT DOES NOT AUDIT THE CARD.
 * measured_rank ranks mean strokes over par across ALL handicaps.
 * A stroke index ranks the GAP between the under-9 and 15-and-above
 * bands. Nothing in this app measures that any more. Do not reimplement
 * it here from pooled avg_to_par.
 * Never compare stroke_index to measured_rank here, never highlight
 * a divergence between them, and never word the subline or note so
 * that a reader could take this for a verdict on their card.
 */
/** CB93: hardest-first is a measured order, never a stroke-index verdict.
 * Existing identity props supply exactly CB91's course label without new reads.
 * Null means unmeasured; zero counts remain facts. Only observed numeric means
 * enter the ramp. The expanded hole survives sorting only while still visible.
 */
export const HoleBySection: React.FC<{ data: ClubCourseAnalytics; businessName?: string; courseCount?: number }> = ({ data, businessName = data.course_name, courseCount = data.club_courses.length || 1 }) => {
  const [order, setOrder] = React.useState('hardest');
  const [openHole, setOpenHole] = React.useState<number | null>(null);
  const holes = data.holes ?? [];
  const hasFullRounds = data.complete_rounds > 0 && holes.length > 0;
  React.useEffect(() => {
    if (!hasFullRounds || !holes.some(h => h.hole_no === openHole)) setOpenHole(null);
  }, [holes, openHole, hasFullRounds]);

  const rows = [...holes].sort((a, b) => order === 'hardest'
    ? a.measured_rank - b.measured_rank || a.hole_no - b.hole_no
    : a.hole_no - b.hole_no);
  const rankRows = [...holes].sort((a, b) => a.measured_rank - b.measured_rank || a.hole_no - b.hole_no);
  const hardest = rankRows.find(h => h.measured_rank === 1);
  const easiest = rankRows.at(-1);
  const values = holes.flatMap(h => typeof h.avg_to_par === 'number' && Number.isFinite(h.avg_to_par) ? [h.avg_to_par] : []);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const tFor = (v: number) => hi === lo ? 1 : (v - lo) / (hi - lo);
  const within = courseNameWithinClub(data.course_name);
  const courseLabel = courseCount > 1
    ? (/^the\s/i.test(within) ? within : `the ${within}`)
    : businessName.trim().replace(/\s+(?:Golf Club|Golf Course|GC)$/i, '').trim();
  const title = hasFullRounds
    ? (hardest && easiest ? `Hole ${hardest.hole_no} plays hardest, hole ${easiest.hole_no} easiest` : 'Hole by hole')
    : 'Hole by hole fills in with the first full round';
  const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };
  const heading: React.CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM, whiteSpace: 'nowrap', fontFamily: 'Geist, sans-serif' };

  return (
    <section data-testid="hole-by-hole" style={{ background: HIP.CARD, border: `1px solid ${HIP.LINE}`, borderRadius: 18, padding: 16, fontFamily: SANS, ...FIGS }}>
      <div style={{ ...kicker, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>HOLE BY HOLE</span>
        {hasFullRounds && <span style={{ color: HIP.DIM, letterSpacing: '0.12em' }}>{fmt(data.complete_rounds)} FULL ROUNDS</span>}
      </div>
      <h3 style={{ margin: '6px 0 0', fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3, color: HIP.INK }}>{title}</h3>
      <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.45, color: HIP.MUTE }}>
        {hasFullRounds
          ? `Strokes over par per hole, ${order === 'hardest' ? 'hardest first' : 'in card order'}. Tap a hole for its birdies, pars and bogeys.`
          : `Each hole is measured from rounds that carry all 18 holes. ${courseLabel} has ${roundsLabel(data.rounds)} so far, none with every hole.`}
      </p>
      {hasFullRounds && <>
        <RailChips options={[{ id: 'hardest', label: 'Hardest first' }, { id: 'card', label: 'Card order' }]} value={order} onChange={setOrder} ariaLabel="Hole order" style={{ marginTop: 12 }} />
        <div data-testid="hole-table-head" style={{ display: 'grid', gridTemplateColumns: CLUB_HOLE_GRID, gap: 8, marginTop: 12, paddingBottom: 6 }}>
          {['Hole', 'Par', 'SI', 'Over par', ''].map((label, i) => <span key={i} style={{ ...heading, textAlign: i < 3 ? 'center' : 'left', ...(i === 0 ? { transform: 'scaleX(0.9)' } : {}) }}>{label}</span>)}
        </div>
        {rows.map(h => {
          const parts = toParParts(h.avg_to_par);
          const t = parts ? tFor(h.avg_to_par) : null;
          const open = openHole === h.hole_no;
          const holeTotal = h.birdie_plus + h.par_count + h.bogey + h.double_plus;
          return <div key={h.hole_no}>
            <button type="button" aria-label={`Hole ${h.hole_no}`} aria-expanded={open} onClick={() => setOpenHole(open ? null : h.hole_no)} style={{ display: 'grid', gridTemplateColumns: CLUB_HOLE_GRID, gap: 8, alignItems: 'center', width: '100%', padding: '6px 0', border: 'none', borderTop: `1px solid ${A.SOFT}`, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: SANS, ...FIGS }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: HIP.INK, textAlign: 'center' }}>{h.hole_no}</span>
              <span style={{ fontSize: 12.5, color: HIP.MUTE, textAlign: 'center' }}>{h.par ?? '—'}</span>
              <span style={{ fontSize: 12.5, color: HIP.MUTE, textAlign: 'center' }}>{h.stroke_index ?? '—'}</span>
              <span style={{ height: 6, borderRadius: 3, background: A.SOFT, display: 'block', overflow: 'hidden' }}>
                {t != null && <i style={{ display: 'block', height: '100%', width: `${Math.max(4, t * 100)}%`, background: difficultyRampColor(t) }} />}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: parts?.tone ?? HIP.INK, textAlign: 'right' }}>{parts?.text ?? '—'}</span>
            </button>
            {open && <div data-testid="hole-inset" style={{ margin: '2px 0 8px', background: HIP.TILE, borderRadius: 12, padding: 12 }}>
              <div style={{ ...kicker, letterSpacing: '0.14em' }}>HOLE {h.hole_no}{h.yards == null ? '' : ` · ${fmt(h.yards)} YD`} · {fmt(holeTotal)} ROUNDS</div>
              <div data-testid="hole-split-bar" style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2, marginTop: 10 }}>
                {SPLIT_TIERS.map(tier => {
                  const count = h[tier.key];
                  return count > 0 && <i key={tier.key} style={{ flexBasis: `${Math.max(MIN_BAR_PCT, count / holeTotal * 100)}%`, flexShrink: 1, background: tier.colour }} />;
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 40px', rowGap: 5, columnGap: 10, marginTop: 8, fontSize: 12, alignItems: 'baseline' }}>
                {SPLIT_TIERS.map(tier => <React.Fragment key={tier.key}>
                  <div data-testid="hole-split-row" style={{ display: 'flex', gap: 8, alignItems: 'center', color: HIP.MUTE }}><i style={{ width: 8, height: 8, borderRadius: 2, background: tier.colour }} />{tier.label}</div>
                  <div style={{ color: HIP.INK, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(h[tier.key])}</div>
                  <div style={{ color: HIP.DIM, textAlign: 'right', fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>{howItPlaysShare(h[tier.key], holeTotal)}</div>
                </React.Fragment>)}
              </div>
            </div>}
          </div>;
        })}
        <p style={{ margin: '10px 0 0', fontSize: 11.5, lineHeight: 1.45, color: HIP.DIM }}>From {fmt(data.complete_rounds)} full rounds, every handicap pooled. This orders holes by how hard they play, which is not what a stroke index measures. A dash means we hold no figure for that hole.</p>
      </>}
    </section>
  );
};

/* ─────────────────── HOW IT PLAYS (CB92) ─────────────────── */

/**
 * CB92 — HOW IT PLAYS replaces the old verdict strip and "What gets made here".
 * Three tiles that read on their own, then one scoring split best to worst in
 * the scorecard colours. Reads only the existing ClubCourseAnalytics payload.
 * Under 50 rounds the card is identical: nothing is hidden for being small.
 * The outcome split inside HoleBySection is NOT this one and is untouched.
 */
const HIP = {
  CARD: '#17171B', LINE: 'rgba(255,255,255,0.08)', TILE: '#1E1E23',
  INK: '#F8FAFC', MUTE: 'rgba(248,250,252,0.62)', DIM: 'rgba(248,250,252,0.42)',
} as const;

export interface HowItPlaysOutcome { key: string; label: string; count: number; colour: string }

/** Whole %; one decimal under 1%; "<0.1%" under 0.1%. Zero is a fact: "0%". */
export function howItPlaysShare(count: number, total: number): string {
  if (count <= 0 || total <= 0) return '0%';
  const pct = (count / total) * 100;
  if (pct < 0.1) return '<0.1%';
  if (pct < 1) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

export function howItPlaysModel(data: ClubCourseAnalytics) {
  const o = data.outcomes ?? { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 0, bogey: 0, double_plus: 0 };
  const total = data.outcomes_total ?? 0;
  const all: (HowItPlaysOutcome & { optional: boolean })[] = [
    { key: 'ace', label: 'Hole in one', count: o.ace ?? 0, colour: SC_ACE_DARK, optional: true },
    { key: 'albatross', label: 'Albatross', count: o.albatross ?? 0, colour: SC_ALBATROSS_DARK, optional: true },
    { key: 'eagle', label: 'Eagle', count: o.eagle ?? 0, colour: SC_EAGLE_DARK, optional: true },
    { key: 'birdie', label: 'Birdie', count: o.birdie ?? 0, colour: SC_BIRDIE_DARK, optional: false },
    { key: 'par', label: 'Par', count: o.par ?? 0, colour: SC_PAR_DARK, optional: false },
    { key: 'bogey', label: 'Bogey', count: o.bogey ?? 0, colour: SC_BOGEY_DARK, optional: false },
    { key: 'double_plus', label: 'Double +', count: o.double_plus ?? 0, colour: SC_DOUBLE_DARK, optional: false },
  ];
  const rows = all.filter((r) => !r.optional || r.count > 0).map(({ optional: _o, ...r }) => r);
  const zeros = all.filter((r) => r.optional && r.count <= 0).map((r) => r.label.toLowerCase());
  const note =
    zeros.length === 0 ? null
      : zeros.length === 1 ? `No ${zeros[0]} here yet.`
      : zeros.length === 2 ? `No ${zeros[0]} or ${zeros[1]} here yet.`
      : 'No hole in one, albatross or eagle here yet.';

  const avg = data.avg_gross == null
    ? { figure: '–', label: 'typical 18-hole score, once a full round is in' }
    : { figure: Number(data.avg_gross).toFixed(1), label: 'typical 18-hole score' };

  const better = (o.par ?? 0) + (o.birdie ?? 0) + (o.eagle ?? 0) + (o.albatross ?? 0) + (o.ace ?? 0);
  const parOrBetter = { figure: total > 0 ? `${Math.round((better / total) * 100)}%` : '–', label: 'of holes made in par or better' };

  const rank1 = (data.holes ?? []).find((h) => h.measured_rank === 1);
  const hardest = (data.complete_rounds ?? 0) <= 0 || !rank1
    ? { figure: '–', label: 'hardest hole, once a full round is in' }
    : {
      figure: String(rank1.hole_no),
      label: rank1.stroke_index == null ? 'hardest hole'
        : rank1.stroke_index === 1 ? 'hardest hole, as your card says'
        : `hardest hole; your card makes it ${rank1.stroke_index}`,
    };

  return { total, tiles: [avg, parOrBetter, hardest], rows: total > 0 ? rows : [], note: total > 0 ? note : null };
}

export const HowItPlaysSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const m = howItPlaysModel(data);
  const minGrow = m.total * 0.006;
  return (
    <section data-testid="how-it-plays" style={{ background: HIP.CARD, border: `1px solid ${HIP.LINE}`, borderRadius: 18, padding: 16, fontFamily: SANS }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}>
        <span>HOW IT PLAYS</span>
        <span data-testid="how-it-plays-total" style={{ color: HIP.DIM, letterSpacing: '0.12em' }}>{`${fmt(m.total)} HOLES`}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
        {m.tiles.map((t, i) => (
          <div key={i} data-testid="how-it-plays-tile" style={{ background: HIP.TILE, borderRadius: 13, padding: '11px 10px' }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: HIP.INK }}>{t.figure}</div>
            <div style={{ marginTop: 2, fontSize: 11, lineHeight: 1.3, color: HIP.MUTE }}>{t.label}</div>
          </div>
        ))}
      </div>
      {m.total > 0 && (
        <>
          <div data-testid="how-it-plays-bar" style={{ marginTop: 14, display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
            {m.rows.filter((r) => r.count > 0).map((r) => (
              <i key={r.key} data-key={r.key} style={{ display: 'block', height: '100%', flexGrow: Math.max(r.count, minGrow), flexBasis: 0, background: r.colour }} />
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr auto 40px', rowGap: 7, columnGap: 10, fontSize: 12.5, alignItems: 'baseline' }}>
            {m.rows.map((r) => (
              <React.Fragment key={r.key}>
                <div data-testid="how-it-plays-row" style={{ color: HIP.MUTE, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <s style={{ width: 8, height: 8, borderRadius: 2, display: 'inline-block', background: r.colour, textDecoration: 'none' }} />{r.label}
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: HIP.INK }}>{fmt(r.count)}</div>
                <div style={{ textAlign: 'right', fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: HIP.DIM }}>{howItPlaysShare(r.count, m.total)}</div>
              </React.Fragment>
            ))}
          </div>
          {m.note && <p data-testid="how-it-plays-note" style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.45, color: HIP.MUTE }}>{m.note}</p>}
        </>
      )}
    </section>
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

  // §1 — the hero's own sentence. Each clause appears only when its field does.
  const middle: string[] = [];
  if (holders != null && holders > 1) middle.push(`${fmt(holders)} members have held this record`);
  if (since != null && since > 0) middle.push(`${fmt(since)} rounds have been played here since it was set`);
  const heroSentence = [
    gross?.attained_at ? `Set on ${dayMonthYear(gross.attained_at)}.` : null,
    middle.length === 2
      ? `${middle[0]}, and ${middle[1].charAt(0).toLowerCase()}${middle[1].slice(1)}.`
      : middle.length === 1
        ? `${middle[0]}.`
        : null,
    since === 0 ? 'It was set in the most recent round played here.' : null,
  ]
    .filter(Boolean)
    .join(' ');

  // §2 — round records first, career totals second. Each row dates ITSELF.
  const rows: { name: string; meta: string | null; value: string }[] = [];
  if (stableford?.value != null) {
    const yrs = stableford.attained_at ? yearsSince(stableford.attained_at) : null;
    rows.push({
      name: 'Best Stableford',
      meta: stableford.attained_at
        ? `Set ${dayMonthYear(stableford.attained_at)}${yrs != null && yrs >= 2 ? ` · has stood ${Math.floor(yrs)} years` : ''}`
        : null,
      value: fmt(stableford.value),
    });
  }
  if (birdies?.value != null) {
    rows.push({ name: 'Most birdies by one member', meta: 'A career total on this course, not one round', value: fmt(birdies.value) });
  }
  const hasHero = gross?.value != null;

  return (
    <Panel kicker="The course record" style={CARD}>
      {hasHero && (
        <>
          <div style={bizFigure(46, A.INK)}>{gross!.value}</div>
          <div style={{ ...LABEL, marginTop: 8 }}>Lowest gross</div>
          {heroSentence && <Body style={{ marginTop: 12 }}>{heroSentence}</Body>}
        </>
      )}

      {rows.length > 0 && (
        <div style={hasHero ? { borderTop: `1px solid ${A.BORDER}`, marginTop: 16, paddingTop: 4, marginBottom: 16 } : { marginBottom: 16 }}>
          {rows.map((r, i) => (
            <div
              key={r.name}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                padding: '12px 0',
                borderTop: i > 0 ? `1px solid ${A.SOFT}` : undefined,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, fontFamily: SANS }}>{r.name}</div>
                {r.meta && (
                  <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.4, color: A.DIM, fontFamily: SANS }}>{r.meta}</div>
                )}
              </div>
              <div className="tabular-nums lining-nums" style={{ flex: 'none', ...bizFigure(20, A.INK) }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}

      <Body style={{ marginTop: rows.length > 0 ? 0 : 12, fontSize: 11.5, color: A.DIM }}>
        Nobody is named on this page. Names live on your course's Champions tab, where each member controls whether
        they appear.
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
            color: A.INK,
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

const TEE_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 64px 62px',
  gap: 10,
  alignItems: 'baseline',
};
const TEE_HEAD: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: A.DIM,
};

export const TeesSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const tees = sortTees(data.tees ?? []);
  const totalRounds = tees.reduce((s, t) => s + t.rounds, 0);

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
      aside={`${fmt(totalRounds)} rounds`}
      subline={
        tees.length === 1
          ? 'Every measured round was played off one yardage.'
          : `Your rounds were played off ${tees.length} measured yardages, longest first.`
      }
      style={CARD}
    >
      <Inset>
        <div style={{ ...TEE_GRID, paddingBottom: 10 }}>
          <span style={TEE_HEAD}>Yardage</span>
          <span style={{ ...TEE_HEAD, textAlign: 'right' }}>Rounds</span>
          <span style={{ ...TEE_HEAD, textAlign: 'right' }}>To par</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tees.map((t) => {
            const parts = toParParts(t.avg_to_par);
            const who = whoPlaysIt(t);
            const barPct = totalRounds > 0 ? (t.rounds / totalRounds) * 100 : 0;
            const num: React.CSSProperties = { fontSize: 13, fontWeight: 700, textAlign: 'right', ...FIGS };
            return (
              <div key={t.yards} style={{ fontFamily: SANS, ...FIGS }}>
                <div style={TEE_GRID}>
                  {/* NO NAME. The yardage is the label. */}
                  <span style={bizFigure(15, A.INK)}>{yd(t.yards)}</span>
                  <span style={{ ...num, color: A.INK }}>{fmt(t.rounds)}</span>
                  <span style={{ ...num, color: parts?.tone ?? A.INK }}>{parts?.text ?? '0'}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: A.TRACK, marginTop: 6, overflow: 'hidden' }}>
                  <i
                    style={{
                      display: 'block',
                      height: '100%',
                      width: t.rounds > 0 ? `${Math.max(MIN_BAR_PCT, barPct)}%` : '0%',
                      background: A.INK,
                    }}
                  />
                </div>
                <div style={{ fontSize: 11.5, lineHeight: 1.4, color: A.DIM, marginTop: 6 }}>
                  {`${share(t.rounds, totalRounds)} of play`}
                  {who ? ` · ${who}` : ''}
                  {who && t.mean_index != null ? `, mean index ${t.mean_index.toFixed(1)}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </Inset>
      <Body style={{ marginTop: 12 }}>
        Scores differ between yardages mostly because of who chooses them, so this does not rank your tees by
        difficulty.
      </Body>
      <Body style={{ marginTop: 8, fontSize: 11.5, color: A.DIM }}>
        Yardages come from the rounds themselves, rounded to the nearest hundred. We do not know which colour your club
        calls each tee, so we do not name them.
      </Body>
    </Panel>
  );
};

/* ─────────────────── WHEN MEMBERS PLAY ─────────────────── */

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
                background: isHollow ? 'transparent' : isPeak ? A.INK : inkWithAlpha(SURFACE.dark.ink, 0.22),
                border: isHollow ? `1px dashed ${A.MUTE}` : undefined,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ ...LABEL, marginTop: 5 }}>{label}</div>
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
      <Panel kicker="When members play" style={CARD}>
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
    <Panel kicker="When members play" aside={`${fmt(total)} rounds`} style={CARD}>
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
      aside={`${fmt(total)} rounds`}
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
                  <span style={bizFigure(15, A.INK)}>{fmt(b.rounds)}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: A.DIM, minWidth: 34, textAlign: 'right' }}>
                    {share(b.rounds, total)}
                  </span>
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: A.TRACK, marginTop: 5, overflow: 'hidden' }}>
                {b.rounds > 0 && (
                  <i style={{ display: 'block', height: '100%', width: `${(b.rounds / max) * 100}%`, background: inkWithAlpha(SURFACE.dark.ink, 0.42) }} />
                )}
              </div>
              {/* A BAND WITH 400 ROUNDS FROM 2 MEMBERS IS NOT 400 GOLFERS. */}
              <div style={{ ...LABEL, marginTop: 5 }}>
                {fmt(b.members)} {b.members === 1 ? 'golfer' : 'golfers'}
              </div>
            </div>
          ))}
        </div>
      </Inset>
      {/* §6.3 — THE COUNTS ADD TO MORE THAN THE MEMBER TOTAL ON PURPOSE. */}
      <Body style={{ marginTop: 12, fontSize: 11.5, color: A.DIM }}>
        These golfer counts add to {fmt(memberSum)}, more than the {fmt(data.members)} golfers
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
    { label: 'Competition rounds', count: c.competition, colour: A.INK },
    { label: 'Social rounds', count: c.social, colour: 'rgba(248,250,252,0.42)' },
  ];

  return (
    <Panel kicker="Competition or social" aside={`${fmt(total)} rounds`} style={CARD}>
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
            <div key={r.label} style={{ textAlign: 'center' }}>
              <div style={bizFigure(19, A.INK)}>{fmt(r.count)}</div>
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
