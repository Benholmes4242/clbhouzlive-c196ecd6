/**
 * RULING (Round scores §3) — FeaturedRoundCard on FN1 net rules, everywhere
 * it renders (Home round of the week via FeedCard/HomeRail, Explore featured
 * round). FEATURED_ROUND_OPTION_A rebuilt the card as the shared ScorePostBody
 * under a champion-block header: the big body figure is NET with its to-par,
 * the line is the FN1 net line or nothing, and the cells are FN1.5 (NET with
 * to-par, GROSS with to-par, HANDICAP, AWARDS). No gam_round_net row = no
 * NET cell and no line. The header feat figure is the reason headline
 * (course record, hole in one, …), not the net figure.
 */
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({ net: { netScore: 68, courseHandicap: -1 } as { netScore: number | null; courseHandicap: number | null } }));
vi.mock('@/features/explore-magazine/useFeaturedRound', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/explore-magazine/useFeaturedRound')>()),
  useFeaturedRoundNet: () => ({ data: h.net }),
}));

import { FeaturedRoundCard } from '@/features/explore-magazine/FeaturedRoundCard';
import type { FeaturedRound } from '@/features/explore-magazine/useFeaturedRound';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { feedStrokesReceived, feedNetSeries } from '@/components/feed/roundTilePlot';

afterEach(cleanup);

/** danny.akers1 — gross 67, net 68, course par 70 (WHS course handicap −1,
 *  displayed "+1"). Pars sum to 70; three birdies give gross −3. */
const PARS = [4, 4, 3, 4, 4, 3, 4, 5, 4, 4, 4, 3, 4, 4, 3, 4, 5, 4];
const shape: HoleShape = (() => {
  const holes = PARS.map((par, i) => ({
    holeNo: i + 1,
    par,
    strokes: par - (i < 3 ? 1 : 0),
    strokeIndex: i + 1,
  }));
  let cum = 0;
  const series = [0, ...holes.map((hl) => (cum += hl.strokes - hl.par))];
  return { holes, series } as unknown as HoleShape;
})();

const round: FeaturedRound = {
  whs_score_id: 's-akers', user_id: 'u-ak', display_name: 'Danny Akers', photo_url: null,
  course_id: 'c1', course_name: 'Test Course', image_url: null, play_date: '2026-11-01',
  gross: 67, course_par: 70, to_par: -3, stableford: null, birdies: 3, eagles: 0,
  albatrosses: 0, holes_in_one: 0, clean_card: false, net_score: 68, vs_hcp: 1,
  tier: 3, reason: 'low_round', joint_name: null, joint_count: null,
};

function mount(patch: Partial<FeaturedRound> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <FeaturedRoundCard round={{ ...round, ...patch }} viewerId="viewer" shape={shape} onOpen={() => {}} />
    </QueryClientProvider>,
  );
}

it('danny.akers1: body NET 68 −2, GROSS 67 −3, HANDICAP +1; header feat is the net to-par −2', () => {
  h.net = { netScore: 68, courseHandicap: -1 };
  const { container } = mount();
  // The big body figure is NET, never the gross −3.
  const net = container.querySelector('[data-round-score-net="true"]')!;
  expect(net.textContent).toContain('68');
  expect(net.querySelector('[data-round-score-net-topar="true"]')!.textContent).toBe('−2');
  const gross = container.querySelector('[data-round-score-gross="true"]')!;
  expect(gross.textContent).toContain('67');
  expect(gross.querySelector('[data-round-score-gross-topar="true"]')!.textContent).toBe('−3');
  expect(container.querySelector('[data-round-score-handicap="true"]')!.textContent).toContain('+1');
  // Tier 3 low_round: the header feat is the NET to-par, never gross.
  const feat = container.querySelector('[data-featured-feat-figure="true"]')!;
  expect(feat.textContent).toContain('−2');
  expect(feat.textContent).not.toContain('−3');
});

it('the body line is the net line and its end point agrees with the NET cell', () => {
  h.net = { netScore: 68, courseHandicap: -1 };
  const { container } = mount();
  expect(container.querySelector('[data-feed-round-plot="true"]')).not.toBeNull();
  const received = feedStrokesReceived(shape, -1);
  expect(received).not.toBeNull();
  const series = feedNetSeries(shape, received!);
  expect(series.at(-1)).toBe(-2); // net 68 − par 70
  const net = container.querySelector('[data-round-score-net="true"]')!;
  expect(net.textContent).toContain('−2');
});

it('no gam_round_net row: no NET cell, no line, no header figure; GROSS still shows', () => {
  h.net = { netScore: null, courseHandicap: null };
  const { container } = mount();
  expect(container.querySelector('[data-round-score-net="true"]')).toBeNull();
  expect(container.querySelector('[data-feed-round-plot="true"]')).toBeNull();
  expect(container.querySelector('[data-featured-feat-figure="true"]')).toBeNull();
  // Gross leads the body when net cannot be shown, with its to-par.
  const gross = container.querySelector('[data-round-score-gross="true"]')!;
  expect(gross.textContent).toContain('67');
  expect(gross.textContent).toContain('−3');
  expect(container.querySelector('[data-round-score-handicap="true"]')).toBeNull();
});
