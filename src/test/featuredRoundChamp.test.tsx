/**
 * FEATURED_ROUND_OPTION_A — the Featured round / Round of the week card is
 * the standard score post body under a champion-block header. No photograph,
 * wash, gold frame, pill or static trace; the header carries the gold ring,
 * the per-surface label, the name, "<date> · Following" and the feat figure.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/features/explore-magazine/useFeaturedRound', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/explore-magazine/useFeaturedRound')>()),
  useFeaturedRoundNet: () => ({ data: { netScore: 68, courseHandicap: 2 } }),
}));

import { FeaturedRoundCard } from '@/features/explore-magazine/FeaturedRoundCard';
import type { FeaturedRound } from '@/features/explore-magazine/useFeaturedRound';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';

afterEach(cleanup);

const PARS = [4, 4, 3, 4, 4, 3, 4, 5, 4, 4, 4, 3, 4, 4, 3, 4, 5, 4];
const shape: HoleShape = (() => {
  const holes = PARS.map((par, i) => ({ holeNo: i + 1, par, strokes: par - (i < 3 ? 1 : 0), strokeIndex: i + 1 }));
  let cum = 0;
  const series = [0, ...holes.map((hl) => (cum += hl.strokes - hl.par))];
  return { holes, series } as unknown as HoleShape;
})();

const base: FeaturedRound = {
  whs_score_id: 's1', user_id: 'u1', display_name: 'Danny Akers', photo_url: null,
  course_id: 'c1', course_name: 'Woburn Golf Club', image_url: null, play_date: '2026-11-04',
  gross: 74, course_par: 72, to_par: 2, stableford: null, birdies: 3, eagles: 0,
  albatrosses: 0, holes_in_one: 0, clean_card: false, net_score: 68, vs_hcp: 1,
  tier: 2, reason: 'course_record', joint_name: null, joint_count: null,
};

function mount(patch: Partial<FeaturedRound> = {}, props: Record<string, unknown> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <FeaturedRoundCard round={{ ...base, ...patch }} viewerId="viewer" shape={shape} onOpen={() => {}} {...props} />
    </QueryClientProvider>,
  );
}

describe('FEATURED_ROUND_OPTION_A', () => {
  it('renders no photograph, pill, gold frame or static trace', () => {
    const { container } = mount();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.standout-figure-chip')).toBeNull();
    expect(container.querySelector('[data-round-trace]')).toBeNull();
    expect(container.querySelector('[data-featured-band]')).toBeNull();
  });

  it('header label is "Round of the week" by default (Home) and "Featured" when passed (Explore)', () => {
    const home = mount();
    expect(home.container.querySelector('[data-featured-champ="true"]')!.textContent).toContain('Round of the week');
    home.unmount();
    const explore = mount({}, { pillLabel: 'Featured' });
    const champ = explore.container.querySelector('[data-featured-champ="true"]')!;
    expect(champ.textContent).toContain('Featured');
    expect(champ.textContent).not.toContain('Round of the week');
  });

  it('course record renders the gross figure with the COURSE RECORD unit', () => {
    const { container } = mount();
    const feat = container.querySelector('[data-featured-feat-figure="true"]')!;
    expect(feat.textContent).toContain('74');
    expect(feat.textContent?.toUpperCase()).toContain('COURSE RECORD');
  });

  it('hole in one renders the words alone, no unit', () => {
    const { container } = mount({ tier: 1, reason: 'hole_in_one', holes_in_one: 1 });
    const words = container.querySelector('[data-featured-feat-words="true"]')!;
    expect(words.textContent).toBe('Hole in one');
    expect(container.querySelector('[data-featured-feat-figure="true"]')).toBeNull();
  });

  it('birdie run renders the run words alone', () => {
    const { container } = mount({ tier: 3, reason: 'birdie_run', birdie_run: 5 });
    const words = container.querySelector('[data-featured-feat-words="true"]')!;
    expect(words.textContent).toBe('5 birdies in a row');
  });

  it('the body is the score post: NET/GROSS/HANDICAP cells, the net line and the HoleMarks row', () => {
    const { container } = mount();
    expect(container.querySelector('[data-round-score-net="true"]')!.textContent).toContain('68');
    expect(container.querySelector('[data-round-score-gross="true"]')!.textContent).toContain('74');
    expect(container.querySelector('[data-round-score-handicap="true"]')!.textContent).toContain('2');
    expect(container.querySelector('[data-feed-round-plot="true"]')).not.toBeNull();
    expect(container.querySelector('[data-plot-marks]')).not.toBeNull();
    expect(container.querySelector('[data-feed-round-course="true"]')!.textContent).toContain('Woburn Golf Club');
  });
});
