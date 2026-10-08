import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const MEMBER = 'member-1';
const BIZ = 'biz-1';
let actor: { type: 'personal' | 'business'; id: string } = { type: 'personal', id: MEMBER };
const calls: any[] = [];

vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: MEMBER } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: actor, availableActors: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: async (_fn: string, args: any) => {
      calls.push(args);
      // The member's only reaction on round-1 was made AS their business.
      const liked = args.p_actor_type === 'business' && args.p_actor_id === BIZ;
      return { data: [{ target_id: 'round-1', like_count: 1, comment_count: 0, viewer_liked: liked }], error: null };
    },
  },
}));

import { useStoryEngagement } from '@/features/stories/useStoryEngagement';

const IDS = ['round-1'];

describe('useStoryEngagement follows the active actor', () => {
  beforeEach(() => { calls.length = 0; actor = { type: 'personal', id: MEMBER }; });

  it('sends the active actor', async () => {
    actor = { type: 'business', id: BIZ };
    const qc = new QueryClient();
    const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    renderHook(() => useStoryEngagement('round', IDS), { wrapper });
    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toMatchObject({ p_actor_type: 'business', p_actor_id: BIZ });
  });

  it('two actors do not share a cache entry; personal is false, business true', async () => {
    const qc = new QueryClient();
    const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result, rerender } = renderHook(() => useStoryEngagement('round', IDS), { wrapper });
    await waitFor(() => expect(result.current.isSettled).toBe(true));
    expect(result.current.engagementFor('round-1').viewerLiked).toBe(false);

    actor = { type: 'business', id: BIZ };
    rerender();
    await waitFor(() => expect(result.current.engagementFor('round-1').viewerLiked).toBe(true));
    expect(calls.length).toBe(2);
    expect(qc.getQueryCache().findAll({ queryKey: ['story-engagement', 'round'] }).length).toBe(2);
  });
});
