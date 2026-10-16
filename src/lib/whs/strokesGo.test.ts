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

/* A member with many partial cards: 90 / 540 / 270 holes = 900 total.
   complete_rounds would be far fewer than 50 — the basis rule must not use it. */
const fixture = {
  par3: split(0.4, 90, 30, 40, 10),
  par4: split(0.8, 540, 20, 50, 12),
  par5: split(0.5, 270, 40, 30, 8),
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

  it('outcome bands are weighted by holes_played and partition the holes', () => {
    const s = deriveStrokesGo(fixture)!;
    // birdie+ = (30×90 + 20×540 + 40×270) / 900 = 24300/900 = 27
    expect(s.bands.birdiePlus).toBeCloseTo(27, 5);
    // bogey = (40×90 + 50×540 + 30×270) / 900 = 38700/900 = 43
    expect(s.bands.bogey).toBeCloseTo(43, 5);
    // double+ = (10×90 + 12×540 + 8×270) / 900 = 9540/900 = 10.6
    expect(s.bands.doublePlus).toBeCloseTo(10.6, 5);
    // par is the remainder: 100 − 27 − 43 − 10.6 = 19.4
    expect(s.bands.par).toBeCloseTo(19.4, 5);
    expect(s.bands.birdiePlus + s.bands.par + s.bands.bogey + s.bands.doublePlus).toBeCloseTo(100, 5);
  });

  it('doubles a round is the double+ share × 18', () => {
    const s = deriveStrokesGo(fixture)!;
    expect(s.doublesPerRound).toBeCloseTo(0.106 * 18, 5);
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
