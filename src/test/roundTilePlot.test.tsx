/**
 * BRIEF_ROUND_TILE_1 — THE HOME FEED PLOT'S DATA RULES.
 *
 * BEA5: every played hole gets a dot in the house scorecard ramp — gold
 * eagle-or-better, red birdie (NEVER green), muted even par, bogey,
 * double-or-worse. BEA7/BEA8: only an ace, an albatross or an eagle is ever
 * named, and the name comes from the rule that tests strokes === 1 before
 * par - 3, so a par-four hole-in-one is an ace, not an albatross.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { feedHoleDots, feedFeat, RoundTilePlot, panelShowsCallout, homePanelCallout } from '@/components/feed/roundTilePlot';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import {
  SC_FILL_GOLD,
  SC_BOGEY_DARK,
  SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK, TOPAR_EVEN_DARK } from '@/features/tourhub/_shared/tokens';

const hole = (holeNo: number, par: number, strokes: number | null) => ({
  holeNo,
  par,
  strokes,
  sheetStrokes: strokes,
});

const shapeOf = (input: { holeNo: number; par: number; strokes: number | null }[]): HoleShape => {
  const holes = input.map((h) => ({ ...h, sheetStrokes: h.strokes }));
  const played = holes.filter((h) => h.strokes != null);
  const series: number[] = [0];
  let cum = 0;
  for (const h of played) {
    cum += (h.strokes as number) - (h.par as number);
    series.push(cum);
  }
  return {
    coursePar: 72,
    series,
    beads: [],
    played: played.length,
    birdies: played.filter((h) => (h.strokes as number) < (h.par as number)).length,
    holes,
  };
};

describe('feedHoleDots — every played hole, scorecard ramp', () => {
  it('dots every played hole and grades each in the ramp', () => {
    const shape = shapeOf([
      hole(1, 4, 2), // eagle -> gold
      hole(2, 4, 3), // birdie -> red
      hole(3, 4, 4), // par -> muted even
      hole(4, 4, 5), // bogey
      hole(5, 4, 6), // double
    ]);
    const dots = feedHoleDots(shape);
    expect(dots).toHaveLength(5);
    expect(dots.map((d) => d.tone)).toEqual([
      SC_FILL_GOLD,
      TOPAR_UNDER_DARK,
      '#727377',
      SC_BOGEY_DARK,
      SC_DOUBLE_DARK,
    ]);
    expect(dots.map((d) => d.i)).toEqual([1, 2, 3, 4, 5]);
  });

  it('skips holes with no score rather than drawing them as level par', () => {
    const shape = shapeOf([hole(1, 4, 4), hole(2, 4, null), hole(3, 4, 4)]);
    expect(feedHoleDots(shape)).toHaveLength(2);
  });

  it('never uses green for an under-par hole', () => {
    const shape = shapeOf([hole(1, 4, 3), hole(2, 5, 3)]);
    for (const d of feedHoleDots(shape)) expect(d.tone).not.toMatch(/green|#0?0?ff00|#00ff00/i);
  });
});

describe('feedFeat — the one named mark', () => {
  it('names an ace an ace, even on a par four where it is also three under', () => {
    const shape = shapeOf([hole(1, 4, 1), ...Array.from({ length: 17 }, (_, i) => hole(i + 2, 4, 4))]);
    expect(feedFeat(shape)).toEqual({ kind: 'ace', word: 'Ace' });
  });

  it('names an albatross an albatross', () => {
    const shape = shapeOf([hole(1, 5, 2), ...Array.from({ length: 17 }, (_, i) => hole(i + 2, 4, 4))]);
    expect(feedFeat(shape)).toEqual({ kind: 'albatross', word: 'Albatross' });
  });

  it('names an eagle an eagle', () => {
    const shape = shapeOf([hole(1, 5, 3), ...Array.from({ length: 17 }, (_, i) => hole(i + 2, 4, 4))]);
    expect(feedFeat(shape)).toEqual({ kind: 'eagle', word: 'Eagle' });
  });

  it('names nothing on an ordinary round, however many birdies', () => {
    const shape = shapeOf(Array.from({ length: 18 }, (_, i) => hole(i + 1, 4, i < 6 ? 3 : 4)));
    expect(feedFeat(shape)).toBeNull();
  });
});

describe('RoundTilePlot', () => {
  it('draws the trace with no scoring key and no feat mark on an ordinary round', () => {
    const shape = shapeOf(Array.from({ length: 18 }, (_, i) => hole(i + 1, 4, 4)));
    const { container } = render(<RoundTilePlot shape={shape} />);
    expect(container.querySelector('[data-feed-round-plot="true"]')).not.toBeNull();
    expect(container.querySelector('[data-feed-round-feat="true"]')).toBeNull();
  });

  it('shows the single gold feat mark when the card has an eagle', () => {
    const shape = shapeOf([hole(1, 5, 3), ...Array.from({ length: 17 }, (_, i) => hole(i + 2, 4, 4))]);
    const { container } = render(<RoundTilePlot shape={shape} />);
    const mark = container.querySelector('[data-feed-round-feat="true"]');
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe('Eagle');
  });
});

describe('panelShowsCallout -- one fact, one place (ROUND_TILE_1_R2)', () => {
  const eagleRound = () => shapeOf([hole(1, 5, 3), ...Array.from({ length: 17 }, (_, i) => hole(i + 2, 4, 4))]);
  const plain = () => shapeOf(Array.from({ length: 18 }, (_, i) => hole(i + 1, 4, 4)));
  it('suppresses an eagle panel when the plot already marks the eagle', () => {
    expect(panelShowsCallout('eagle', eagleRound())).toBe(false);
  });
  it('keeps a round feat panel beside the eagle mark', () => {
    expect(panelShowsCallout('birdies', eagleRound())).toBe(true);
    expect(panelShowsCallout('clean', eagleRound())).toBe(true);
  });
  it('keeps the hole-feat panel when no plot mark can show it', () => {
    expect(panelShowsCallout('ace', null)).toBe(true);
    expect(panelShowsCallout('eagle', plain())).toBe(true);
  });
  it('shows nothing when the round has no feat', () => {
    expect(panelShowsCallout(null, eagleRound())).toBe(false);
  });
});

describe('panelShowsCallout -- waits for the hole batch (ROUND_TILE_1_R3)', () => {
  it('draws no hole-feat panel while the batch is unsettled', () => {
    expect(panelShowsCallout('ace', undefined)).toBe(false);
    expect(panelShowsCallout('albatross', undefined)).toBe(false);
    expect(panelShowsCallout('eagle', undefined)).toBe(false);
  });
  it('never makes round or board feats wait on the batch', () => {
    for (const k of ['birdies', 'clean', 'record', 'net_record', 'rank_up']) {
      expect(panelShowsCallout(k, undefined)).toBe(true);
    }
  });
});

describe('homePanelCallout -- headline falls through once (ROUND_TILE_1_R4)', () => {
  const eagleRound = () => shapeOf([hole(1, 5, 3), ...Array.from({ length: 17 }, (_, i) => hole(i + 2, 4, 4))]);
  const eagle = { kind: 'eagle' as const, count: 1, hole: 1, tier: 'ink' as const };
  const birdies = { kind: 'birdies' as const, count: 5 };
  it('marked eagle plus birdie run: the panel shows the birdie run alone', () => {
    const out = homePanelCallout({ ...eagle, feats: [{ kind: 'eagle', count: 1 }, birdies] }, eagleRound());
    expect(out?.kind).toBe('birdies');
    expect(out && 'feats' in out ? out.feats : null).toEqual([birdies]);
  });
  it('marked eagle as the only feat: no panel', () => {
    expect(homePanelCallout({ ...eagle, feats: [{ kind: 'eagle', count: 1 }] }, eagleRound())).toBeNull();
  });
  it('a record headline stays the panel beside the eagle mark', () => {
    expect(homePanelCallout({ kind: 'record', margin: 1 }, eagleRound())?.kind).toBe('record');
  });
  it('unmarked eagle carries one feat only, never a list', () => {
    const out = homePanelCallout({ ...eagle, feats: [{ kind: 'eagle', count: 1 }, birdies] }, null);
    expect(out?.kind).toBe('eagle');
    expect(out && 'feats' in out ? out.feats : null).toHaveLength(2);
  });
  it('waits for the hole batch before deciding a hole headline', () => {
    const out = homePanelCallout({ ...eagle, feats: [{ kind: 'eagle', count: 1 }, birdies] }, undefined);
    expect(out?.kind).toBe('birdies');
    expect(out && 'feats' in out ? out.feats : null).toEqual([birdies]);
  });
});
