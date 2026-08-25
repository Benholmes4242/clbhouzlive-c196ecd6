/**
 * BRIEF_CLUB_ANALYTICS_TAB §4 — THE SECTIONS, IN ORDER.
 *
 *   1  THE VERDICT              stroke index, declared against measured
 *   2  HOW YOUR COURSE PLAYS    every hole, hardest to easiest, both ranks
 *   3  WHAT GETS MADE HERE      the scoring distribution
 *   4  WHAT YOUR TEES COST      every measured yardage (v2 §4)
 *   5  WHEN YOUR COURSE IS BUSY by month
 *   6  WHO PLAYS HERE           handicap bands, DISTRIBUTION ONLY
 *
 * WITHDRAWN (v2 §8): the low-versus-high handicap band differential — the
 * statistic a stroke index is actually FOR. It is NOT BUILDABLE and must not be
 * attempted: of 3,161 rounds only 72 sit at index 18 or above, 891 are PLUS
 * handicaps, and at Hanbury there are ZERO rounds at 18+, so the comparison
 * returns an empty panel. WHO PLAYS HERE therefore shows the distribution and
 * makes NO difficulty claim from it.
 *
 * THE TWO FAULTS FROM INSIGHTS, NOT REPEATED (§6):
 *   - ZERO IS A FACT. A club with no albatrosses renders 0. The dash is
 *     reserved for "not measured" and nothing else.
 *   - NO INVENTED ROWS. A section with no data says so; it never renders
 *     plausible-looking placeholders with empty bars.
 *   - ONE CHART INSET, populated or not, so the page does not change shape as
 *     data arrives. No dashed edges.
 */
import React from 'react';
import {
  A, SANS, FIGS, LABEL, Panel, BIZ_LABEL, BIZ_BODY, BIZ_TITLE, bizFigure,
  BIZ_INSET, difficultyRampStop, DIFFICULTY_RAMP, RAMP_TOPAR, TOPAR_RED, toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import { EARLY_DATA_FLOOR, DRIFT_FIGURE_MIN, PCT_MIN_N, MIN_BAR_PCT } from './constants';
import type { ClubCourseAnalytics } from './types';
import { sortTees, teeLabel, teeSpreadLine, verdictScopeLine, yd } from './tees';
import { buildVerdict, withDrift, ordinal, type Verdict } from './verdict';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** §5a — every section carries its n, or says EARLY DATA below the floor. */
export function nLabel(rounds: number): string {
  if (rounds < EARLY_DATA_FLOOR) return 'Early data';
  return `${rounds.toLocaleString()} rounds`;
}

/** §6.4 — a share below PCT_MIN_N is an absolute, not a percentage. */
function share(count: number, total: number): string {
  if (total < PCT_MIN_N) return count.toLocaleString();
  const pct = (count / total) * 100;
  if (count === 0) return '0%';
  return pct >= 1 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
}

const Inset: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ ...BIZ_INSET, padding: 14, ...style }}>{children}</div>
);

const Body: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <p style={{ ...BIZ_BODY, margin: 0, ...style }}>{children}</p>
);

/* ───────────────────────── 1  THE VERDICT ───────────────────────── */

export const VerdictSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const verdict: Verdict = buildVerdict(data.holes, data.rounds);
  const rated = withDrift(data.holes).filter((h) => h.drift != null) as { hole_no: number; drift: number }[];
  const maxDrift = rated.reduce((m, h) => Math.max(m, h.drift), 0) || 1;

  return (
    <Panel kicker="The verdict" aside={nLabel(data.rounds)}>
      <div
        style={{
          ...BIZ_TITLE,
          fontSize: verdict.kind === 'sound' ? 22 : 19,
          letterSpacing: '-0.035em',
          marginBottom: 8,
        }}
      >
        {verdict.headline}
      </div>
      <Body style={{ marginBottom: 10 }}>{verdict.support}</Body>

      {/*
        §4.2 — WHICH TEES THIS VERDICT IS ABOUT, on screen, always. A stroke
        index verdict that silently mixes tees is worse than no verdict, so the
        scope is stated whether the ranking was scoped to one set or adjusted
        across several.
      */}
      <Body style={{ marginBottom: 14, fontSize: 12, color: A.DIM }}>
        {verdictScopeLine(data.verdict_scope)}
      </Body>

      {/* ONE CHART INSET, populated or not (§6.3). */}
      <Inset>
        <div style={{ ...BIZ_LABEL, marginBottom: 10 }}>Places out of position, hole by hole</div>
        {rated.length === 0 ? (
          <Body>No hole on the rounds we hold carries a stroke index, so there is nothing to plot here yet.</Body>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 92 }}>
            {withDrift(data.holes).map((h) => {
              const drift = h.drift;
              // §3.4 — SIX DISCRETE STOPS, stepped, never interpolated.
              const stop = drift == null
                ? 0
                : Math.round((drift / maxDrift) * (DIFFICULTY_RAMP.length - 1));
              const height = drift == null ? 3 : Math.max(4, (drift / maxDrift) * 68);
              return (
                <div key={h.hole_no} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                  {drift != null && drift >= DRIFT_FIGURE_MIN && (
                    <div style={{ ...bizFigure(11, A.INK), marginBottom: 4 }}>{drift}</div>
                  )}
                  <div
                    style={{
                      height,
                      borderRadius: 2,
                      background: drift == null ? A.TRACK : difficultyRampStop(stop),
                    }}
                  />
                  {/* AXIS floor 10: hole number under a bar, a coordinate. */}
                  <div style={{ ...LABEL, fontSize: 10, letterSpacing: '0.04em', color: A.DIM, marginTop: 5 }}>
                    {h.hole_no}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Inset>
    </Panel>
  );
};

/* ───────────────── 2  HOW YOUR COURSE PLAYS ───────────────── */

export const HowItPlaysSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const holes = [...data.holes].sort((a, b) => a.measured_rank - b.measured_rank);
  const worst = holes.reduce((m, h) => Math.max(m, Math.abs(h.avg_to_par)), 0.01);

  return (
    <Panel kicker="How your course plays" aside={nLabel(data.rounds)}
      subline="Every hole from hardest to easiest as measured, with the stroke index you declare beside it.">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 30px 1fr 44px 40px',
          gap: 10,
          paddingBottom: 8,
        }}
      >
        <span style={{ ...BIZ_LABEL, textAlign: 'center' }}>Hole</span>
        <span style={{ ...BIZ_LABEL, textAlign: 'center' }}>Par</span>
        <span style={BIZ_LABEL}>Measured</span>
        <span style={{ ...BIZ_LABEL, textAlign: 'right' }}>Rank</span>
        <span style={{ ...BIZ_LABEL, textAlign: 'right' }}>SI</span>
      </div>
      {holes.map((h) => {
        const parts = toParParts(h.avg_to_par);
        const width = Math.max(3, (Math.abs(h.avg_to_par) / worst) * 100);
        return (
          <div
            key={h.hole_no}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 30px 1fr 44px 40px',
              gap: 10,
              alignItems: 'center',
              padding: '7px 0',
              fontFamily: SANS,
              ...FIGS,
            }}
          >
            <span style={{ ...bizFigure(14, A.INK), textAlign: 'center' }}>{h.hole_no}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: A.MUTE, textAlign: 'center' }}>
              {h.par ?? '\u2014'}
            </span>
            <span style={{ height: 5, borderRadius: 3, background: A.TRACK, display: 'block', overflow: 'hidden' }}>
              <i
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${width}%`,
                  background: difficultyRampStop(
                    Math.round(((holes.length - h.measured_rank) / Math.max(1, holes.length - 1)) * (DIFFICULTY_RAMP.length - 1)),
                  ),
                }}
              />
            </span>
            <span style={{ ...bizFigure(13, parts?.tone ?? A.INK), textAlign: 'right' }}>
              {parts?.text ?? '\u2014'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: A.MUTE, textAlign: 'right' }}>
              {h.stroke_index ?? '\u2014'}
            </span>
          </div>
        );
      })}
      <div style={{ ...BIZ_BODY, marginTop: 8, fontSize: 12 }}>
        Rank is the mean strokes over par on each hole. SI is your declared stroke index. A dash means we hold no
        figure for that hole.
      </div>
    </Panel>
  );
};

/* ───────────────── 3  WHAT GETS MADE HERE ───────────────── */

interface Outcome { key: string; label: string; count: number; colour: string }

export const ScoringSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const o = data.outcomes;
  // SEVEN OUTCOMES IN SCORECARD ORDER, worst to best (§4.1).
  // Colour: bogey and worse take the demanding ramp's deep end, par is
  // neutral, under par takes the to-par RED — which in this app is EARNED.
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
      <Panel kicker="What gets made here" aside={nLabel(data.rounds)}>
        <Body>No scored holes have landed on this course yet, so there is no distribution to show.</Body>
      </Panel>
    );
  }

  return (
    <Panel kicker="What gets made here" aside={nLabel(data.rounds)}
      subline="Every scored hole on your course, worst to best.">
      <Inset>
        {/* The shape first: one stacked bar. */}
        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: A.TRACK }}>
          {rows.map((r) => {
            if (r.count === 0) return null;
            // A RARE FEAT KEEPS A VISIBLE MARK: any non-zero count holds a
            // minimum width. The FIGURE carries the magnitude.
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
                    {/* ZERO IS A FACT, NOT AN ABSENCE (§6.1). */}
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

/* ───────────────── 4  WHAT YOUR TEES COST ───────────────── */

/**
 * §4.3 — ITS OWN SECTION, not a footnote to the verdict: each measured yardage
 * with its round count and mean over par, and one line naming the spread.
 * Directly useful for competition setup and visitor pricing.
 *
 * §4.4 — LABELLED BY YARDAGE plus a neutral position word. No colour is named
 * anywhere, because we know the distance and not the club's own naming.
 */
export const TeesSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const tees = sortTees(data.tees ?? []);
  const totalRounds = tees.reduce((s, t) => s + t.rounds, 0);

  // NO INVENTED ROWS (§6.2). If the tee split is not measured, we say so.
  if (tees.length === 0) {
    return (
      <Panel kicker="What your tees cost" aside={nLabel(data.rounds)}>
        <Body>
          We hold no yardages on these rounds, so we cannot tell which tees were played. Nothing here is estimated.
        </Body>
      </Panel>
    );
  }

  const spread = teeSpreadLine(tees);
  const hardest = tees.reduce((a, b) => (b.avg_to_par > a.avg_to_par ? b : a));

  return (
    <Panel
      kicker="What your tees cost"
      aside={nLabel(data.rounds)}
      subline={
        tees.length === 1
          ? 'Every round we hold was played off one set of tees.'
          : `Your rounds were played off ${tees.length} different yardages. Each is measured on its own.`
      }
    >
      <Inset>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 56px 52px',
            gap: 10,
            paddingBottom: 8,
          }}
        >
          <span style={BIZ_LABEL}>Set</span>
          <span style={{ ...BIZ_LABEL, textAlign: 'right' }}>Rounds</span>
          <span style={{ ...BIZ_LABEL, textAlign: 'right' }}>To par</span>
        </div>
        {tees.map((t) => {
          const parts = toParParts(t.avg_to_par * 18);
          // The bar is the SHARE OF ROUNDS on the set — the useful figure for
          // pricing and competition setup — and it is never zero-width for a
          // set that carries rounds.
          const width = totalRounds > 0 ? Math.max(3, (t.rounds / totalRounds) * 100) : 0;
          const isHardest = tees.length > 1 && t.yards === hardest.yards;
          return (
            <div key={t.yards} style={{ padding: '7px 0', fontFamily: SANS, ...FIGS }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 52px', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: isHardest ? A.INK : A.BODY }}>
                  {teeLabel(t, tees)}
                </span>
                <span style={{ ...bizFigure(14, A.INK), textAlign: 'right' }}>{t.rounds.toLocaleString()}</span>
                <span style={{ ...bizFigure(13, parts?.tone ?? A.INK), textAlign: 'right' }}>
                  {parts?.text ?? '0'}
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: A.TRACK, marginTop: 6, overflow: 'hidden' }}>
                {t.rounds > 0 && (
                  <i
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${width}%`,
                      background: difficultyRampStop(isHardest ? 5 : 3),
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </Inset>
      <Body style={{ marginTop: 12 }}>
        {spread ?? `Every round we hold here was played off ${yd(tees[0].yards)}, so there is no spread to compare yet.`}
      </Body>
      <Body style={{ marginTop: 8, fontSize: 11.5, color: A.DIM }}>
        To par is the mean over 18 holes on that set. We label these by yardage because that is what the rounds tell
        us — we do not know which colour your club calls each tee, so we do not guess.
      </Body>
    </Panel>
  );
};

/* ───────────────── 5  WHEN YOUR COURSE IS BUSY ───────────────── */

export const BusynessSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  const months = data.months ?? [];
  const total = months.reduce((s, m) => s + m.rounds, 0);
  if (months.length === 0 || total === 0) {
    return (
      <Panel kicker="When your course is busy" aside={nLabel(data.rounds)}>
        <Body>We hold no dated rounds on this course yet, so there is no seasonal pattern to show.</Body>
      </Panel>
    );
  }

  const peak = months.reduce((a, b) => (b.rounds > a.rounds ? b : a));
  const max = peak.rounds || 1;
  const summer = months.filter((m) => m.month >= 4 && m.month <= 9).reduce((s, m) => s + m.rounds, 0);
  const line =
    summer / total >= 0.7
      ? `${MONTHS[peak.month - 1]} is your busiest month, and the great majority of play lands between April and September.`
      : `${MONTHS[peak.month - 1]} is your busiest month, and play is spread fairly evenly across the year.`;

  return (
    <Panel kicker="When your course is busy" aside={nLabel(data.rounds)}>
      <Inset>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 96 }}>
          {MONTHS.map((label, i) => {
            const row = months.find((m) => m.month === i + 1);
            const count = row?.rounds ?? 0;
            const isPeak = count > 0 && count === peak.rounds;
            return (
              <div key={label} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                <div style={{ ...bizFigure(10, isPeak ? A.INK : A.DIM), marginBottom: 4 }}>{count}</div>
                <div
                  style={{
                    height: Math.max(count > 0 ? 4 : 2, (count / max) * 58),
                    borderRadius: 2,
                    background: isPeak ? A.INK : 'rgba(14,18,22,0.18)',
                  }}
                />
                {/* AXIS floor 10: day initial under a bar, a coordinate. */}
                <div style={{ ...LABEL, fontSize: 10, letterSpacing: '0.04em', marginTop: 5 }}>{label[0]}</div>
              </div>
            );
          })}
        </div>
      </Inset>
      <Body style={{ marginTop: 12 }}>{line}</Body>
    </Panel>
  );
};

/* ───────────────── 6  WHO PLAYS HERE ───────────────── */

export const WhoPlaysSection: React.FC<{ data: ClubCourseAnalytics }> = ({ data }) => {
  // §5c — the handicap breakdown WITHDRAWS ENTIRELY below the floor and says
  // so in one line. It does not render bands with short bars.
  if (data.rounds < EARLY_DATA_FLOOR) {
    return (
      <Panel kicker="Who plays here" aside="Early data">
        <Body>
          Handicap bands are held back until this course has {EARLY_DATA_FLOOR} measured rounds — below that, the split
          says more about who happened to play than about who plays here.
        </Body>
      </Panel>
    );
  }

  const bands = data.handicap_bands ?? [];
  const total = data.handicap_rounds || bands.reduce((s, b) => s + b.rounds, 0);
  if (bands.length === 0 || total === 0) {
    return (
      <Panel kicker="Who plays here" aside={nLabel(data.rounds)}>
        <Body>None of the rounds we hold carried a handicap index at the time of play, so there is no split to show.</Body>
      </Panel>
    );
  }

  const max = bands.reduce((m, b) => Math.max(m, b.rounds), 1);
  return (
    <Panel kicker="Who plays here" aside={`${total.toLocaleString()} rounds`}
      subline="The handicap index each player held at the time of the round, not the index they hold today.">
      {/*
        §8 — DISTRIBUTION ONLY. No low-versus-high difficulty claim is made here
        or anywhere else on this page: the base has no spread to support one.
      */}
      <Inset>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                  <i style={{ display: 'block', height: '100%', width: `${(b.rounds / max) * 100}%`, background: 'rgba(14,18,22,0.42)' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Inset>
    </Panel>
  );
};

/** Used by the early-data state's supporting line so the copy stays in one place. */
export const earlyDataNote = (rounds: number) =>
  `We hold ${rounds.toLocaleString()} ${rounds === 1 ? 'round' : 'rounds'} on this course. Everything below is real, and it is a signal rather than a finding until ${EARLY_DATA_FLOOR} rounds have landed.`;

export { ordinal };
