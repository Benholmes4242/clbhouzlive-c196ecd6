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
});

describe('S.1 a twelve-card feed window reads awards and course context once, not per card', () => {
  it('one batched award read for the window; the cards issue no reads at all', async () => {
    const { result } = renderHook(() => useBatchRoundMedals(ids), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(from).toHaveBeenCalledTimes(1);
    expect(result.current.medals?.get('s0')?.awards[0].award_kind).toBe('new_best');

    const W = wrap();
    render(<W>{ids.map((id) => <RoundPostCard key={id} {...cardProps(id, { awards: result.current.medals?.get(id)?.awards ?? null })} />)}</W>);
    expect(rpc).not.toHaveBeenCalled(); // no get_round_awards, no get_round_course_context
    expect(from).toHaveBeenCalledTimes(1);
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
