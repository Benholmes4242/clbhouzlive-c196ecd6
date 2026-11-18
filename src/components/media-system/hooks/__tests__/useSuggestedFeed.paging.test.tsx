import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useSuggestedFeed } from '../useSuggestedFeed';

const f = vi.hoisted(() => ({ rpc: vi.fn(), actor: { type: 'personal', id: 'u1' } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: f.actor }) }));
vi.mock('../../utils/feedMapper', () => ({
  mapRowToFeedPost: (row: { post_id: string }) => ({ id: row.post_id }),
  groupMultiMedia: (posts: { id: string }[]) => posts,
}));

const key = ['media-feed', 'suggested', 'u1', 'personal', 'u1'];
const rows = (...ids: string[]) => ids.map(post_id => ({ post_id, post_created_at: '2026-06-18' }));
function setup(seed?: unknown) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: false } } });
  if (seed) client.setQueryData(key, seed);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => useSuggestedFeed('u1'), { wrapper }) };
}

beforeEach(() => { f.rpc.mockReset(); f.actor = { type: 'personal', id: 'u1' }; });

describe('suggested feed cache paging', () => {
  it('first page sends the four fixed arguments with no cursor or exclusions', async () => {
    f.rpc.mockResolvedValue({ data: rows('a', 'b'), error: null });
    const { result, client } = setup();
    await waitFor(() => expect(result.current.posts).toHaveLength(2));
    expect(f.rpc).toHaveBeenCalledWith('get_suggested_feed_v3', {
      p_user_id: 'u1', p_page_size: 60, p_viewer_actor_type: 'personal', p_viewer_actor_id: 'u1',
    });
    expect(client.getQueryData<{ pageParams: number[] }>(key)?.pageParams).toEqual([0]);
    expect(result.current).not.toHaveProperty('resetSeen');
  });

  it('later pages exclude every earlier cached post, use numeric pages and dedupe output', async () => {
    f.rpc.mockResolvedValueOnce({ data: rows('a', 'b'), error: null })
      .mockResolvedValueOnce({ data: rows('b', 'c'), error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    const { result, client } = setup();
    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await act(async () => { await result.current.fetchNextPage(); });
    expect(f.rpc.mock.calls[1][1]).toEqual({
      p_user_id: 'u1', p_page_size: 60, p_viewer_actor_type: 'personal', p_viewer_actor_id: 'u1', p_seen_post_ids: ['a', 'b'],
    });
    await waitFor(() => expect(result.current.posts.map(post => post.id)).toEqual(['a', 'b', 'c']));
    await act(async () => { await result.current.fetchNextPage(); });
    expect(f.rpc.mock.calls[2][1].p_seen_post_ids).toEqual(['a', 'b', 'c']);
    expect(f.rpc.mock.calls[2][1]).not.toHaveProperty('p_cursor');
    expect(client.getQueryData<{ pageParams: number[] }>(key)?.pageParams).toEqual([0, 1, 2]);
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    await act(async () => { await result.current.fetchNextPage(); });
    expect(f.rpc).toHaveBeenCalledTimes(3);
  });

  it('restored old cursor pages still exclude their posts and continue at page index 2', async () => {
    f.rpc.mockResolvedValue({ data: [], error: null });
    const { result, client } = setup({ pages: [
      { posts: [{ id: 'restored-a' }], rawRowCount: 1 },
      { posts: [{ id: 'restored-b' }], rawRowCount: 1 },
    ], pageParams: [undefined, '2026-06-18'] });
    await act(async () => { await result.current.fetchNextPage(); });
    expect(f.rpc.mock.calls[0][1].p_seen_post_ids).toEqual(['restored-a', 'restored-b']);
    expect(client.getQueryData<{ pageParams: unknown[] }>(key)?.pageParams.at(-1)).toBe(2);
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
  });

  it('caps cached exclusions at the newest 500 unique ids in cache order', async () => {
    f.rpc.mockResolvedValue({ data: [], error: null });
    const posts = Array.from({ length: 510 }, (_, i) => ({ id: `post-${i}` }));
    const { result } = setup({ pages: [{ posts, rawRowCount: 510 }], pageParams: [0] });
    await act(async () => { await result.current.fetchNextPage(); });
    expect(f.rpc.mock.calls[0][1].p_seen_post_ids).toEqual(posts.slice(-500).map(post => post.id));
  });

  it('a restored page without numeric rawRowCount cannot start another fetch', async () => {
    const { result } = setup({ pages: [{ posts: [{ id: 'old' }], nextCursor: 'old-date' }], pageParams: [0] });
    expect(result.current.hasNextPage).toBe(false);
    await act(async () => { await result.current.fetchNextPage(); });
    expect(f.rpc).not.toHaveBeenCalled();
  });

  it('a first-page refetch omits exclusions even when cached posts exist', async () => {
    f.rpc.mockResolvedValue({ data: rows('fresh'), error: null });
    const { result } = setup({ pages: [{ posts: [{ id: 'old' }], rawRowCount: 1 }], pageParams: [0] });
    await act(async () => { await result.current.refetch(); });
    expect(f.rpc.mock.calls[0][1]).not.toHaveProperty('p_seen_post_ids');
    expect(f.rpc.mock.calls[0][1]).not.toHaveProperty('p_cursor');
    await waitFor(() => expect(result.current.posts.map(post => post.id)).toEqual(['fresh']));
  });

  it('a full refetch of page 1 excludes only cached page 0, not its own posts', async () => {
    f.rpc.mockResolvedValueOnce({ data: rows('a', 'b'), error: null })
      .mockResolvedValueOnce({ data: rows('c', 'd'), error: null });
    const { result } = setup({ pages: [
      { posts: [{ id: 'a' }, { id: 'b' }], rawRowCount: 2 },
      { posts: [{ id: 'c' }, { id: 'd' }], rawRowCount: 2 },
    ], pageParams: [0, 1] });
    await act(async () => { await result.current.refetch(); });
    expect(f.rpc).toHaveBeenCalledTimes(2);
    expect(f.rpc.mock.calls[0][1]).not.toHaveProperty('p_seen_post_ids');
    expect(f.rpc.mock.calls[1][1].p_seen_post_ids).toEqual(['a', 'b']);
    expect(f.rpc.mock.calls[1][1]).not.toHaveProperty('p_cursor');
  });

  it('only reads the cache for the selected business actor', async () => {
    f.actor = { type: 'business', id: 'biz' };
    f.rpc.mockResolvedValue({ data: [], error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: false } } });
    client.setQueryData(key, { pages: [{ posts: [{ id: 'personal-post' }], rawRowCount: 1 }], pageParams: [0] });
    client.setQueryData(['media-feed', 'suggested', 'u1', 'business', 'biz'], {
      pages: [{ posts: [{ id: 'business-post' }], rawRowCount: 1 }], pageParams: [0],
    });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useSuggestedFeed('u1'), { wrapper });
    await act(async () => { await result.current.fetchNextPage(); });
    expect(f.rpc.mock.calls[0][1]).toEqual({
      p_user_id: 'u1', p_page_size: 60, p_viewer_actor_type: 'business', p_viewer_actor_id: 'biz', p_seen_post_ids: ['business-post'],
    });
  });
});