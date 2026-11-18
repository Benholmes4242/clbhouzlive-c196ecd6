import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { dehydrate, hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const reads = vi.hoisted(() => ({ from: vi.fn(), circle: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: reads.from } }));
vi.mock('@/lib/social/circle', () => ({ fetchCircleIds: reads.circle }));
import { useFeaturedSignals } from '@/components/courses/browse/useFeaturedSignals';
import { useBrowseReviews } from '@/components/courses/useBrowseReviews';
import { useTop100RankIndex } from '@/features/explore-magazine/useTop100RankIndex';
import { usePickTeeTimes } from '@/features/tourhub/tournament-v2/data/usePickTeeTimes';
import { useNewsEventNames } from '@/features/tourhub/news/newsPageData';
import { shouldPersistQuery } from '@/lib/queryPersister';

const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}
afterEach(() => { cleanup(); clients.splice(0).forEach((c) => c.clear()); vi.clearAllMocks(); });

it('persists Featured signals and browse Top 100 as arrays, restores membership, and treats legacy objects as empty', async () => {
  reads.circle.mockResolvedValue(['friend', 'friend']);
  const rows: Record<string, unknown[]> = {
    user_course_activity: [{ course_id: 'c2' }, { course_id: 'c1' }, { course_id: 'c1' }],
    course_ratings: [{ id: 'review', course_id: 'c1', user_id: 'me', rating: 8, review: 'text', created_at: '2026-11-18', user_profiles: { id: 'me', display_name: 'Member' }, course: { id: 'c1', name: 'Course' }, course_review_media: [] }],
    course_top100_memberships: [{ course_id: 'c1', rank: 1, top100_lists: { slug: 'global', is_active: true } }, { course_id: 'c1', rank: 1, top100_lists: { slug: 'gb-i', is_active: true } }],
    follows: [{ follower_actor_id: 'follower' }, { follower_actor_id: 'me' }],
    post_likes: [{ post_id: 'p1' }, { post_id: 'p1' }],
    sr_tournaments: [{ id: 'event', name: 'Event' }],
    sr_tee_times: [{ tee_time: '2026-11-18T10:00:00Z', players: [{ player_id: 'player' }] }],
  };
  reads.from.mockImplementation((table: string) => {
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'in', 'order', 'limit', 'not', 'neq']) chain[method] = () => chain;
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows[table] ?? [], error: null }).then(resolve);
    return chain;
  });
  function useSignals() {
    return {
      featured: useFeaturedSignals('me', ['c1', 'c2'], ['p1']),
      reviews: useBrowseReviews(null, null),
      ranks: useTop100RankIndex(),
      tees: usePickTeeTimes('event', 1, ['player']),
      names: useNewsEventNames(['event']),
    };
  }
  const fresh = setup();
  const first = renderHook(useSignals, { wrapper: fresh.wrapper });
  await waitFor(() => {
    expect(first.result.current.featured.likedPosts.has('p1')).toBe(true);
    expect(first.result.current.featured.connected.has('follower')).toBe(true);
    expect(first.result.current.reviews.pool[0]?.top100).toBe(true);
    expect(first.result.current.ranks.index?.get('c1')?.scope).toBe('gb-i');
    expect(first.result.current.tees.data?.get('player')).toBe('2026-11-18T10:00:00Z');
    expect(first.result.current.names.data?.get('event')).toBe('Event');
  });
  expect(fresh.client.getQueryData(['courses', 'featured-played', 'me'])).toEqual(['c1', 'c2']);
  const dehydrated = dehydrate(fresh.client, { shouldDehydrateQuery: shouldPersistQuery });
  expect(dehydrated.queries).toHaveLength(10);
  for (const query of dehydrated.queries) expect(Array.isArray(query.state.data)).toBe(true);
  const restoredData = JSON.parse(JSON.stringify(dehydrated));
  expect(restoredData).toEqual(dehydrated);
  first.unmount();
  const restored = setup();
  hydrate(restored.client, restoredData);
  reads.from.mockClear();
  const second = renderHook(useSignals, { wrapper: restored.wrapper });
  expect(second.result.current.featured.played.has('c2')).toBe(true);
  expect(second.result.current.featured.reviewed.has('c1')).toBe(true);
  expect(second.result.current.featured.top100.has('c1')).toBe(true);
  expect(second.result.current.featured.connected.has('friend')).toBe(true);
  expect(second.result.current.featured.likedPosts.has('p1')).toBe(true);
  expect(second.result.current.reviews.pool[0]?.top100).toBe(true);
  expect(second.result.current.ranks.index?.get('c1')?.scope).toBe('gb-i');
  expect(second.result.current.tees.data?.has('player')).toBe(true);
  expect(second.result.current.names.data?.has('event')).toBe(true);
  expect(reads.from).not.toHaveBeenCalled();
  second.unmount();
  const legacy = setup();
  for (const query of restoredData.queries) {
    legacy.client.setQueryData(query.queryKey, query.queryKey[1] === 'browse-reviews-v3' ? query.state.data : {});
  }
  const third = renderHook(useSignals, { wrapper: legacy.wrapper });
  for (const ids of [third.result.current.featured.played, third.result.current.featured.reviewed, third.result.current.featured.top100, third.result.current.featured.connected, third.result.current.featured.likedPosts]) {
    expect(ids.has('c1')).toBe(false);
    expect(ids.size).toBe(0);
  }
  expect(third.result.current.reviews.pool[0]?.top100).toBe(false);
  expect(third.result.current.ranks.index?.size).toBe(0);
  expect(third.result.current.tees.data?.size).toBe(0);
  expect(third.result.current.names.data?.size).toBe(0);
});