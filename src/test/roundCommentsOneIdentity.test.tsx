import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { patch, postIdFor, rpc } = vi.hoisted(() => ({
  patch: vi.fn(),
  postIdFor: { value: null as string | null },
  rpc: vi.fn(async (..._a: unknown[]) => ({ data: {}, error: null })),
}));

// A chainable, awaitable stand-in for every PostgREST builder.
function chain(): unknown {
  const result = { data: [], error: null, count: 0 };
  const proxy: unknown = new Proxy(function () {}, {
    get: (_t, prop) => (prop === 'then' ? (r: (v: unknown) => void) => r(result) : () => proxy),
    apply: () => proxy,
  });
  return proxy;
}

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => chain(), rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useBlockedUserIds', () => ({ useBlockedUserIds: () => new Set<string>() }));
vi.mock('@/lib/engagementCache', () => ({ patchEngagement: patch }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useReactionPostIds', () => ({
  useReactionPostIds: () => () => postIdFor.value,
}));

import { useCommentsV2 } from '@/features/comments-v2/hooks/useCommentsV2';

const src = fs.readFileSync(path.join(process.cwd(), 'src/features/explore-magazine/ExploreMagazine.tsx'), 'utf8');

function post() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = renderHook(() => useCommentsV2({ targetType: 'round', targetId: 'score-1', enabled: true }), {
    wrapper: ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children),
  });
  act(() => { view.result.current.addComment.mutate({ content: 'nice' }); });
  return view;
}

describe('one object, one identity: round comments key on the round', () => {
  beforeEach(() => { patch.mockClear(); rpc.mockClear(); });

  it('the Explore round tile opens comments as round + score id, never post', () => {
    expect(src).toContain("setOpenComments({ type: 'round', id: scoreId })");
    expect(src).not.toContain("setOpenComments({ type: 'post', id: post.postId })");
    expect(src).toContain("useStoryEngagement('round', roundScoreIds)");
  });

  it('opening comments never calls ensure_round_post', () => {
    expect(src).not.toMatch(/\('ensure_round_post'/);
    expect(src).not.toContain('ensuringRef');
  });

  it("a round comment patches the round's post comment count when a post exists", async () => {
    postIdFor.value = 'post-9';
    const view = post();
    await waitFor(() => expect(view.result.current.addComment.isSuccess).toBe(true));
    expect(patch).toHaveBeenCalledWith(expect.anything(), 'post-9', { commentCountDelta: 1 });
  });

  it('a round comment patches nothing when the round has no post', async () => {
    postIdFor.value = null;
    const view = post();
    await waitFor(() => expect(view.result.current.addComment.isSuccess).toBe(true));
    expect(patch).not.toHaveBeenCalled();
  });
});
