/**
 * BRIEF_PAR_TYPE_ROWS_1 (PTR1.8) — the two rules that can silently go wrong:
 * the fixed-scale arithmetic and the hardest-selection rule. Pure functions
 * only; the rendered component is not under test here.
 */
import { describe, expect, it } from 'vitest';
import {
  HARDEST_MIN_GAP,
  LEVEL_TICK_PCT,
  PAR_SCALE_MAX,
  PAR_SCALE_MIN,
  hardestParType,
  orderParTypes,
  parTypeTrackPct,
} from '@/components/courses/course-detail/about/DefendsPar';

describe('parTypeTrackPct — the fixed −0.20…+1.20 scale', () => {
  it('maps a mid-scale value to its true position', () => {
    // 0.50 is 0.70 into a 1.40-wide scale → exactly half way.
    expect(parTypeTrackPct(0.5)).toBeCloseTo(50, 6);
  });

  it('clamps a value below −0.20 to the left end', () => {
    expect(parTypeTrackPct(-0.45)).toBe(0);
  });

  it('clamps a value above +1.20 to the right end', () => {
    expect(parTypeTrackPct(1.6)).toBe(100);
  });

  it('puts zero exactly on the level tick', () => {
    expect(parTypeTrackPct(0)).toBe(LEVEL_TICK_PCT);
    expect(LEVEL_TICK_PCT).toBeCloseTo((0 - PAR_SCALE_MIN) / (PAR_SCALE_MAX - PAR_SCALE_MIN) * 100, 6);
  });
});

describe('hardestParType — when amber may be claimed', () => {
  it('a clear winner takes it', () => {
    const rows = orderParTypes([
      { par: 4, holes: 11, perHole: 0.7 },
      { par: 3, holes: 4, perHole: 0.53 },
      { par: 5, holes: 3, perHole: 0.36 },
    ]);
    expect(hardestParType(rows)?.par).toBe(4);
  });

  it('a lead inside HARDEST_MIN_GAP claims no hardest', () => {
    const rows = orderParTypes([
      { par: 4, holes: 11, perHole: 0.55 },
      { par: 3, holes: 4, perHole: 0.55 - (HARDEST_MIN_GAP - 0.01) },
    ]);
    expect(hardestParType(rows)).toBeNull();
  });

  it('an exact tie orders by hole count, then by par number', () => {
    const byHoles = orderParTypes([
      { par: 3, holes: 4, perHole: 0.5 },
      { par: 4, holes: 11, perHole: 0.5 },
    ]);
    expect(byHoles[0].par).toBe(4);
    const byPar = orderParTypes([
      { par: 5, holes: 4, perHole: 0.5 },
      { par: 3, holes: 4, perHole: 0.5 },
    ]);
    expect(byPar[0].par).toBe(3);
    // …and a tie is still inside the gap, so neither takes amber.
    expect(hardestParType(byHoles)).toBeNull();
  });
});
