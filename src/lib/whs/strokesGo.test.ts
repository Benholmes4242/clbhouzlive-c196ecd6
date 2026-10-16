import { describe, it, expect } from 'vitest';
import { deriveStrokesGo, shotsToDifferential } from './strokesGo';
import type { ParSplitInput } from './strokesGo';

const split = (over: number, holes: number, bp: number, bog: number, dbl: number): ParSplitInput => ({
  par: 4,
  avg_over: over,
  holes_played: holes,
  pct_par_better: bp,
  pct_bogey: bog,
  pct_double: dbl,
});

/* 5B L1: a split carrying the four exact outcome counts, which partition
   holes_played exactly. */
const splitWithCounts = (
  over: number,
  holes: number,
  counts: { birdie: number; par: number; bogey: number; dbl: number },
): ParSplitInput => ({
  par: 4,
  avg_over: over,
  holes_played: holes,
  pct_par_better: 0,
  pct_bogey: 0,
  pct_double: 0,
  birdie_better_count: counts.birdie,
  par_count: counts.par,
  bogey_count: counts.bogey,
  double_count: counts.dbl,
});

/* A member with many partial cards: 90 / 540 / 270 holes = 900 total.
   complete_rounds would be far fewer than 50 — the basis rule must not use it. */
const fixture = {
  par3: split(0.4, 90, 30, 40, 10),
  par4: split(0.8, 540, 20, 50, 12),
  par5: split(0.5, 270, 40, 30, 8),
};

/* 5B: the same hole totals with exact counts.
   birdie 243 / par 243 / bogey 324 / double 90 over 900 holes
   = 27 / 27 / 36 / 10 — summing to exactly 100. */
const countedFixture = {
  par3: splitWithCounts(0.4, 90, { birdie: 27, par: 27, bogey: 27, dbl: 9 }),
  par4: splitWithCounts(0.8, 540, { birdie: 108, par: 162, bogey: 216, dbl: 54 }),
  par5: splitWithCounts(0.5, 270, { birdie: 108, par: 54, bogey: 81, dbl: 27 }),
};

describe('deriveStrokesGo', () => {
  it('5.2 basis: holes a round is the mix ratio × 18, never holes/complete_rounds', () => {
    const s = deriveStrokesGo(fixture)!;
    // 540/900 × 18 = 10.8 par-4 holes a round — independent of complete_rounds.
    expect(s.rows.find((r) => r.parN === 4)!.holesPerRound).toBeCloseTo(10.8, 5);
    expect(s.rows.find((r) => r.parN === 3)!.holesPerRound).toBeCloseTo(1.8, 5);
    expect(s.rows.find((r) => r.parN === 5)!.holesPerRound).toBeCloseTo(5.4, 5);
    // The three mix ratios sum to 18.
    expect(s.rows.reduce((x, r) => x + r.holesPerRound, 0)).toBeCloseTo(18, 5);
  });

  it('shots a round is avg_over × holes a round; the dominant type drives the title', () => {
    const s = deriveStrokesGo(fixture)!;
    expect(s.rows.find((r) => r.parN === 4)!.shotsPerRound).toBeCloseTo(0.8 * 10.8, 5);
    expect(s.dominant!.parN).toBe(4);
  });

  /* 5B L5: the bands are derived from the exact counts, not percentages. */
  it('5B L1/L2: bands come from the counts and sum to exactly 100 after rounding', () => {
    const s = deriveStrokesGo(countedFixture)!;
    expect(s.bands).not.toBeNull();
    expect(s.bands!.birdiePlus).toBe(27);
    expect(s.bands!.par).toBe(27);
    expect(s.bands!.bogey).toBe(36);
    expect(s.bands!.doublePlus).toBe(10);
    expect(s.bands!.birdiePlus + s.bands!.par + s.bands!.bogey + s.bands!.doublePlus).toBe(100);
  });

  it('5B L5: par is NOT zero when par_count is positive — the old remainder bug', () => {
    const s = deriveStrokesGo(countedFixture)!;
    // The bug read pct_par_better (par OR better) as the birdie band, which
    // drove the remainder-computed par band to a clamped zero.
    expect(s.bands!.par).toBeGreaterThan(0);
  });

  it('5B L5: birdie-or-better is strictly less than par-or-better would be', () => {
    const s = deriveStrokesGo(countedFixture)!;
    // birdie+ (27) must not stand in for par-or-better (27 + 27 = 54).
    expect(s.bands!.birdiePlus).toBeLessThan(s.bands!.birdiePlus + s.bands!.par);
    expect(s.bands!.birdiePlus).toBe(27);
  });

  it('5B L2: a 99/101 rounding remainder is added to the largest band', () => {
    // Counts chosen so the exact percentages round to a sum of 99:
    // 100 holes: 33.5/33.5/33.0/… — use 100 holes with thirds.
    const s = deriveStrokesGo({
      par3: null,
      par4: splitWithCounts(0.5, 300, { birdie: 100, par: 100, bogey: 100, dbl: 0 }),
      par5: null,
    })!;
    // Exact 33.333… ×3 → rounds to 33 ×3 = 99; the difference lands on a
    // largest band and the four still sum to exactly 100.
    expect(s.bands!.birdiePlus + s.bands!.par + s.bands!.bogey + s.bands!.doublePlus).toBe(100);
  });

  it('5B L3: when the counts are absent the bands and doubles figure are null', () => {
    const s = deriveStrokesGo(fixture)!; // pct-only splits, no count fields
    expect(s.bands).toBeNull();
    expect(s.doublesPerRound).toBeNull();
    // The three par rows above the bar are unaffected.
    expect(s.rows).toHaveLength(3);
  });

  it('5B L6: doubles a round reads the exact count share × 18', () => {
    const s = deriveStrokesGo(countedFixture)!;
    // double share = 90 / 900 = 0.10 exactly.
    expect(s.doublesPerRound).toBeCloseTo(0.1 * 18, 5);
  });

  it('null when no type has holes', () => {
    expect(deriveStrokesGo({ par3: null, par4: null, par5: null })).toBeNull();
    expect(
      deriveStrokesGo({ par3: split(0.5, 0, 0, 0, 0), par4: null, par5: null }),
    ).toBeNull();
  });

  /* 5A H4: par 5s below MIN_HOLES_PAR_TYPE — the row keeps its holes-a-round
     and holes-played but states no shots-a-round figure, the other rows are
     unaffected, the mix ratios still sum to 18, and the title names a type
     that cleared the threshold. */
  it('5A H1/H4: a below-threshold type keeps its row and mix ratio but states no figure', () => {
    const s = deriveStrokesGo({
      par3: split(0.4, 120, 30, 40, 10),
      par4: split(0.8, 540, 20, 50, 12),
      par5: split(0.5, 60, 40, 30, 8), // 60 < MIN_HOLES_PAR_TYPE
    })!;
    const p5 = s.rows.find((r) => r.parN === 5)!;
    // The row renders: holes-a-round and holes-played are present.
    expect(p5.holesPlayed).toBe(60);
    expect(p5.holesPerRound).toBeCloseTo((60 / 720) * 18, 5); // 1.5
    // …but there is NO shots-a-round figure.
    expect(p5.shotsPerRound).toBeNull();
    // The other two rows are unaffected.
    expect(s.rows.find((r) => r.parN === 3)!.shotsPerRound).toBeCloseTo(0.4 * ((120 / 720) * 18), 5);
    expect(s.rows.find((r) => r.parN === 4)!.shotsPerRound).toBeCloseTo(0.8 * ((540 / 720) * 18), 5);
    // H3: the three holes-a-round values still sum to 18.
    expect(s.rows.reduce((x, r) => x + r.holesPerRound, 0)).toBeCloseTo(18, 5);
    // H2: the derived title names a type that cleared the threshold.
    expect(s.dominant!.parN).toBe(4);
  });

  it('5A H2: when no type clears the threshold, dominant is null and the title falls back', () => {
    const s = deriveStrokesGo({
      par3: split(0.4, 40, 30, 40, 10),
      par4: split(0.8, 80, 20, 50, 12),
      par5: split(0.5, 60, 40, 30, 8),
    })!;
    expect(s.dominant).toBeNull();
    expect(s.rows.every((r) => r.shotsPerRound === null)).toBe(true);
    // The mix ratios are unaffected even when every figure is withheld.
    expect(s.rows.reduce((x, r) => x + r.holesPerRound, 0)).toBeCloseTo(18, 5);
  });
});

describe('shotsToDifferential', () => {
  it('a shot of gross is 113/slope of a differential', () => {
    expect(shotsToDifferential(1, 113)).toBeCloseTo(1, 5);
    expect(shotsToDifferential(1, 125)).toBeCloseTo(0.904, 3);
  });
});
