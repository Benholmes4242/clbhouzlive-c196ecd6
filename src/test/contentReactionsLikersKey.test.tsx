import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useContentReactions } from '@/components/explore-tab-new/courseled/hooks/useContentReactions';

const { from, seed, patch } = vi.hoisted(() => ({
  from: vi.fn(),
  seed: vi.fn((..._a: unknown[]) => () => {}),
  patch: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ availableActors: [] }) }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/lib/engagementCache', () => ({ patchEngagement: patch, seedViewerInLikers: seed }));

function setup(posts: { id: string; whs_score_id: string }[]) {
  from.mockImplementation((table: string) => ({
    select: () => ({
      in: async () => ({ data: table === 'posts' ? posts : [], error: null }),
    }),
    insert: async () => ({ error: null }),
  }));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const spy = vi.spyOn(qc, 'invalidateQueries');
  const view = renderHook(() => useContentReactions([{ type: 'round', id: 'score-1' }]), {
    wrapper: ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children),
  });
  return { qc, spy, view };
}

const postLikesKeys = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls
    .map((c) => (c[0] as { queryKey?: unknown[] })?.queryKey)
    .filter((k): k is unknown[] => Array.isArray(k) && k[0] === 'post-likes');

describe('likers cache is keyed on the post id the reader uses', () => {
  beforeEach(() => { seed.mockClear(); patch.mockClear(); from.mockReset(); });

  it('a round with a post seeds and invalidates under the post id, source post', async () => {
    const { qc, spy, view } = setup([{ id: 'post-9', whs_score_id: 'score-1' }]);
    await waitFor(() => expect(qc.getQueryData(['round-post-comments', 'score-1'])).toBeTruthy());
    await waitFor(() => expect(view.result.current.unavailable).toBe(false));
    act(() => view.result.current.toggle('round', 'score-1'));
    await waitFor(() => expect(postLikesKeys(spy).length).toBeGreaterThan(0));
    expect(seed).toHaveBeenCalledTimes(1);
    expect(seed.mock.calls[0][1]).toBe('post-9');
    expect(seed.mock.calls[0][2]).toBe('post');
    expect(postLikesKeys(spy)).toEqual([['post-likes', 'post-9']]);
  });

  it('a round with no post seeds nothing and invalidates nothing post-keyed', async () => {
    const { qc, spy, view } = setup([]);
    await waitFor(() => expect(qc.getQueryData(['round-post-comments', 'score-1'])).toBeTruthy());
    act(() => view.result.current.toggle('round', 'score-1'));
    await waitFor(() =>
      expect(spy.mock.calls.some((c) => (c[0] as { queryKey?: unknown[] })?.queryKey?.[0] === 'content-reactions')).toBe(true),
    );
    expect(seed).not.toHaveBeenCalled();
    expect(postLikesKeys(spy)).toEqual([]);
  });
});
