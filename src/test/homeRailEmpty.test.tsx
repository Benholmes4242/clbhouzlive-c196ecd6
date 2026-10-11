import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const scope = { current: { primaryClubId: null as string | null, primaryClubName: null as string | null } };

vi.mock('@/features/explore-magazine/useViewerScoreScope', () => ({
  useViewerScoreScope: () => ({ scope: { ...scope.current, county: null, country: null }, isFetched: true }),
}));
// Both shelves confirmed to return null on empty (StandingShelf no rows; WeeklyClubShelf no club / no rounds).
vi.mock('@/features/explore-magazine/WeeklyClubShelf', () => ({ WeeklyClubShelf: () => null }));
vi.mock('@/features/explore-magazine/ConnectStandingInvite', () => ({ ScoresStandingSlot: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));
vi.mock('@/features/explore-magazine/useFeaturedRound', () => ({ useFeaturedRound: () => ({ data: null }) }));
vi.mock('@/features/explore-magazine/useBatchRoundMedals', () => ({ useBatchRoundMedals: () => ({}) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: () => null }));
vi.mock('@/components/explore-tab-new/useScorecardOpener', () => ({ useScorecardOpener: () => ({ target: null }) }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ unavailable: true }) }));
vi.mock('@/features/stories/useStoryEngagement', () => ({ useStoryEngagement: () => ({ engagementFor: () => ({ commentCount: 0 }) }) }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('@tanstack/react-query', async (orig) => ({ ...(await orig<object>()), useQueryClient: () => ({}) }));
vi.mock('@/components/feed/FeedCard', () => ({ LINE: 'line' }));

import { HomeRail } from '@/components/feed/HomeRail';

/** The band carries the only margin, so a hidden band leaves no doubled gap. */
function expectCollapsed(container: HTMLElement) {
  const band = container.firstElementChild as HTMLElement | null;
  if (!band) return; // nothing mounted at all
  expect(band.className).toContain('empty:hidden');
  expect(band.childNodes.length).toBe(0);
}

describe('Home rail bands render nothing when empty', () => {
  beforeEach(() => { scope.current = { primaryClubId: null, primaryClubName: null }; });

  it('club week with no home club mounts nothing', () => {
    const { container } = render(<HomeRail kind="clubWeek" viewerId="u1" pos={1} />);
    expect(container.childNodes.length).toBe(0);
  });

  it('club week with a club but no rounds collapses its band', () => {
    scope.current = { primaryClubId: 'c1', primaryClubName: 'Club' };
    const { container } = render(<HomeRail kind="clubWeek" viewerId="u1" pos={1} />);
    expectCollapsed(container);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('standing with no rows collapses its band', () => {
    const { container } = render(<HomeRail kind="standing" viewerId="u1" pos={2} />);
    expectCollapsed(container);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('round of the week with no featured round mounts nothing', () => {
    const { container } = render(<HomeRail kind="featuredRound" viewerId="u1" pos={0} />);
    expect(container.childNodes.length).toBe(0);
  });
});
