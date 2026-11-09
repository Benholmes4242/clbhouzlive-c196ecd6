/**
 * RULING (Round scores §3) — FeaturedRoundCard on FN1 net rules, everywhere
 * it renders (Home round of the week via FeedCard/HomeRail, Explore featured
 * round): the big photo figure is NET to par, the photo line is the net line
 * or nothing, and the stat row is FN1.5 (NET with to-par, GROSS with to-par,
 * HANDICAP, AWARDS). No gam_round_net row = no figure, no line, no NET cell.
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

const cell = (c: HTMLElement, stat: string) =>
  c.querySelector(`[data-explore-stat-value="${stat}"]`)?.textContent ?? null;

it('danny.akers1: figure −2, NET 68 −2, GROSS 67 −3, HANDICAP +1', () => {
  h.net = { netScore: 68, courseHandicap: -1 };
  const { container } = mount();
  // The big photo figure is NET to par, never the gross −3.
  const band = container.querySelector('[data-featured-band="true"]')!;
  const headline = container.querySelector('[data-round-trace]')!.parentElement!;
  expect(headline.textContent).toContain('−2');
  expect(headline.textContent).not.toContain('−3');
  expect(cell(band as HTMLElement, 'net')).toBe('68−2');
  expect(cell(band as HTMLElement, 'gross')).toBe('67−3');
  expect(cell(band as HTMLElement, 'handicap')).toBe('+1');
  expect(container.querySelector('[data-explore-stat-value="vs-hcp"]')).toBeNull();
});

it('the photo line is the net line and its end point agrees with the figure and the NET cell', () => {
  h.net = { netScore: 68, courseHandicap: -1 };
  const { container } = mount();
  expect(container.querySelector('[data-round-trace="net"]')).not.toBeNull();
  const received = feedStrokesReceived(shape, -1);
  expect(received).not.toBeNull();
  const series = feedNetSeries(shape, received!);
  const lineEnd = series.at(-1);
  expect(lineEnd).toBe(-2); // net 68 − par 70
  // Figure, line end and NET cell all say −2.
  const band = container.querySelector('[data-featured-band="true"]') as HTMLElement;
  expect(cell(band, 'net')).toContain('−2');
  const headline = container.querySelector('[data-round-trace]')!.parentElement!;
  expect(headline.textContent).toContain('−2');
});

it('no gam_round_net row: no figure, no line, no NET cell; GROSS and AWARDS still show', () => {
  h.net = { netScore: null, courseHandicap: null };
  const { container } = mount();
  const headline = container.querySelector('[data-round-trace]')!.parentElement!;
  expect(headline.textContent).not.toContain('−2');
  expect(headline.textContent).not.toContain('−3');
  expect(container.querySelector('[data-round-trace="net"]')).toBeNull();
  const band = container.querySelector('[data-featured-band="true"]') as HTMLElement;
  expect(cell(band, 'net')).toBe('');
  expect(cell(band, 'gross')).toBe('67−3');
  expect(cell(band, 'handicap')).toBe('');
});
