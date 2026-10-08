import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const MEMBER = 'member-1';
const BIZ = 'biz-1';
const OTHER = 'member-2';

const { state, rpc } = vi.hoisted(() => ({
  state: { actor: null as null | { type: 'personal' | 'business'; id: string } },
  rpc: vi.fn(async (..._a: unknown[]) => ({ data: { liked: true, count: 3 }, error: null })),
}));

const COMMENT = {
  id: 'c1', target_type: 'round', target_id: 'score-1', parent_id: null, content: 'nice',
  user_id: OTHER, actor_type: 'personal', actor_id: OTHER, created_at: '2026-10-08T00:00:00Z',
};
// Another member personally, and our member AS their business.
const LIKES = [
  { comment_id: 'c1', user_id: OTHER, actor_type: 'personal', actor_id: OTHER },
  { comment_id: 'c1', user_id: MEMBER, actor_type: 'business', actor_id: BIZ },
];

function chain(table: string): unknown {
  const data =
    table === 'comments_v2' ? [COMMENT] : table === 'comment_likes_v2' ? LIKES : [];
  const result = { data, error: null, count: data.length };
  const proxy: unknown = new Proxy(function () {}, {
    get: (_t, prop) => (prop === 'then' ? (r: (v: unknown) => void) => r(result) : () => proxy),
    apply: () => proxy,
  });
  return proxy;
}

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (t: string) => chain(t), rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: MEMBER } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: state.actor }) }));
vi.mock('@/hooks/useBlockedUserIds', () => ({ useBlockedUserIds: () => new Set<string>() }));
vi.mock('@/lib/engagementCache', () => ({ patchEngagement: vi.fn() }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useReactionPostIds', () => ({
  useReactionPostIds: () => () => null,
}));

import { useCommentsV2 } from '@/features/comments-v2/hooks/useCommentsV2';

function mount() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return renderHook(() => useCommentsV2({ targetType: 'round', targetId: 'score-1', enabled: true }), {
    wrapper: ({ children }) => React.createElement(QueryClientProvider, { client: qc }, children),
  });
}

function findComment(threads: unknown): any {
  let hit: any = null;
  const walk = (v: any) => {
    if (!v || typeof v !== 'object' || hit) return;
    if (v.id === 'c1' && 'has_liked' in v) { hit = v; return; }
    Object.values(v).forEach(walk);
  };
  walk(threads);
  return hit;
}

describe('comment likes follow the active actor', () => {
  beforeEach(() => { rpc.mockClear(); state.actor = null; });

  it('personally un-liked, count includes both actors', async () => {
    state.actor = { type: 'personal', id: MEMBER };
    const { result } = mount();
    await waitFor(() => expect(findComment(result.current.threads)?.likes_count).toBe(2));
    expect(findComment(result.current.threads).has_liked).toBe(false);
  });

  it('liked when acting as the business, count still both', async () => {
    state.actor = { type: 'business', id: BIZ };
    const { result } = mount();
    await waitFor(() => expect(findComment(result.current.threads)?.has_liked).toBe(true));
    expect(findComment(result.current.threads).likes_count).toBe(2);
  });

  it('the toggle sends the active actor', async () => {
    state.actor = { type: 'business', id: BIZ };
    const { result } = mount();
    await act(async () => { await result.current.toggleLike.mutateAsync('c1'); });
    expect(rpc).toHaveBeenCalledWith('toggle_comment_like_v2', {
      p_comment_id: 'c1', p_actor_type: 'business', p_actor_id: BIZ,
    });
  });
});
