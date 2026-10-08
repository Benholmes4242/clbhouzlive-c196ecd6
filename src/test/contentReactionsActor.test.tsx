import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useContentReactions } from '@/components/explore-tab-new/courseled/hooks/useContentReactions';

const { from, actor } = vi.hoisted(() => ({
  from: vi.fn(),
  actor: { current: null as null | { type: string; id: string } },
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'human' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({
  useActiveActor: () => ({ availableActors: [], activeActor: actor.current }),
}));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/lib/engagementCache', () => ({ patchEngagement: vi.fn(), seedViewerInLikers: vi.fn(() => () => {}) }));

type R = { target_type: string; target_id: string; user_id: string; actor_type: string; actor_id: string };

function setup(rows: R[]) {
  const inserts: unknown[] = [];
  const deletes: [string, unknown][][] = [];
  from.mockImplementation((table: string) => ({
    select: () => ({ in: async () => ({ data: table === 'content_reactions' ? rows : [], error: null }) }),
    insert: async (v: unknown) => { inserts.push(v); return { error: null }; },
    delete: () => {
      const filters: [string, unknown][] = [];
      deletes.push(filters);
      const chain = {
        eq: (c: string, v: unknown) => { filters.push([c, v]); return chain; },
        then: (res: (x: { error: null }) => void) => res({ error: null }),
      };
      return chain;
    },
  }));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, inserts, deletes, wrapper };
}

const target = [{ type: 'round' as const, id: 'score-1' }];

describe('content reactions carry the active actor', () => {
  beforeEach(() => { from.mockReset(); actor.current = null; });

  it('a personal member writes actor_type personal with actor_id = their user id', async () => {
    actor.current = { type: 'personal', id: 'human' };
    const { inserts, wrapper } = setup([]);
    const v = renderHook(() => useContentReactions(target), { wrapper });
    await waitFor(() => expect(v.result.current.isSettled).toBe(true));
    act(() => v.result.current.toggle('round', 'score-1'));
    await waitFor(() => expect(inserts).toHaveLength(1));
    expect(inserts[0]).toEqual({ user_id: 'human', actor_type: 'personal', actor_id: 'human', target_type: 'round', target_id: 'score-1' });
  });

  it('a member acting as a business writes the business id, user_id still the human', async () => {
    actor.current = { type: 'business', id: 'biz-1' };
    const { inserts, wrapper } = setup([]);
    const v = renderHook(() => useContentReactions(target), { wrapper });
    await waitFor(() => expect(v.result.current.isSettled).toBe(true));
    act(() => v.result.current.toggle('round', 'score-1'));
    await waitFor(() => expect(inserts).toHaveLength(1));
    expect(inserts[0]).toEqual({ user_id: 'human', actor_type: 'business', actor_id: 'biz-1', target_type: 'round', target_id: 'score-1' });
  });

  it('an unlike as a business removes only the business row', async () => {
    actor.current = { type: 'business', id: 'biz-1' };
    const { deletes, qc, wrapper } = setup([
      { target_type: 'round', target_id: 'score-1', user_id: 'human', actor_type: 'personal', actor_id: 'human' },
      { target_type: 'round', target_id: 'score-1', user_id: 'human', actor_type: 'business', actor_id: 'biz-1' },
    ]);
    const v = renderHook(() => useContentReactions(target), { wrapper });
    await waitFor(() => expect(v.result.current.stateFor('round', 'score-1')).toEqual({ count: 2, mine: true }));
    act(() => v.result.current.toggle('round', 'score-1'));
    await waitFor(() => expect(deletes).toHaveLength(1));
    expect(deletes[0]).toEqual([
      ['target_type', 'round'], ['target_id', 'score-1'], ['actor_type', 'business'], ['actor_id', 'biz-1'],
    ]);
    expect(deletes[0].some(([c]) => c === 'user_id')).toBe(false);
    // Optimistic patch drops only the business row; the personal row stays.
    const cached = qc.getQueryData<{ rows: R[] }>(['content-reactions', 'score-1', 'business', 'biz-1']);
    expect(cached?.rows.map((r) => r.actor_type)).toEqual(['personal']);
  });

  it('the same id set under two actors does not share one cache entry', async () => {
    const rows: R[] = [{ target_type: 'round', target_id: 'score-1', user_id: 'human', actor_type: 'personal', actor_id: 'human' }];
    const { qc, wrapper } = setup(rows);
    actor.current = { type: 'personal', id: 'human' };
    const v = renderHook(() => useContentReactions(target), { wrapper });
    await waitFor(() => expect(v.result.current.stateFor('round', 'score-1').mine).toBe(true));
    actor.current = { type: 'business', id: 'biz-1' };
    v.rerender();
    await waitFor(() => expect(v.result.current.isSettled).toBe(true));
    await waitFor(() => expect(qc.getQueryData(['content-reactions', 'score-1', 'business', 'biz-1'])).toBeTruthy());
    expect(v.result.current.stateFor('round', 'score-1').mine).toBe(false);
    expect(qc.getQueryData(['content-reactions', 'score-1', 'personal', 'human'])).toBeTruthy();
  });
});
