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
    expect(WIRE_SLIDE_CADENCE).toBe(6);
    expect(injectWireStories(posts(0), [story('a')], [], NOW)).toEqual([]);
    expect(injectWireStories(posts(5), [story('a')], [], NOW).map((x) => x.kind)).toEqual(
      Array.from({ length: 5 }, () => 'post'),
    );
    expect(injectWireStories(posts(6), [story('a')], [], NOW).map((x) => x.kind)).toEqual([
      'post', 'post', 'post', 'post', 'post', 'post', 'wire',
    ]);
  });

  it('alternates beats by slot, tour first', () => {
    const tour = Array.from({ length: 5 }, (_, i) => story(`t${i}`));
    const amateur = Array.from({ length: 5 }, (_, i) => story(`a${i}`));
    const merged = injectWireStories(posts(30), tour, amateur, NOW);
    const slides = merged.filter((x) => x.kind === 'wire') as Extract<
      (typeof merged)[number],
      { kind: 'wire' }
    >[];
    expect(slides.map((s) => s.beat)).toEqual(['tour', 'amateur', 'tour', 'amateur', 'tour']);
    expect(slides.map((s) => s.story.id)).toEqual(['t0', 'a0', 't1', 'a1', 't2']);
    expect(slides.map((s) => s.key)).toEqual([
      'wire:tour:t0', 'wire:amateur:a0', 'wire:tour:t1', 'wire:amateur:a1', 'wire:tour:t2',
    ]);
  });

  it('falls back to the other beat rather than leaving a gap', () => {
    const tour = Array.from({ length: 5 }, (_, i) => story(`t${i}`));
    const merged = injectWireStories(posts(30), tour, [], NOW);
    const slides = merged.filter((x) => x.kind === 'wire');
    expect(slides).toHaveLength(5);
    expect(slides.every((s) => s.kind === 'wire' && s.beat === 'tour')).toBe(true);
  });

  it('caps slides by unique eligible stories and continues with posts', () => {
    const exhausted = injectWireStories(posts(30), [story('a'), story('a'), story('b')], [], NOW);
    expect(
      exhausted.filter((x) => x.kind === 'wire').map((x) => (x.kind === 'wire' ? x.story.id : '')),
    ).toEqual(['a', 'b']);
    expect(exhausted.filter((x) => x.kind === 'post')).toHaveLength(30);
  });

  it('skips image-less, stale, draft, and scheduled stories', () => {
    const result = injectWireStories(posts(6), [
      story('blank', { image_url: null }),
      story('stale', { published_at: new Date(NOW - 15 * 24 * 60 * 60 * 1000).toISOString() }),
      story('draft', { published_at: null }),
      story('scheduled', { published_at: new Date(NOW + 60_000).toISOString() }),
      story('valid'),
    ], [], NOW);
    expect(
      result.filter((x) => x.kind === 'wire').map((x) => (x.kind === 'wire' ? x.story.id : '')),
    ).toEqual(['valid']);
  });

  it('consumes eligible stories newest first', () => {
    const result = injectWireStories(posts(12), [
      story('older', { published_at: new Date(NOW - 3 * 24 * 60 * 60 * 1000).toISOString() }),
      story('newer', { published_at: new Date(NOW - 60 * 60 * 1000).toISOString() }),
    ], [], NOW);
    expect(
      result.filter((x) => x.kind === 'wire').map((x) => (x.kind === 'wire' ? x.story.id : '')),
    ).toEqual(['newer', 'older']);
  });
});
