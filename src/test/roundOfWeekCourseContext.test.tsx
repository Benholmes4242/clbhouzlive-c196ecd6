import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const rpc = vi.fn();
const from = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a), from: (...a: unknown[]) => from(...a) },
}));
const seen: Array<{ rank_here: number | null; rounds_here: number | null } | null> = [];
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({
  FeaturedRoundCard: (p: { courseContext?: { rank_here: number | null; rounds_here: number | null } | null }) => {
    seen.push(p.courseContext ?? null);
    return null;
  },
}));
vi.mock('@/features/explore-magazine/useViewerScoreScope', () => ({
  useViewerScoreScope: () => ({ scope: { primaryClubId: null, primaryClubName: null, county: null, country: null }, isFetched: true }),
}));
vi.mock('@/features/explore-magazine/WeeklyClubShelf', () => ({ WeeklyClubShelf: () => null }));
vi.mock('@/features/explore-magazine/ConnectStandingInvite', () => ({ ScoresStandingSlot: () => null }));
vi.mock('@/features/explore-magazine/useFeaturedRound', () => ({
  useFeaturedRound: () => ({ data: { whs_score_id: 'h1', user_id: 'u2', course_name: 'C' } }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: () => null }));
vi.mock('@/components/explore-tab-new/useScorecardOpener', () => ({ useScorecardOpener: () => ({ target: null }) }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ unavailable: true }) }));
vi.mock('@/features/stories/useStoryEngagement', () => ({ useStoryEngagement: () => ({ engagementFor: () => ({ commentCount: 0 }) }) }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('@/components/feed/FeedCard', () => ({ LINE: 'line' }));

import { HomeRail } from '@/components/feed/HomeRail';

beforeEach(() => {
  rpc.mockReset(); from.mockReset(); seen.length = 0;
  from.mockReturnValue({ select: () => ({ in: async () => ({ data: [], error: null }) }) });
  rpc.mockImplementation(async (_fn: string, args: { p_ids: string[] }) => ({
    data: args.p_ids.map((id) => ({ whs_score_id: id, course_id: 'c', your_avg_to_par: 3, avg_to_par_others: 4, rounds_here: 6, rank_here: 2, best_here: 73 })),
    error: null,
  }));
});

describe('U.1 Home Round of the week rides the window batch for course context', () => {
  it('one batch read (array of one), no single-id read, and the figure reaches the card', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={qc}><HomeRail kind="featuredRound" viewerId="u1" pos={0} /></QueryClientProvider>);
    await waitFor(() => expect(seen.at(-1)?.rank_here).toBe(2));
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('get_round_course_context_batch', { p_ids: ['h1'] });
    expect(rpc.mock.calls.some((c) => c[0] === 'get_round_course_context')).toBe(false);
    expect(from).toHaveBeenCalledTimes(1); // the awards read
  });
});
