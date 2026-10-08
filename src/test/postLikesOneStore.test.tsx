import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const M = 'member-1', BIZ = 'biz-1';
const state = vi.hoisted(() => ({ post: null as any, reactions: [] as any[], tables: [] as string[], profileIds: [] as string[] }));

vi.mock('@/integrations/supabase/client', () => {
  const chain = (table: string) => {
    state.tables.push(table);
    const q: any = {
      select: () => q, eq: () => q, order: () => q, limit: () => q,
      in: (_c: string, ids: string[]) => { if (table === 'user_profiles') state.profileIds.push(...ids); return q; },
      maybeSingle: async () => ({ data: state.post, error: null }),
      then: (res: any) => {
        if (table === 'content_reactions') return res({ data: state.reactions, error: null });
        if (table === 'post_likes') return res({ data: [{ user_id: 'stray', actor_type: 'business', actor_id: 'stray-biz' }], error: null });
        if (table === 'user_profiles') return res({ data: [{ id: M, display_name: 'Ben', username: 'ben', profile_photo_url: null }], error: null });
        if (table === 'business_accounts') return res({ data: [{ id: BIZ, name: 'Links Pro Shop', slug: 'links-pro', logo_url: 'logo.png' }], error: null });
        return res({ data: [], error: null });
      },
    };
    return q;
  };
  return { supabase: { from: chain } };
});

import { usePostLikes } from '@/hooks/usePostLikes';

const run = async () => {
  const qc = new QueryClient();
  const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => usePostLikes('post-1', true, 'post'), { wrapper });
  await waitFor(() => expect(result.current.data).toBeDefined());
  return result.current.data!;
};

describe('usePostLikes reads one store for round and review posts', () => {
  beforeEach(() => { state.tables = []; state.profileIds = []; });

  it('a round post lists a business liker as the business', async () => {
    state.post = { whs_score_id: 'score-1', source_review_id: null };
    state.reactions = [{ user_id: M, actor_type: 'business', actor_id: BIZ }];
    const data = await run();
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ actorType: 'business', actorId: BIZ, displayName: 'Links Pro Shop', avatarUrl: 'logo.png' });
    expect(state.tables).not.toContain('post_likes');
  });

  it('a review post lists the same member personally and as a business as two entries', async () => {
    state.post = { whs_score_id: null, source_review_id: 'review-1' };
    state.reactions = [
      { user_id: M, actor_type: 'personal', actor_id: M },
      { user_id: M, actor_type: 'business', actor_id: BIZ },
    ];
    const data = await run();
    expect(data.map(l => `${l.actorType}:${l.displayName}`)).toEqual(['personal:Ben', 'business:Links Pro Shop']);
    expect(state.tables).not.toContain('post_likes');
  });

  it('no liker is resolved from user_id when an actor is present', async () => {
    state.post = { whs_score_id: 'score-1', source_review_id: null };
    state.reactions = [{ user_id: M, actor_type: 'business', actor_id: BIZ }];
    await run();
    expect(state.profileIds).not.toContain(M);
    expect(state.tables).not.toContain('user_profiles');
  });
});
