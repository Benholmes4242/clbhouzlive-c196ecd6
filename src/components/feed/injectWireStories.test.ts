import { describe, expect, it } from 'vitest';
import type { FeedPost } from '@/components/media-system/types/media';
import type { TourStory } from '@/features/tourhub/news/useTourStories';
import { injectWireStories, WIRE_SLIDE_CADENCE } from './injectWireStories';

const NOW = new Date('2026-08-31T11:00:00Z').getTime();
const posts = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `p${i}` } as FeedPost));
const story = (id: string, overrides: Partial<TourStory> = {}): TourStory => ({
  id, slug: id, kicker: 'Tour', headline: `Story ${id}`, standfirst: null,
  body_blocks: [], image_url: `${id}.jpg`, image_credit: null, tour_slug: null,
  tournament_id: null, published_at: new Date(NOW - 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

describe('injectWireStories', () => {
  it('uses the requested cadence and injects after complete groups only', () => {
    expect(WIRE_SLIDE_CADENCE).toBe(3);
    expect(injectWireStories(posts(2), [story('a')], NOW).map((x) => x.kind)).toEqual(['post', 'post']);
    expect(injectWireStories(posts(6), [story('a'), story('b')], NOW).map((x) => x.kind)).toEqual([
      'post', 'post', 'post', 'wire', 'post', 'post', 'post', 'wire',
    ]);
  });

  it('caps slides by unique eligible stories and continues with posts', () => {
    const merged = injectWireStories(posts(30), [story('a'), story('a'), story('b')], NOW);
    expect(merged.filter((x) => x.kind === 'wire').map((x) => x.story.id)).toEqual(['a', 'b']);
    expect(merged.filter((x) => x.kind === 'post')).toHaveLength(30);
  });

  it('skips image-less, stale, draft, and scheduled stories', () => {
    const result = injectWireStories(posts(6), [
      story('blank', { image_url: null }),
      story('stale', { published_at: new Date(NOW - 15 * 24 * 60 * 60 * 1000).toISOString() }),
      story('draft', { published_at: null }),
      story('scheduled', { published_at: new Date(NOW + 60_000).toISOString() }),
      story('valid'),
    ], NOW);
    expect(result.filter((x) => x.kind === 'wire').map((x) => x.story.id)).toEqual(['valid']);
  });
});