import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { likerStandingFor, familiarityDetailMap } from '@/features/comments-v2/lib/standing';

const st = vi.hoisted(() => ({ likers: [] as any[], rpcCalls: [] as any[], legendCalls: 0, famRows: [] as any[], legendRows: [] as any[] }));

vi.mock('@/hooks/usePostLikers', () => ({ usePostLikers: () => ({ likers: st.likers, isLoading: false }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/components/ui/BottomSheet', () => ({ BottomSheet: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
vi.mock('@/integrations/supabase/client', () => {
  const q: any = {
    select: () => q, eq: () => q, lte: () => q, in: () => q,
    then: (res: any) => { st.legendCalls += 1; return res({ data: st.legendRows, error: null }); },
  };
  return { supabase: {
    from: () => q,
    rpc: async (fn: string, args: any) => { st.rpcCalls.push({ fn, args }); return { data: st.famRows, error: null }; },
  } };
});

import { LikesSheet } from '@/components/likes/LikesSheet';

const L = (id: string, o: Partial<any> = {}) => ({ userId: id, actorId: id, actorType: 'personal', displayName: id, username: id, avatarUrl: null, handicapIndex: 5.2, isViewer: false, isFollowing: false, businessType: null, ...o });

const renderSheet = (subject: any = null) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}><MemoryRouter>
      <LikesSheet open onClose={() => {}} postId="p1" count={st.likers.length} subject={subject} />
    </MemoryRouter></QueryClientProvider>,
  );
};

beforeEach(() => { st.rpcCalls = []; st.legendCalls = 0; st.famRows = []; st.legendRows = []; });

describe('LikesSheet H.1 three tiers', () => {
  it('renders the viewer first with no eyebrow, then followed, then everyone else', () => {
    st.likers = [L('me', { isViewer: true }), L('f1', { isFollowing: true }), L('o1')];
    const { container } = renderSheet();
    const groups = [...container.querySelectorAll('[data-likes-group]')].map((g) => g.getAttribute('data-likes-group'));
    expect(groups).toEqual(['viewer', 'following', 'others']);
    expect(container.querySelector('[data-likes-group="viewer"]')!.textContent).not.toMatch(/People you follow|Everyone else/);
  });

  it('with no viewer like there is no viewer group at all', () => {
    st.likers = [L('f1', { isFollowing: true }), L('o1')];
    const { container } = renderSheet();
    expect(container.querySelector('[data-likes-group="viewer"]')).toBeNull();
  });
});

describe('LikesSheet H.4 standing segment', () => {
  it('one familiarity call and one legends read for the whole sheet; no history shows handicap alone', async () => {
    st.likers = [L('a'), L('b'), L('c')];
    st.famRows = [{ user_id: 'a', rounds: 4, best_gross: 78 }];
    st.legendRows = [{ user_id: 'b', rank: 1, value: 69 }];
    const { container } = renderSheet({ authorName: 'Ben', courseId: 'c1', courseName: 'Royal X', kind: 'round', gross: 71, toPar: -1, rating: null });
    await waitFor(() => expect(container.querySelectorAll('[data-liker-standing]').length).toBe(2));
    expect(st.rpcCalls).toHaveLength(1);
    expect(st.rpcCalls[0].args).toEqual({ p_user_ids: ['a', 'b', 'c'], p_course_id: 'c1' });
    expect(st.legendCalls).toBe(1);
    expect(screen.getByText('Best here 78')).toBeTruthy();
    expect(screen.getByText('Course record \u00B7 69')).toBeTruthy();
    expect(container.querySelector('[data-likes-context]')!.textContent).toContain('\u22121');
  });

  it('no course context: no reads, no context line', () => {
    st.likers = [L('a')];
    const { container } = renderSheet(null);
    expect(st.rpcCalls).toHaveLength(0);
    expect(container.querySelector('[data-likes-context]')).toBeNull();
  });
});

describe('likerStandingFor tiers', () => {
  it('record beats best, best beats played, nothing is null', () => {
    expect(likerStandingFor({ rank: 1, value: 68 }, { rounds: 3, bestGross: 70 })).toEqual({ kind: 'record', value: 68 });
    expect(likerStandingFor({ rank: 4, value: 72 }, { rounds: 3, bestGross: 75 })).toEqual({ kind: 'best', value: 75 });
    expect(likerStandingFor(undefined, { rounds: 1, bestGross: null })).toEqual({ kind: 'played', n: 1 });
    expect(likerStandingFor(undefined, undefined)).toBeNull();
  });
  it('a failed familiarity read yields an empty map', () => {
    expect(familiarityDetailMap([{ data: null, error: new Error('x') }]).size).toBe(0);
  });
});
