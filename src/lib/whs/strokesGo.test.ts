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
});

describe('shotsToDifferential', () => {
  it('a shot of gross is 113/slope of a differential', () => {
    expect(shotsToDifferential(1, 113)).toBeCloseTo(1, 5);
    expect(shotsToDifferential(1, 125)).toBeCloseTo(0.904, 3);
  });
});
