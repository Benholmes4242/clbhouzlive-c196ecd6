/**
 * BRIEF_CLUB_ANALYTICS_MULTI_COURSE §4-§7 — THE SECTIONS OF ONE COURSE BLOCK.
 *
 *   0  THE SAMPLE            members · rounds · since — before any figure (§4)
 *   1  HOLE BY HOLE          declared SI beside measured rank, with a toggle (§5)
 *   2  STROKE INDEX          GATED on si_advice_state, never on si_advice (§6)
 *   3  WHAT GETS MADE HERE   the seven outcomes, worst to best
 *   4  WHAT YOUR TEES SCORED yardages, described — NEVER ranked by difficulty
 *   5  WHEN YOUR COURSE PLAYS months, weekdays, years
 *   6  WHO PLAYS HERE        handicap bands with rounds AND members
 *   7  HOW IT IS PLAYED      competition against social
 *
 * TWO RULES CARRIED FORWARD:
 *   - ZERO IS A FACT. A club with no albatrosses renders 0. The dash is
 *     reserved for "not measured" and nothing else.
 *   - NO INVENTED ROWS. A section with no data says so; it never renders
 *     plausible-looking placeholders with empty bars.
 *
 * TWO ROUND COUNTS, AND THEY ARE NOT INTERCHANGEABLE. `rounds` is every
 * measured round; `complete_rounds` is rounds carrying all 18 holes. The HOLE
 * RANKING rests on the second, because picked-up holes are excluded rather than
 * counted, so a hole statement cites complete_rounds.
 */
import React from 'react';
import {
  A, SANS, FIGS, NUM, LABEL, Panel, BIZ_LABEL, BIZ_BODY, BIZ_TITLE, bizFigure,
  BIZ_INSET, difficultyRampColor, difficultyRampStop, DIFFICULTY_RAMP, RAMP_TOPAR, TOPAR_RED, toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import { PCT_MIN_N, MIN_BAR_PCT } from './constants';
import type { ClubCourseAnalytics } from './types';
import { sortTees, teeLabel } from './tees';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

const Inset: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ ...BIZ_INSET, padding: 14, ...style }}>{children}</div>
);

const Body: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <p style={{ ...BIZ_BODY, margin: 0, ...style }}>{children}</p>
);

const roundsLabel = (n: number) => `${n.toLocaleString()} ${n === 1 ? 'round' : 'rounds'}`;

/* ─────────────────── 0  THE SAMPLE, STATED PLAINLY ─────────────────── */

/**
 * §4 — THE HEADER IS THE HONEST BIT, AND IT IS ALSO THE PITCH.
 *
 * "17 members · 817 rounds · since March 2018". NOT presented as the club's
 * membership: seventeen of Sundridge's members have connected and the club has
 * hundreds. A club shown 817 rounds without the member count reads it as the
 * whole picture. The line underneath makes that limitation the reason to promote
 * clbhouz — the commercial mechanic, not a disclaimer.
 */
export const SampleSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const since = monthYear(data.first_round);
  const parts = [
    `${data.members.toLocaleString()} ${data.members === 1 ? 'member' : 'members'}`,
    roundsLabel(data.rounds),
    since ? `since ${since}` : null,
  ].filter(Boolean) as string[];

  return (
    <Panel kicker="The sample">
      <div style={{ ...BIZ_TITLE, fontSize: 19, letterSpacing: '-0.03em', marginBottom: 8 }}>
        {parts.join(' · ')}
      </div>
      <Body>
        That is every member of your club who has connected their handicap record to clbhouz, and every round of theirs
        played here. The more of your members are connected, the sharper this picture gets — each one adds rounds to
        every figure below, and to the stroke index check.
      </Body>
      <Body style={{ marginTop: 10, fontSize: 12, color: A.DIM }}>
        {data.complete_rounds.toLocaleString()} of those rounds carry all 18 holes, and hole figures are taken from
        those. {data.avg_gross != null ? `The mean 18-hole gross returned here is ${data.avg_gross}.` : ''}
      </Body>
    </Panel>
  );
};

/* ─────────────────── 1  HOLE BY HOLE ─────────────────── */

/**
 * §5 — the same treatment as the course detail page's hole list: the load-bearing
 * grid, the LABEL header row, NUM figures, the to-par convention and the shared
 * difficulty ramp. HOLE / PAR / SI / ramp / measured rank / to par.
 *
 * DECLARED STROKE INDEX SITS BESIDE MEASURED RANK ON EVERY ROW. That pairing is
 * the reason a club opens this page, so it is never behind a tap.
 */
const CLUB_HOLE_GRID = '26px 28px 28px 1fr 40px 48px';

export const HoleBySection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const [hardestFirst, setHardestFirst] = React.useState(false);
  const holes = data.holes ?? [];

  if (holes.length === 0) {
    return (
      <Panel kicker="Hole by hole">
        <Body>We hold no hole rows for this course, so there is nothing to rank.</Body>
      </Panel>
    );
  }

  const rows = [...holes].sort((a, b) =>
    hardestFirst ? a.measured_rank - b.measured_rank : a.hole_no - b.hole_no,
  );
  const n = holes.length;

  return (
    <Panel
      kicker="Hole by hole"
      aside={`${data.complete_rounds.toLocaleString()} full rounds`}
      subline="Your declared stroke index beside the position each hole actually plays in, 1 being the hardest."
    >
      {/* CARD ORDER IS THE DEFAULT (§5). Text-only toggle, no fills. */}
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

      <div style={{ display: 'grid', gridTemplateColumns: CLUB_HOLE_GRID, gap: 10, paddingBottom: 8 }}>
        <span style={{ ...LABEL, textAlign: 'center' }}>Hole</span>
        <span style={{ ...LABEL, textAlign: 'center' }}>Par</span>
        <span style={{ ...LABEL, textAlign: 'center' }}>SI</span>
        <span style={LABEL}>Measured</span>
        <span style={{ ...LABEL, textAlign: 'right' }}>Rank</span>
        <span style={{ ...LABEL, textAlign: 'right' }}>To par</span>
      </div>

      {rows.map((h) => {
        const parts = toParParts(h.avg_to_par);
        const t = n > 1 ? (n - h.measured_rank) / (n - 1) : 1;
        const width = Math.max(4, t * 100);
        const out =
          h.stroke_index != null ? Math.abs(h.stroke_index - h.measured_rank) : null;
        return (
          <div
            key={h.hole_no}
            style={{
              display: 'grid',
              gridTemplateColumns: CLUB_HOLE_GRID,
              gap: 10,
              alignItems: 'center',
              padding: '8px 0',
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
              <i
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${width}%`,
                  background: difficultyRampColor(t),
                }}
              />
            </span>
            <span style={{ ...NUM, fontSize: 13, color: A.INK, textAlign: 'right' }}>{h.measured_rank}</span>
            <span style={{ ...NUM, fontSize: 13, color: parts?.tone ?? A.INK, textAlign: 'right' }}>
              {parts?.text ?? '\u2014'}
            </span>
          </div>
        );
      })}

      <Body style={{ marginTop: 10, fontSize: 11.5, color: A.DIM }}>
        SI is the stroke index your card declares. Rank is where the hole sits on mean strokes over par across
        {` ${data.complete_rounds.toLocaleString()} `}
        full rounds. A dash means we hold no figure for that hole.
      </Body>
    </Panel>
  );
};

/* ─────────────────── 2  THE STROKE INDEX RECOMMENDATION ─────────────────── */

/**
 * §6 — GATED, AND THE GATE IS THE POINT. Read si_advice_state, never
 * si_advice's presence.
 *
 * A stroke index ranks WHERE A HIGHER HANDICAPPER NEEDS A SHOT MOST relative to
 * a lower one — not raw difficulty. That needs both bands well sampled. At
 * Sundridge East there are 541 low-handicap hole rows and 18 high; eighteen rows
 * is roughly one round, and a recommendation built on it falls apart the moment
 * a handicap secretary asks how many players it came from.
 *
 * So below the gate NO RANKING RENDERS ANYWHERE HERE, the shortfall is named,
 * and that is the strongest "get your members on clbhouz" argument on the page.
 */
export const StrokeIndexSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const gate = data.si_band_rows;
  const ready = data.si_advice_state === 'ready' && (data.si_advice?.length ?? 0) > 0;

  if (!ready) {
    const threshold = gate?.threshold ?? 200;
    return (
      <Panel kicker="Stroke index" aside="Locked">
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
      kicker="Stroke index"
      aside={`${data.complete_rounds.toLocaleString()} full rounds`}
      subline="Where a higher handicapper needs the shot most, measured against the index your card declares."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr 48px 48px', gap: 10, paddingBottom: 8 }}>
        <span style={{ ...LABEL, textAlign: 'center' }}>Hole</span>
        <span style={LABEL}>Shot needed</span>
        <span style={{ ...LABEL, textAlign: 'right' }}>Declared</span>
        <span style={{ ...LABEL, textAlign: 'right' }}>Measured</span>
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

/* ─────────────────── 3  WHAT GETS MADE HERE ─────────────────── */

interface Outcome { key: string; label: string; count: number; colour: string }

export const ScoringSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const o = data.outcomes;
  if (!o) {
    return (
      <Panel kicker="What gets made here">
        <Body>We hold no scored holes for this course, so there is no distribution to show.</Body>
      </Panel>
    );
  }

  // SEVEN OUTCOMES IN SCORECARD ORDER, worst to best.
  const rows: Outcome[] = [
    { key: 'double_plus', label: 'Double +', count: o.double_plus, colour: DIFFICULTY_RAMP[5] },
    { key: 'bogey', label: 'Bogey', count: o.bogey, colour: DIFFICULTY_RAMP[4] },
    { key: 'par', label: 'Par', count: o.par, colour: RAMP_TOPAR.par },
    { key: 'birdie', label: 'Birdie', count: o.birdie, colour: TOPAR_RED },
    { key: 'eagle', label: 'Eagle', count: o.eagle, colour: TOPAR_RED },
    { key: 'albatross', label: 'Albatross', count: o.albatross, colour: TOPAR_RED },
    { key: 'ace', label: 'Hole in one', count: o.ace, colour: TOPAR_RED },
  ];
  const total = data.outcomes_total || rows.reduce((s, r) => s + r.count, 0);

  if (total === 0) {
    return (
      <Panel kicker="What gets made here">
        <Body>We hold no scored holes for this course, so there is no distribution to show.</Body>
      </Panel>
    );
  }

  return (
    <Panel kicker="What gets made here" aside={`${total.toLocaleString()} holes`}
      subline="Every scored hole on your course, worst to best.">
      <Inset>
        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: A.TRACK }}>
          {rows.map((r) => {
            if (r.count === 0) return null;
            const pct = Math.max(MIN_BAR_PCT, (r.count / total) * 100);
            return <i key={r.key} style={{ width: `${pct}%`, background: r.colour }} />;
          })}
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => {
            const pct = r.count === 0 ? 0 : Math.max(MIN_BAR_PCT, (r.count / total) * 100);
            return (
              <div key={r.key}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: A.BODY }}>{r.label}</span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    {/* ZERO IS A FACT, NOT AN ABSENCE. */}
                    <span style={bizFigure(15, A.INK)}>{r.count.toLocaleString()}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: A.DIM, minWidth: 34, textAlign: 'right' }}>
                      {share(r.count, total)}
                    </span>
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: A.TRACK, marginTop: 5, overflow: 'hidden' }}>
                  {r.count > 0 && <i style={{ display: 'block', height: '100%', width: `${pct}%`, background: r.colour }} />}
                </div>
              </div>
            );
          })}
        </div>
      </Inset>
    </Panel>
  );
};

/* ─────────────────── 4  YOUR TEES, AND WHO PLAYS THEM ─────────────────── */

/**
 * BRIEF_CLUB_TEES_WHO_PLAYS_WHERE — THE MIX SITS BESIDE THE SCORE.
 *
 * The score alone is the misleading half. At Sundridge East the 6,600 set
 * returns +8.81 and the 6,500 set +11.27; read alone that says the longer tee
 * is easier. It is not: 124 of the 6,600 set's 134 rounds come from
 * single-figure players and ONE came from a 15-plus. So every row carries its
 * handicap mix, and nothing here ranks the sets by difficulty.
 *
 * The mix denominator is `with_index`, NEVER `rounds` — rounds carrying no
 * index at all would make the split fail to add up. Below ten indexed rounds a
 * three-way split is noise, so no mix is drawn for that set.
 *
 * The sets are LABELLED BY YARDAGE. We know the distance; we do not know whether
 * the club calls it white, yellow or blue, and a colour would be a fabrication.
 */
const MIX_FLOOR = 10;

const MIX_BANDS = [
  { key: 'low' as const, label: 'Under 9', colour: difficultyRampStop(1) },
  { key: 'mid' as const, label: '9–14.9', colour: difficultyRampStop(3) },
  { key: 'high' as const, label: '15+', colour: difficultyRampStop(5) },
];

export const TeesSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const tees = sortTees(data.tees ?? []);
  const totalRounds = tees.reduce((s, t) => s + t.rounds, 0);

  if (tees.length === 0) {
    return (
      <Panel kicker="Your tees, and who plays them">
        <Body>
          We hold no yardages on these rounds, so we cannot tell which tees were played. Nothing here is estimated.
        </Body>
      </Panel>
    );
  }

  return (
    <Panel
      kicker="Your tees, and who plays them"
      aside={`${totalRounds.toLocaleString()} rounds`}
      subline={
        tees.length === 1
          ? 'Every measured round was played off one yardage.'
          : `Your rounds were played off ${tees.length} measured yardages, each described on its own.`
      }
    >
      <Inset>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px', gap: 10, paddingBottom: 8 }}>
          <span style={BIZ_LABEL}>Yardage</span>
          <span style={{ ...BIZ_LABEL, textAlign: 'right' }}>Rounds</span>
          <span style={{ ...BIZ_LABEL, textAlign: 'right' }}>To par</span>
          <span style={{ ...BIZ_LABEL, textAlign: 'right' }}>Mean idx</span>
        </div>
        {tees.map((t) => {
          const parts = toParParts(t.avg_to_par);
          const withIndex = t.with_index ?? 0;
          const hasMix = withIndex >= MIX_FLOOR;
          return (
            <div key={t.yards} style={{ padding: '8px 0', fontFamily: SANS, ...FIGS }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: A.BODY }}>{teeLabel(t, tees)}</span>
                <span style={{ ...bizFigure(14, A.INK), textAlign: 'right' }}>{t.rounds.toLocaleString()}</span>
                <span style={{ ...bizFigure(13, parts?.tone ?? A.INK), textAlign: 'right' }}>
                  {parts?.text ?? '0'}
                </span>
                <span style={{ ...bizFigure(13, A.BODY), textAlign: 'right' }}>
                  {t.mean_index == null ? '—' : t.mean_index.toFixed(1)}
                </span>
              </div>

              {hasMix ? (
                <>
                  <div style={{ display: 'flex', height: 5, borderRadius: 3, background: A.TRACK, marginTop: 7, overflow: 'hidden' }}>
                    {MIX_BANDS.map((b) => {
                      const n = t[b.key] ?? 0;
                      if (n <= 0) return null;
                      return (
                        <i
                          key={b.key}
                          style={{ display: 'block', height: '100%', width: `${(n / withIndex) * 100}%`, background: b.colour }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 5, flexWrap: 'wrap' }}>
                    {MIX_BANDS.map((b) => {
                      const n = t[b.key] ?? 0;
                      return (
                        <span key={b.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <i style={{ width: 6, height: 6, borderRadius: 2, background: b.colour }} />
                          <span style={{ ...LABEL, fontSize: 10, letterSpacing: '0.04em' }}>{b.label}</span>
                          <span style={bizFigure(11, A.BODY)}>{n.toLocaleString()}</span>
                          <span style={bizFigure(11, A.DIM)}>{share(n, withIndex)}</span>
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ ...LABEL, fontSize: 10, letterSpacing: '0.04em', marginTop: 7, color: A.DIM }}>
                  Mix not available for this set — {withIndex.toLocaleString()} indexed{' '}
                  {withIndex === 1 ? 'round' : 'rounds'}
                </div>
              )}
            </div>
          );
        })}
      </Inset>
      <Body style={{ marginTop: 12 }}>
        Scoring differences between yardages largely reflect who chooses them.
      </Body>
      <Body style={{ marginTop: 8, fontSize: 11.5, color: A.DIM }}>
        To par is the mean 18-hole score against each round's own par. The mix is the handicap index carried at the time
        of play, out of the rounds carrying one. Yardages come from the rounds themselves, bucketed to the nearest
        hundred; we do not know which colour your club calls each tee, so we do not guess.
      </Body>
    </Panel>
  );
};


/* ─────────────────── 5  WHEN YOUR COURSE PLAYS ─────────────────── */

const BarRow: React.FC<{ labels: string[]; values: number[]; peakInk?: boolean }> = ({ labels, values, peakInk = true }) => {
  const max = Math.max(1, ...values);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 96 }}>
      {labels.map((label, i) => {
        const count = values[i] ?? 0;
        const isPeak = peakInk && count > 0 && count === max;
        return (
          <div key={label} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div style={{ ...bizFigure(10, isPeak ? A.INK : A.DIM), marginBottom: 4 }}>{count}</div>
            <div
              style={{
                height: Math.max(count > 0 ? 4 : 2, (count / max) * 58),
                borderRadius: 2,
                background: isPeak ? A.INK : 'rgba(248,250,252,0.22)',
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
      <Panel kicker="When your course plays">
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

  return (
    <Panel kicker="When your course plays" aside={`${total.toLocaleString()} rounds`}>
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
            <BarRow labels={years.map((y) => String(y.year).slice(2))} values={years.map((y) => y.rounds)} />
          </Inset>
          <Body style={{ marginTop: 10, fontSize: 11.5, color: A.DIM }}>
            This is rounds we hold, not rounds played. It rises as more of your members connect, so read it as coverage
            first and demand second.
          </Body>
        </>
      )}
    </Panel>
  );
};

/* ─────────────────── 6  WHO PLAYS HERE ─────────────────── */

export const WhoPlaysSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const bands = data.handicap_bands ?? [];
  const total = data.handicap_rounds || bands.reduce((s, b) => s + b.rounds, 0);
  if (bands.length === 0 || total === 0) {
    return (
      <Panel kicker="Who plays here">
        <Body>None of the rounds we hold carried a handicap index at the time of play, so there is no split to show.</Body>
      </Panel>
    );
  }

  const max = bands.reduce((m, b) => Math.max(m, b.rounds), 1);
  return (
    <Panel
      kicker="Who plays here"
      aside={`${total.toLocaleString()} rounds`}
      subline="The handicap index each player held at the time of the round, not the index they hold today."
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
      <Body style={{ marginTop: 12, fontSize: 11.5, color: A.DIM }}>
        Rounds and members are separate figures on purpose: a band can carry hundreds of rounds from a handful of
        regulars, and it should not be read as a headcount.
      </Body>
    </Panel>
  );
};

/* ─────────────────── 7  HOW IT IS PLAYED ─────────────────── */

export const CompetitionSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const c = data.competition;
  const total = (c?.competition ?? 0) + (c?.social ?? 0);
  if (!c || total === 0) {
    return (
      <Panel kicker="How it is played">
        <Body>We hold no rounds marked competition or social for this course.</Body>
      </Panel>
    );
  }

  const rows = [
    { label: 'Competition', count: c.competition, colour: A.INK },
    { label: 'Social', count: c.social, colour: 'rgba(248,250,252,0.42)' },
  ];

  return (
    <Panel kicker="How it is played" aside={`${total.toLocaleString()} rounds`}>
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
    </Panel>
  );
};
