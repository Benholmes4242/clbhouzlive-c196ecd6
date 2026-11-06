import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query';
import { refreshAuthorPosts } from '@/features/post-v2/lib/refreshAuthorPosts';

afterEach(cleanup);

describe('VIEW_POST_1 exact author grid refetch', () => {
  it.each(['personal', 'business'] as const)('refetches the inactive %s author grid even with refetchOnMount false and puts the new post first', async actorType => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: false, staleTime: Infinity } } });
    const key = ['profile-posts', actorType, 'author', 'personal', 'viewer'];
    const read = vi.fn().mockResolvedValueOnce({ posts: ['old-post'] }).mockResolvedValue({ posts: ['new-post', 'old-post'] });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const useGrid = () => useInfiniteQuery({ queryKey: key, queryFn: read, initialPageParam: undefined, getNextPageParam: () => undefined });
    const first = renderHook(useGrid, { wrapper });
    await waitFor(() => expect(first.result.current.data?.pages[0].posts).toEqual(['old-post']));
    first.unmount();
    const foreign = ['profile-posts', actorType, 'other-author', 'personal', 'viewer'];
    client.setQueryData(foreign, { pages: [{ posts: ['foreign-post'] }], pageParams: [undefined] });
    await refreshAuthorPosts(client, actorType, 'author');
    expect(read).toHaveBeenCalledTimes(2);
    expect(client.getQueryState(foreign)?.isInvalidated).toBe(false);
    const second = renderHook(useGrid, { wrapper });
    expect(second.result.current.data?.pages[0].posts).toEqual(['new-post', 'old-post']);
    expect(read).toHaveBeenCalledTimes(2);
    second.unmount(); client.clear();
  });
  it('also refreshes the business legacy actor-posts v2 key, without refreshing another business', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    const read = vi.fn().mockResolvedValueOnce(['old-post']).mockResolvedValue(['new-post', 'old-post']);
    const key = ['actor-posts', 'business', 'author', 'v2'];
    await client.fetchQuery({ queryKey: key, queryFn: read });
    const foreign = ['actor-posts', 'business', 'other', 'v2'];
    client.setQueryData(foreign, ['foreign']);
    await refreshAuthorPosts(client, 'business', 'author');
    expect(read).toHaveBeenCalledTimes(2);
    expect(client.getQueryData(key)).toEqual(['new-post', 'old-post']);
    expect(client.getQueryState(foreign)?.isInvalidated).toBe(false);
    client.clear();
  });
});