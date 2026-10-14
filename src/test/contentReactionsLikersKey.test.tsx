/**
 * WHY A ROUND SEEDS TWO KEYS. A round post's LikedByRow is mounted with the
 * whs_score_id: FeedCard.tsx (line ~557) sets
 * `reactionSubjectId: postRound?.whsScoreId ?? null`, and ExploreCard passes
 * that into LikedByRow with source 'round' — so the Clubhouse round card reads
 * ['post-likes', SCORE_ID, 'round']. Any surface that mounts LikedByRow with a
 * new source creates a reader under that key, which must be seeded AND
 * invalidated in useContentReactions or it goes stale until the app restarts.
 */
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

describe('likers cache is seeded and invalidated under every key a reader subscribes to (post id and score id for a round post)', () => {
  beforeEach(() => { seed.mockClear(); patch.mockClear(); from.mockReset(); });

  const seeds = () => seed.mock.calls.map((c) => `${c[1]}|${c[2]}`).sort();
  const keys = (spy: ReturnType<typeof vi.spyOn>) => postLikesKeys(spy).map((k) => k.join('|')).sort();

  it('a round with a post seeds the post id (post) and the score id (round), and invalidates both', async () => {
    const { qc, spy, view } = setup([{ id: 'post-9', whs_score_id: 'score-1' }]);
    await waitFor(() => expect(qc.getQueryData(['round-post-comments', 'score-1'])).toBeTruthy());
    await waitFor(() => expect(view.result.current.unavailable).toBe(false));
    act(() => view.result.current.toggle('round', 'score-1'));
    await waitFor(() => expect(keys(spy)).toEqual(['post-likes|post-9', 'post-likes|score-1']));
    expect(seeds()).toEqual(['post-9|post', 'score-1|round']);
  });

  it('a round with no post seeds once under the score id (round) and invalidates it', async () => {
    const { qc, spy, view } = setup([]);
    await waitFor(() => expect(qc.getQueryData(['round-post-comments', 'score-1'])).toBeTruthy());
    act(() => view.result.current.toggle('round', 'score-1'));
    await waitFor(() => expect(keys(spy)).toEqual(['post-likes|score-1']));
    expect(seeds()).toEqual(['score-1|round']);
  });
});
