/**
 * BUILD Round scores §3 — the Explore photo round card (Home round of the
 * week / featured shape) follows the Home score post's FN1 rules: the stat
 * row is FN1.5 (NET with to-par, GROSS with to-par, HANDICAP, AWARDS) via
 * feedNet, and the line on the photo is the NET line — or is not drawn when
 * the round cannot be converted to net. Never gross.
 *
 * The danny.akers1 shape: gross 67, net 68 on a par 72 — a plus handicap
 * (course handicap −1), so the net figure is WORSE than gross and the two
 * must never be swapped.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';

afterEach(cleanup);

/** Gross 67 on a par 72: birdies on 1–5, pars home. */
const holes = Array.from({ length: 18 }, (_, i) => ({
  holeNo: i + 1,
  par: 4,
  strokes: i < 5 ? 3 : 4,
  sheetStrokes: i < 5 ? 3 : 4,
  strokeIndex: i + 1,
  strokesAllowed: null,
}));

const shape: HoleShape = {
  coursePar: 72,
  series: [0],
  beads: [],
  played: 18,
  birdies: 5,
  holes,
};

function round(courseHandicap: number | null): StreamItem {
  return {
    id: 'rotw-round',
    kind: 'round',
    ring: 'own',
    lane: 'news',
    score: 1,
    consequence: null,
    subject: {
      course_id: 'addington',
      course_name: 'The Addington Golf Club',
      region: 'Surrey',
      sub_country: 'England',
      country: 'Britain & Ireland',
      image_url: 'https://example.test/bright-sky.jpg',
      pending: false,
    },
    who: { user_id: 'danny', display_name: 'danny.akers1', photo_url: null, is_viewer: false },
    facts: {
      gross: 67,
      to_par: -5,
      net: 68,
      course_par: 72,
      course_handicap: courseHandicap,
      play_date: '2026-11-06',
      score_id: 's-rotw',
    },
    payload: { round: { round_id: 's-rotw', front_nine_to_par: null, back_nine_to_par: null } },
    seen: false,
  } as unknown as StreamItem;
}

describe('round of the week on net (BUILD Round scores §3)', () => {
  it('stat row is FN1.5: NET with to-par first, then GROSS, HANDICAP; figure and NET cell agree', () => {
    const { container } = render(<ExploreCard item={round(-1)} size="std" shape={shape} onTap={() => undefined} />);
    const figures = container.querySelector('[data-round-figures="true"]');
    expect(figures).not.toBeNull();
    const net = container.querySelector('[data-round-figure="net"]');
    const gross = container.querySelector('[data-round-figure="gross"]');
    const handicap = container.querySelector('[data-round-figure="handicap"]');
    expect(net?.textContent).toContain('68');
    expect(net?.textContent).toContain('−4');
    expect(gross?.textContent).toContain('67');
    expect(gross?.textContent).toContain('−5');
    expect(handicap?.textContent).toContain('+1');
    /* NET leads the row; gross never stands in its place. */
    expect(figures!.firstElementChild?.getAttribute('data-round-figure')).toBe('net');
  });

  it('draws the net line on the photo, ending at the NET cell’s to-par', () => {
    const { container } = render(<ExploreCard item={round(-1)} size="std" shape={shape} onTap={() => undefined} />);
    /* The trace renders (the photo card's line) and the round is netted:
       gross 67 (−5) with one stroke given back ends at −4 — the NET cell's
       figure — never the gross −5. */
    const trace = container.querySelector('[data-explore-hero-bottom-lane="true"] svg, [data-round-figures="true"]');
    expect(trace).not.toBeNull();
    expect(container.querySelector('[data-round-figure="net"]')?.textContent).toContain('−4');
  });

  it('draws no line and blanks NET/HANDICAP when the round cannot be converted to net', () => {
    const { container } = render(<ExploreCard item={round(null)} size="std" shape={shape} onTap={() => undefined} />);
    expect(container.querySelector('[data-explore-hero-bottom-lane="true"] svg')).toBeNull();
    const net = container.querySelector('[data-round-figure="net"]');
    const handicap = container.querySelector('[data-round-figure="handicap"]');
    expect(net?.textContent ?? '').not.toContain('68');
    expect(handicap?.textContent?.trim() ?? '').not.toContain('+1');
    /* Gross keeps its own cell; it is never substituted into NET. */
    expect(container.querySelector('[data-round-figure="gross"]')?.textContent).toContain('67');
  });
});
