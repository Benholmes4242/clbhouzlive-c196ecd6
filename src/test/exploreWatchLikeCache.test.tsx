import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
import { patchEngagement } from '@/lib/engagementCache';
import { useWatchVideos } from '@/features/explore-magazine/watch/useWatchVideos';
type Row = { post_id: string; is_liked_by_me: boolean; like_count: number };
type Data = { pages: Row[][] };

describe('Explore watch caches receive like patches', () => {
  it.each([
    [['explore-watch-videos', 'u1', 'all', null]],
    [['explore-watch-clips', 'u1', 'all', null, null]],
  ])('%j is patched in place', key => {
    const qc = new QueryClient();
    qc.setQueryData(key, { pages: [[{ post_id: 'p1', is_liked_by_me: false, like_count: 1 }]], pageParams: [[]] });
    patchEngagement(qc, 'p1', { isLikedByMe: true, likeCountDelta: 1 });
    const row = qc.getQueryData<Data>(key)!.pages[0][0];
    expect(row.is_liked_by_me).toBe(true);
    expect(row.like_count).toBe(2);
  });

  it('long-form list shows like then unlike without refetching get_long_form_videos_v2', async () => {
    rpc.mockResolvedValue({ data: [{ post_id: 'p1', is_liked_by_me: false, like_count: 4 }], error: null });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useWatchVideos({ userId: 'u1', mode: 'all', search: null }), { wrapper });
    await waitFor(() => expect(result.current.data).toBeTruthy());
    act(() => patchEngagement(qc, 'p1', { isLikedByMe: true, likeCountDelta: 1 }));
    await waitFor(() => expect((result.current.data!.pages[0] as unknown as Row[])[0]).toMatchObject({ is_liked_by_me: true, like_count: 5 }));
    act(() => patchEngagement(qc, 'p1', { isLikedByMe: false, likeCountDelta: -1 }));
    await waitFor(() => expect((result.current.data!.pages[0] as unknown as Row[])[0]).toMatchObject({ is_liked_by_me: false, like_count: 4 }));
    expect(rpc.mock.calls.filter(c => c[0] === 'get_long_form_videos_v2')).toHaveLength(1);
  });
});
