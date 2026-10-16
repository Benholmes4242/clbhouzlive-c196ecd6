/**
 * BRIEF_YOU_TAB_1 Phase 1 — the You tab's data rules. Fixture figures are the
 * brief's own published checks for Sundridge Park East; nothing here is read
 * by the app.
 */
import { describe, expect, it } from 'vitest';
import {
  EDGE_TOLERANCE,
  SEASON_MIN_ROUNDS,
  edgeConsistency,
  edgeSummary,
  fieldExcludingViewer,
  goodRounds,
  holeEdges,
  lastN,
  openHolesState,
  qualifyingSeasons,
  round1,
  type YouRoundInput,
} from '@/lib/courseYou/youDerivations';

const r = (id: number, date: string, gross: number | null, front: number | null = null, back: number | null = null): YouRoundInput => ({
  whsScoreId: `s${String(id).padStart(4, '0')}`,
  playDate: date,
  grossScore: gross,
  coursePar: 71,
  frontNineToPar: front,
  backNineToPar: back,
});

/* Mock edge per hole (field minus you), and the four holes the brief pins. */
const EDGES = [0.32, 0.21, 0.24, 0.21, 0.23, 0.12, 0.18, 0.14, 0.18, 0.26, 0.03, 0.12, 0.11, 0.23, 0.04, 0.19, 0.09, 0.11];
const FIELD: Record<number, number> = { 1: 0.62, 11: 0.31, 15: 0.68, 18: 1.13 };
const PARS = EDGES.map((_, i) => ({ hole_no: i + 1, par: 4 }));
const fieldRows = EDGES.map((_, i) => ({ hole_no: i + 1, scored_count: 50, avg_gross: 4 + (FIELD[i + 1] ?? 0.5) }));
const mineRows = EDGES.map((e, i) => ({
  hole_no: i + 1,
  times_played: 100,
  avg_to_par: (FIELD[i + 1] ?? 0.5) - e,
  birdie_count: i + 1 === 18 ? 0 : 3,
  eagle_or_better_count: 0,
  ace_count: 0,
}));

describe('P1.2 field excluding the viewer', () => {
  it('reproduces the brief check: 82.37 over 900 less 79.55 over 113 gives 82.77', () => {
    const v = fieldExcludingViewer({ fieldAvgOverPar: 11.37, fieldRounds: 900, viewerAvgOverPar: 8.55, viewerRounds: 113 });
    expect(v! + 71).toBeCloseTo(82.775, 2);
  });
  it('returns null when the viewer is the whole field or more', () => {
    expect(fieldExcludingViewer({ fieldAvgOverPar: 10, fieldRounds: 113, viewerAvgOverPar: 8, viewerRounds: 113 })).toBeNull();
    expect(fieldExcludingViewer({ fieldAvgOverPar: 10, fieldRounds: 100, viewerAvgOverPar: 8, viewerRounds: 140 })).toBeNull();
  });
  it('returns null on a zero or missing field', () => {
    expect(fieldExcludingViewer({ fieldAvgOverPar: 10, fieldRounds: 0, viewerAvgOverPar: 8, viewerRounds: 0 })).toBeNull();
    expect(fieldExcludingViewer({ fieldAvgOverPar: null, fieldRounds: 900, viewerAvgOverPar: 8, viewerRounds: 113 })).toBeNull();
  });
});

describe('P1.3 per-hole field excludes the viewer', () => {
  it('converts the excluded field gross to over par with the hole par', () => {
    const e = holeEdges(PARS, fieldRows, mineRows);
    expect(e[0].field).toBeCloseTo(0.62, 5);
    expect(e[0].you).toBeCloseTo(0.30, 5);
    expect(e[17].field).toBeCloseTo(1.13, 5);
    expect(e[17].you).toBeCloseTo(1.02, 5);
  });
  it('a hole the viewer never completed has no edge', () => {
    const e = holeEdges(PARS, fieldRows, mineRows.filter((m) => m.hole_no !== 7));
    expect(e[6].edge).toBeNull();
    expect(edgeSummary(e).unmeasured).toBe(1);
  });
});

describe('P1.4 per-hole gaps agree with the course gap', () => {
  const courseGap = fieldExcludingViewer({ fieldAvgOverPar: 11.37, fieldRounds: 900, viewerAvgOverPar: 8.55, viewerRounds: 113 })! - 8.55;
  it('sums 3.01 against 3.23, inside the tolerance', () => {
    const c = edgeConsistency(holeEdges(PARS, fieldRows, mineRows), courseGap);
    expect(c.holeSum).toBeCloseTo(3.01, 2);
    expect(c.courseGap).toBeCloseTo(3.23, 2);
    expect(c.ok).toBe(true);
  });
  it('fails when the two derivations drift beyond the tolerance', () => {
    const drifted = mineRows.map((m) => ({ ...m, avg_to_par: m.avg_to_par - 0.05 }));
    const c = edgeConsistency(holeEdges(PARS, fieldRows, drifted), courseGap);
    expect(c.diff).toBeGreaterThan(EDGE_TOLERANCE);
    expect(c.ok).toBe(false);
  });
});

describe('P3.4 least edge that matters', () => {
  it('names the 15th over the 11th because the field finds it harder', () => {
    const s = edgeSummary(holeEdges(PARS, fieldRows, mineRows));
    expect(s.leastEdge?.hole_no).toBe(15);
    expect(s.otherLevel.map((h) => h.hole_no)).toEqual([11]);
    expect(s.front).toBeCloseTo(1.83, 2);
    expect(s.back).toBeCloseTo(1.18, 2);
  });
});

describe('P1.5 null nines are excluded, never zeroed', () => {
  it('rests the nine averages on rounds that have both nines', () => {
    const g = goodRounds([r(1, '2026-05-01', 72, -1, 2), r(2, '2026-05-02', 73, null, null), r(3, '2026-05-03', 80, 4, 5)])!;
    expect(g.good.count).toBe(2);
    expect(g.good.nineCount).toBe(1);
    expect(g.good.front).toBe(-1);
  });
  it('P3.2: no good round means no section, threshold never lowered', () => {
    expect(goodRounds([r(1, '2026-05-01', 80), r(2, '2026-05-02', 76)])).toBeNull();
  });
});

describe('P1.6 one last-20', () => {
  const rounds = Array.from({ length: 45 }, (_, i) => r(i, `2026-01-${String((i % 28) + 1).padStart(2, '0')}T${String(i).padStart(2, '0')}`, 70 + (i % 10)));
  it('is the newest twenty only, and the previous twenty skips them', () => {
    const last = lastN(rounds)!;
    expect(last.rounds).toHaveLength(20);
    expect(lastN(rounds, 20, 20)!.rounds[0].whsScoreId).not.toBe(last.rounds[0].whsScoreId);
    expect(lastN(rounds.slice(0, 19))).toBeNull();
  });
  it('rounds 77.55 to 77.6', () => {
    expect(round1(77.55).toFixed(1)).toBe('77.6');
  });
});

describe('P2.4 seasons below the minimum are omitted', () => {
  it('drops a three-round season', () => {
    const rounds = [
      ...Array.from({ length: 3 }, (_, i) => r(i, '2018-06-0' + (i + 1), 85)),
      ...Array.from({ length: SEASON_MIN_ROUNDS }, (_, i) => r(10 + i, '2021-06-0' + (i + 1), 80)),
    ];
    expect(qualifyingSeasons(rounds).map((s) => s.year)).toEqual([2021]);
  });
});

describe('P4.1 one hole left', () => {
  it('renders one open hole, completes at zero, and is absent above a handful', () => {
    const e = holeEdges(PARS, fieldRows, mineRows);
    const s = openHolesState(e);
    expect(s.kind === 'open' && s.open.map((h) => h.hole_no)).toEqual([18]);
    expect(openHolesState(e.map((h) => ({ ...h, birdied: true }))).kind).toBe('complete');
    expect(openHolesState(e.map((h, i) => ({ ...h, birdied: i > 4 }))).kind).toBe('none');
  });
});
