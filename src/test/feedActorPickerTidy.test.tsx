import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ActiveActor } from '@/types/actor';
import type { FeedPost } from '@/components/media-system/types/media';

/*
 * BRIEF_FEED_ACTOR_PICKER_TIDY.
 *
 * The picker is rendered for real here (never a stand-in) so the single-actor
 * null and the 20px/12px geometry are measured on the shipped component.
 */
const actorState = vi.hoisted(() => ({
  actors: [] as Array<{ id: string; type: string; name: string; avatarUrl: string | null }>,
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/context/ActiveActorContext', () => ({
  useActiveActor: () => ({
    activeActor: actorState.actors[0] ?? null,
    availableActors: actorState.actors,
    setActiveActor: vi.fn(),
  }),
}));
vi.mock('@/store/clubhouseStore', () => ({
  useClubhouseStore: (sel: (s: unknown) => unknown) =>
    sel({ carouselPositions: new Map(), carouselPositionsByTab: {} }),
}));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: () => vi.fn() }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => [] }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) } }));
vi.mock('@/components/likes/LikedByRow', () => ({
  LikedByRow: () => <div data-testid="liked-by-row" />,
}));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => null }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => null }));
vi.mock('@/components/feed/ReviewPostCard', () => ({ ReviewPostCard: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => null }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/ExploreCard', () => ({ ExploreCard: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));

import { FeedActorPicker } from '@/components/feed/FeedActorPicker';
import { FeedCard } from '@/components/feed/FeedCard';

const ONE: ActiveActor[] = [
  { type: 'personal', id: 'u1', name: 'Ben', avatarUrl: null },
];
const TWO: ActiveActor[] = [
  { type: 'personal', id: 'u1', name: 'Ben', avatarUrl: null },
  { type: 'business', id: 'b1', name: 'Sunningdale', avatarUrl: null },
];

/** The squircle box inside the picker: the avatar's own pixel width. */
const avatarBox = (root: HTMLElement, px: number) =>
  Array.from(root.querySelectorAll('div')).filter((d) => (d as HTMLElement).style.width === `${px}px`);

const POST: FeedPost = {
  id: 'p1',
  userId: 'u1',
  actorType: 'personal',
  actorId: 'u1',
  username: 'ben',
  displayName: 'Ben',
  avatarUrl: '',
  isVerified: false,
  creatorRelation: 'none',
  caption: '',
  mediaItems: [],
  createdAt: '2026-10-20T00:00:00Z',
  likeCount: 3,
  commentCount: 2,
  shareCount: 0,
  review: null,
  isReview: false,
  isLikedByMe: false,
  isFollowedByMe: false,
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <FeedCard
        post={POST}
        liked={false}
        likeCount={POST.likeCount}
        commentCount={POST.commentCount}
        onLike={() => {}}
        onComment={() => {}}
        onShare={() => {}}
        onOpenMedia={() => {}}
        onProfile={() => {}}
      />
    </QueryClientProvider>,
  );

describe('feed actor picker tidy (BRIEF_FEED_ACTOR_PICKER_TIDY)', () => {
  beforeEach(() => {
    actorState.actors = [];
  });

  it('renders nothing for a member with a single actor', () => {
    actorState.actors = ONE;
    const { container } = render(<FeedActorPicker />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a 20px avatar and a 12px chevron for two actors, and tapping opens the sheet', () => {
    actorState.actors = TWO;
    const { container } = render(<FeedActorPicker />);

    const trigger = screen.getByRole('button', { name: 'Acting as Ben — tap to switch' });
    expect(avatarBox(trigger, 20)).toHaveLength(1);
    expect(avatarBox(trigger, 24)).toHaveLength(0);

    const chevron = trigger.querySelector('svg');
    expect(chevron).not.toBeNull();
    expect(chevron!.getAttribute('width')).toBe('12');
    expect(chevron!.getAttribute('height')).toBe('12');

    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(trigger);

    const sheet = screen.getByRole('dialog');
    expect(screen.getByText('POST AS')).toBeInTheDocument();
    // Both actors are offered at the sheet's own 36px avatar size.
    expect(screen.getByText('Sunningdale')).toBeInTheDocument();
    expect(avatarBox(sheet, 36)).toHaveLength(2);
    expect(container).toBeTruthy();
  });

  it('keeps like, comment and share at the right edge with no avatar on the left for a single-actor member', () => {
    actorState.actors = ONE;
    renderCard();

    const share = screen.getByRole('button', { name: 'Send' });
    const row = share.parentElement as HTMLElement;

    // Nothing but the auto-margin spacer stands ahead of the action group.
    const first = row.children[0] as HTMLElement;
    expect(first.tagName).toBe('DIV');
    expect(first.style.marginLeft).toBe('auto');
    expect(avatarBox(row, 20)).toHaveLength(0);
    expect(avatarBox(row, 24)).toHaveLength(0);

    const buttons = Array.from(row.children).slice(1) as HTMLElement[];
    expect(buttons).toHaveLength(3);
    for (const el of buttons) expect(el.tagName).toBe('BUTTON');
    expect(buttons[2]).toBe(share);
  });
});
