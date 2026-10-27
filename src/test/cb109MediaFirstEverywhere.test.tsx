/** CB109: caller contracts and real FeedCard → ReviewPostCard shared slots. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/store/clubhouseStore', () => ({ useClubhouseStore: (sel: (s: unknown) => unknown) => sel({ carouselPositions: new Map(), carouselPositionsByTab: {} }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: () => vi.fn() }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => new Set(), useTeamBusinessIds: () => new Set() }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => <div data-actor-picker /> }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => <div data-liked-by /> }));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => null }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => <div data-comments /> }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/ExploreCard', () => ({ ExploreCard: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));

import { FeedCard } from '@/components/feed/FeedCard';
import { ReviewPostCard } from '@/components/feed/ReviewPostCard';
import { REVIEW_BODY_CLAMP } from '@/components/feed/reviewPostCard';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const POST = {
  id: 'p1', userId: 'u9', actorType: 'personal', actorId: 'u9', displayName: 'Reviewer', avatarUrl: '',
  createdAt: '2026-10-26T00:00:00Z', caption: 'Review words', isReview: true, mediaItems: [],
  review: { reviewId: 'r1', courseId: 'c1', courseName: 'Course', rating: 8.5, reviewText: 'Review words', breakdown: { design: 8, conditions: 9, clubhouse: 9, facilities: 8.5 } },
} as unknown as FeedPost;
const IMG = [{ id: 'm1', type: 'image', url: 'https://x.test/a.jpg', imageUrl: 'https://x.test/a.jpg', width: 1, height: 1 }] as unknown as FeedPost['mediaItems'];
const preview = { id: 'c1', content: 'Nice', recent: [{ id: 'c1', content: 'Nice' }] } as never;
function card(photo: boolean, over: Partial<React.ComponentProps<typeof FeedCard>> = {}) {
  return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter>
    <FeedCard post={{ ...POST, mediaItems: photo ? IMG : [] }} liked={false} likeCount={3} commentCount={2}
      onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onOpenMedia={vi.fn()} onProfile={vi.fn()}
      layout="mediaFirst" currentUserId="viewer" commentPreviewEnabled commentPreview={preview} {...over} />
  </MemoryRouter></QueryClientProvider>);
}
const markers = ['[data-review-who]', '[data-review-media]', '[data-actor-picker]', '[data-liked-by]', '[data-review-subject]', '[data-review-score-container]', '[data-review-body]', '[data-review-cta]', '[data-comments]', '[data-feed-section="add-comment"]'];
function order(container: HTMLElement) {
  const present = markers.flatMap((selector) => {
    const el = container.querySelector(selector);
    return el ? [{ selector, el }] : [];
  });
  return present.sort((a, b) => a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1).map(({ selector }) => selector);
}
afterEach(cleanup);

describe('CB109 media-first everywhere', () => {
  it('CardFeed passes mediaFirst while FeedCard keeps its standard default', () => {
    expect(source('src/components/feed/CardFeed.tsx')).toMatch(/<FeedCard\s+layout="mediaFirst"/);
    expect(source('src/components/feed/FeedCard.tsx')).toContain("layout = 'standard'");
  });
  it.each(['personal', 'business'])('PostsTabContent defaults to mediaFirst for a %s profile', (actorType) => {
    const tab = source('src/components/posts-tab/PostsTabContent.tsx');
    expect(tab).toContain("layout = 'mediaFirst'");
    expect(tab).toMatch(/<LightCardFeed[\s\S]*?layout=\{layout\}/);
    const path = actorType === 'personal' ? 'src/pages/ProfilePageV2.tsx' : 'src/pages/BusinessProfilePage.tsx';
    expect(source(path)).toMatch(new RegExp(`<PostsTabContent\\s+actorType="${actorType}"`));
    expect(source('src/components/posts-tab/LightCardFeed.tsx')).toMatch(/<FeedCard[\s\S]*?layout=\{layout\}/);
  });
  it('out-of-scope grids use the separate tile FeedCard and RecentRoundsCard owns its round card', () => {
    for (const path of ['src/components/course-media-tab/CourseMediaCanonGrid.tsx', 'src/features/watch-v2/components/HubMixedGrid.tsx']) {
      expect(source(path)).toContain("from '@/components/feed-cards/FeedCard'");
      expect(source(path)).not.toContain('layout="mediaFirst"');
    }
    const rounds = source('src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx');
    expect(rounds).toContain('const FeedCard: React.FC<FeedCardProps>');
    expect(rounds).not.toContain('layout="mediaFirst"');
  });
  it('photo review orders reviewer, media, actions, likes, review block, comments and Add-a-comment', () => {
    const { container } = card(true);
    expect(order(container)).toEqual(markers);
    expect(container.querySelector('[data-review-body]')?.textContent).toBe('Reviewer Review words');
    expect((container.querySelector('[data-review-body-lead]') as HTMLElement).style.fontWeight).toBe('600');
    expect((container.querySelector('[data-feed-footer]') as HTMLElement).style.borderTop).toBe('');
    expect((container.querySelector('[data-review-media]') as HTMLElement).style.marginTop).toBe('10px');
    expect(REVIEW_BODY_CLAMP.WebkitLineClamp).toBe(2);
  });
  it('no-photo review keeps words first without a name lead, then actions, likes and comments', () => {
    const { container } = card(false);
    expect(order(container)).toEqual([markers[0], markers[4], markers[5], markers[6], markers[7], markers[2], markers[3], markers[8], markers[9]]);
    expect(container.querySelector('[data-review-body-lead]')).toBeNull();
    expect((container.querySelector('[data-feed-footer]') as HTMLElement).style.borderTop).toBe('');
  });
  it('double-tap on review media likes through the existing media path', async () => {
    const onLike = vi.fn();
    const { container } = card(true, { onLike });
    const button = container.querySelector('[data-review-media] img')?.closest('button');
    if (!button) throw new Error('review media button missing');
    fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(onLike).toHaveBeenCalledTimes(1));
  });
  it('review Add-a-comment uses add_comment_row and is absent when signed out', () => {
    const onComment = vi.fn();
    const { container, unmount } = card(true, { onComment });
    const button = container.querySelector('[data-feed-section="add-comment"]');
    if (!button) throw new Error('comment row missing');
    fireEvent.click(button);
    expect(onComment).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }), null, 'add_comment_row');
    unmount();
    expect(card(true, { currentUserId: undefined }).container.querySelector('[data-feed-section="add-comment"]')).toBeNull();
  });
  it('ReviewPostCard standard order and media spacing remain unchanged', () => {
    const { container } = render(<MemoryRouter><ReviewPostCard post={POST} articleRef={() => {}} onProfile={vi.fn()} onReadReview={vi.fn()} onPrefetch={vi.fn()}
      media={<img alt="review" />} footer={<div data-actor-picker />} /></MemoryRouter>);
    expect(order(container)).toEqual([markers[0], markers[4], markers[5], markers[6], markers[7], markers[1], markers[2]]);
    expect((container.querySelector('[data-review-media]') as HTMLElement).style.marginTop).toBe('');
    expect(container.querySelector('[data-review-body-lead]')).toBeNull();
  });
});