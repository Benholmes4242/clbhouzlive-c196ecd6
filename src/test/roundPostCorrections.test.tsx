import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const rpc = vi.fn();
const from = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...a: unknown[]) => rpc(...a),
    from: (...a: unknown[]) => from(...a),
  },
}));

import { useBatchRoundMedals } from '@/features/explore-magazine/useBatchRoundMedals';
import { useBatchRoundCourseContext, COURSE_CONTEXT_BATCH_MAX } from '@/features/explore-magazine/useBatchRoundCourseContext';
import { RoundPostCard, type RoundPostCardProps } from '@/features/explore-magazine/RoundPostCard';
import { mapRowToFeedPost } from '@/components/media-system/utils/feedMapper';
import { extractUserData } from '@/lib/postHelpers';
import { RANK_CLAIM_CEILING, roundVerdict } from '@/features/explore-magazine/roundVerdict';
import type { FeedRpcRow } from '@/components/media-system/types/media';

const wrap = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

const ids = Array.from({ length: 12 }, (_, i) => `s${i}`);

function cardProps(id: string, over: Partial<RoundPostCardProps> = {}): RoundPostCardProps {
  return {
    hero: false, scoreId: id, courseName: 'Course', imageUrl: null, gross: 74, toPar: 2, par: 72, net: 70,
    courseHandicap: 4, stableford: null, playDate: '2026-10-06', shape: null, holesInOne: 0, cleanCard: false,
    who: { userId: 'u', name: 'Ann', photoUrl: null, isViewer: false }, club: null, onOpen: () => {}, ...over,
  };
}

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
  from.mockReturnValue({ select: () => ({ in: async () => ({ data: [
    { whs_score_id: 's0', tier: 'gold', award_kind: 'new_best', unit_kind: 'round_gross', unit_key: 0, value: 74, previous_value: 76, delta: -2, rank_here: 1, attempts_at_detection: 4 },
  ], error: null }) }) });
  rpc.mockImplementation(async (_fn: string, args: { p_ids: string[] }) => ({
    data: args.p_ids.map((id) => ({ whs_score_id: id, course_id: 'c', your_avg_to_par: 3, avg_to_par_others: 4, rounds_here: 8, rank_here: 2, best_here: 73 })),
    error: null,
  }));
});

describe('S.1 a twelve-card feed window reads awards and course context once, not per card', () => {
  it('one batched award read for the window; the cards issue no reads at all', async () => {
    const { result } = renderHook(() => ({ m: useBatchRoundMedals(ids), c: useBatchRoundCourseContext(ids) }), { wrapper: wrap() });
    await waitFor(() => expect(result.current.m.isSuccess && result.current.c.isSuccess).toBe(true));
    expect(from).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0][0]).toBe('get_round_course_context_batch');
    expect(result.current.m.medals?.get('s0')?.awards[0].award_kind).toBe('new_best');
    expect(result.current.c.contexts?.get('s11')?.rank_here).toBe(2);

    const W = wrap();
    const { container } = render(<W>{ids.map((id) => <RoundPostCard key={id} {...cardProps(id, {
      awards: result.current.m.medals?.get(id)?.awards ?? null, context: result.current.c.contexts?.get(id) ?? null,
    })} />)}</W>);
    // The cards add no reads: still one award read and one course-context read.
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('2nd');
  });
});

describe('S.2 a member with no display name reads "A member"', () => {
  const row = (over: Partial<FeedRpcRow>) => ({
    post_id: 'p', post_user_id: 'u', post_actor_type: 'personal', creator_username: 'c4v62shp4r',
    creator_display_name: null, media_id: null, post_tags: null, ...over,
  } as unknown as FeedRpcRow);
  it('on a round post', () => {
    const post = mapRowToFeedPost(row({ post_type: 'round' } as Partial<FeedRpcRow>));
    expect(post.displayName).toBe('A member');
    const { container } = render(<RoundPostCard {...cardProps('s1', { who: { userId: 'u', name: post.displayName, photoUrl: null, isViewer: false } })} />);
    expect(container.querySelector('[data-round-post-name]')!.textContent).toBe('A member');
  });
  it('on a photo post and on a profile-feed post', () => {
    expect(mapRowToFeedPost(row({ media_id: 'm', media_type: 'image' } as Partial<FeedRpcRow>)).displayName).toBe('A member');
    expect(extractUserData({ user: { id: 'u', username: 'c4v62shp4r', display_name: '  ' } }).name).toBe('A member');
  });
});

describe('S.5 the rank rule boundary', () => {
  const base = { vsHcp: 1, eagles: 0, holesInOne: 0, cleanCard: false, self: false };
  it('claims third and stays silent at fourth', () => {
    expect(RANK_CLAIM_CEILING).toBe(3);
    expect(roundVerdict({ ...base, context: { rank_here: 3, rounds_here: 10, best_here: 70 } })?.emphasis.key).toBe('rankHere_other');
    expect(roundVerdict({ ...base, context: { rank_here: 4, rounds_here: 10, best_here: 70 } })?.emphasis.key).toBe('hcpOver_other');
  });
});

describe('T.1 a window longer than the 60-id guard is never sent whole', () => {
  it('slices 130 ids into requests of at most 60', async () => {
    const many = Array.from({ length: 130 }, (_, i) => `id${String(i).padStart(3, '0')}`);
    const { result } = renderHook(() => useBatchRoundCourseContext(many), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(COURSE_CONTEXT_BATCH_MAX).toBe(60);
    const sizes = rpc.mock.calls.map((c) => (c[1] as { p_ids: string[] }).p_ids.length);
    expect(sizes.every((n) => n <= 60)).toBe(true);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(130);
    expect(result.current.contexts?.size).toBe(130);
  });
});
