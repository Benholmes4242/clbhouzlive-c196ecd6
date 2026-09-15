import { describe, expect, it } from 'vitest';

import { buildBlocks } from '@/features/explore-magazine/ExploreMagazine';
import type { ConsequenceKind, StreamItem } from '@/features/explore-magazine/streamItem';

/**
 * PLAIN ROUNDS PAIR TWO-UP. The allowlist is the whole point: a consequence
 * kind that is not plain keeps full width, and a new kind defaults to that.
 */

let seq = 0;

function round(
  opts: {
    consequence?: ConsequenceKind | null;
    course?: string | null;
    facts?: Partial<StreamItem['facts']>;
  } = {},
): StreamItem {
  seq += 1;
  return {
    id: `r${seq}`,
    kind: 'round',
    ring: null,
    lane: 'news',
    score: 1,
    consequence: opts.consequence ? { kind: opts.consequence } : null,
    subject: {
      course_id: opts.course === undefined ? `c${seq}` : opts.course,
      course_name: 'A course',
      region: 'Kent',
      sub_country: 'England',
      image_url: null,
      pending: false,
    },
    who: { user_id: `u${seq}`, display_name: 'A member', photo_url: null, is_viewer: false },
    facts: { gross: 84, to_par: 12, play_date: '2026-09-01', score_id: `s${seq}`, ...opts.facts },
    payload: {},
    seen: false,
  };
}

function review(): StreamItem {
  const item = round();
  return { ...item, kind: 'review', facts: { rating: 8, review_id: 'rev' } };
}

const ALL = { bareRoundPairs: true } as const;
const SCORES = { bareRoundPairs: true } as const;

/** The lead always takes the first slot, so fixtures put a spacer first. */
function shapes(items: StreamItem[], opts: Record<string, unknown>) {
  return buildBlocks([round({ consequence: 'record_taken' }), ...items], [], false, opts).map((b) => b.kind);
}

describe('plain round pairs', () => {
  it('pairs two no-consequence rounds at different courses on All', () => {
    expect(shapes([round(), round()], ALL)).toEqual(['lead', 'pair']);
  });

  it('pairs circle_round with list_first at different courses', () => {
    expect(shapes([round({ consequence: 'circle_round' }), round({ consequence: 'list_first' })], ALL)).toEqual([
      'lead',
      'pair',
    ]);
  });

  it('refuses a pair at the same course, rendering the first full width', () => {
    expect(shapes([round({ course: 'same' }), round({ course: 'same' })], ALL)).toEqual(['lead', 'std', 'std']);
  });

  it('never pairs a round with an unresolved course', () => {
    expect(shapes([round({ course: null }), round()], ALL)).toEqual(['lead', 'std', 'std']);
  });

  it.each<ConsequenceKind>(['platform_notable', 'rank_down', 'rank_up'])('keeps %s full width', (kind) => {
    expect(shapes([round({ consequence: kind }), round()], ALL)).toEqual(['lead', 'std', 'std']);
  });

  it('keeps a cap-demoted hero-eligible round full width', () => {
    expect(shapes([round({ facts: { eagles: 1 } }), round()], ALL)).toEqual(['lead', 'std', 'std']);
  });

  it('renders a plain round then a hero-eligible round as two full-width cards', () => {
    expect(shapes([round(), round({ consequence: 'record_taken' })], ALL)).toEqual(['lead', 'std', 'std']);
  });

  it('still refuses to pair a review with a round on All', () => {
    expect(shapes([review(), round()], ALL)).toEqual(['lead', 'std', 'std']);
  });

  it('pairs plain rounds on Scores and honours the same-course guard', () => {
    expect(shapes([round(), round()], SCORES)).toEqual(['lead', 'pair']);
    expect(shapes([round({ course: 'x' }), round({ course: 'x' })], SCORES)).toEqual(['lead', 'std', 'std']);
  });
});
