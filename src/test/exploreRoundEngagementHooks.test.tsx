import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useContentReactions } from '@/components/explore-tab-new/courseled/hooks/useContentReactions';
import { useRoundPostComments } from '@/components/explore-tab-new/courseled/hooks/useRoundPostComments';

const { from, toastError } = vi.hoisted(() => ({
  from: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from,
    channel: vi.fn(() => ({ on() { return this; }, subscribe() { return this; } })),
    removeChannel: vi.fn(),
  },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/lib/toast', () => ({ toast: { error: toastError } }));
vi.mock('@/lib/engagementCache', () => ({ patchEngagement: vi.fn() }));

function wrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

describe('Explore round engagement batching and optimistic state', () => {
  beforeEach(() => {
    from.mockReset();
    toastError.mockReset();
  });

  it('reads every round in one posts call and one reactions call', async () => {
    const calls = { posts: 0, reactions: 0 };
    from.mockImplementation((table: string) => ({
      select: () => ({
        in: async () => {
          if (table === 'posts') calls.posts += 1;
          if (table === 'content_reactions') calls.reactions += 1;
          return { data: [], error: null };
        },
      }),
    }));
    const qc = client();
    const ids = ['score-1', 'score-2', 'score-3'];
    const view = renderHook(() => {
      useRoundPostComments(ids);
      return useContentReactions(ids.map((id) => ({ type: 'round' as const, id })));
    }, { wrapper: wrapper(qc) });
    await waitFor(() => expect(view.result.current.unavailable).toBe(false));
    await waitFor(() => expect(calls).toEqual({ posts: 1, reactions: 1 }));
  });

  it('updates immediately and rolls back with the existing toast when the write fails', async () => {
    let finishInsert: ((value: { error: { code: string } }) => void) | null = null;
    from.mockImplementation((table: string) => {
      if (table !== 'content_reactions') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({ in: async () => ({ data: [], error: null }) }),
        insert: () => new Promise<{ error: { code: string } }>((resolve) => { finishInsert = resolve; }),
      };
    });
    const qc = client();
    const view = renderHook(
      () => useContentReactions([{ type: 'round', id: 'score-1' }]),
      { wrapper: wrapper(qc) },
    );
    await waitFor(() => expect(qc.getQueryData(['content-reactions', 'score-1'])).toBeTruthy());
    act(() => view.result.current.toggle('round', 'score-1'));
    await waitFor(() => expect(view.result.current.stateFor('round', 'score-1').mine).toBe(true));
    act(() => finishInsert?.({ error: { code: 'XX000' } }));
    await waitFor(() => expect(view.result.current.stateFor('round', 'score-1').mine).toBe(false));
    expect(toastError).toHaveBeenCalledWith('Could not save that reaction. Please try again.');
  });
});