import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/pro-verification/useProMembers', () => ({ useProMembers: (ids: Array<string | null | undefined>) => ({ members: new Map(ids.filter(id => id === 'pro').map(id => [id, { user_id: id, pro_kind: 'teaching_pro', pro_tour: null, pro_tour_code: null, pro_club: null, pro_player_id: null }])), isLoading: false }) }));
vi.mock('@/hooks/useSingleReviewContext', () => ({ useSingleReviewContext: () => ({ data: null }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
vi.mock('@/hooks/top100/useTop100Race', () => ({ TOP100_METRIC: { 'gb-i': 'gbi', global: 'global', europe: 'europe', usa: 'usa' }, useCareerBoard: () => ({ data: [{ user_id: 'pro', display_name: 'Grant Neal', value: 12, pos: 1, total_members: 1, is_viewer: true, is_tie: false, photo_url: null, home_club: null, field_avg: null, last_course_name: null }], isFetched: true, isError: false, isPlaceholderData: false, status: 'success' }) }));
vi.mock('@/hooks/gam/useTop100ListProgress', () => ({ useTop100ListProgress: () => ({ data: [], isPending: false }) }));
vi.mock('@/components/ui/BottomSheet', () => ({ BottomSheet: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div> }));
vi.mock('@/components/top100/sheets/Top100ListProgressSheet', () => ({ Top100ListProgressSheet: () => null }));
import { RaterReviewRow } from '@/components/courses/course-detail/reviews/SingleReview';
import { FeedCommentPreview } from '@/components/feed/FeedCommentPreview';
import { ReviewPostCard } from '@/components/feed/ReviewPostCard';
import { Top100Leaderboard } from '@/components/courses/top100/Top100Leaderboard';
import type { FeedPost } from '@/components/media-system/types/media';
import type { CourseReview } from '@/hooks/useCourseReviews';
import type { FeedCommentPreview as Preview } from '@/hooks/feed/useFeedCommentPreview';
const review = (id: string): CourseReview => ({ id: 'review', course_id: 'course', user_id: id, rating: 9, design_score: null, condition_score: null, clubhouse_score: null, facilities_score: null, review: '', review_date: '2026-11-12', helpful_count: 0, unhelpful_count: 0, is_mock: false, user_profiles: { id, display_name: 'Grant Neal', username: 'grant', profile_photo_url: null }, media: [] });
afterEach(cleanup);
describe('PRO member-name identity rules', () => {
  it('verified pro rater places the small label after the name', () => {
    const { container } = render(<MemoryRouter><RaterReviewRow review={review('pro')} context={null} onMediaClick={vi.fn()} /></MemoryRouter>);
    const name = container.querySelector('.pro-inline-name');
    expect(name?.firstElementChild?.className).toBe('pro-inline-text');
    expect(name?.lastElementChild?.className).toBe('pro-label');
    expect(name?.lastElementChild?.getAttribute('data-size')).toBe('small');
  });
  it('ordinary rater has no pro label', () => {
    const { container } = render(<MemoryRouter><RaterReviewRow review={review('ordinary')} context={null} onMediaClick={vi.fn()} /></MemoryRouter>);
    expect(container.querySelector('.pro-inline-name')).not.toBeNull();
    expect(container.querySelector('.pro-label')).toBeNull();
  });
  it('business comment with a verified uploader never receives PRO', () => {
    const preview: Preview = { post_id: 'post', comment_id: 'comment', content: 'Comment', created_at: '2026-11-12', actor_type: 'business', actor_id: 'pro', display_name: 'Business', avatar_url: null, verified: true, thread_count: 1 };
    const { container } = render(<MemoryRouter><FeedCommentPreview preview={preview} commentCount={1} onOpenComments={vi.fn()} /></MemoryRouter>);
    expect(container.querySelector('.pro-label')).toBeNull();
  });
  it('business-authored review post with a verified uploader never receives PRO', () => {
    const post: FeedPost = { id: 'post', userId: 'pro', actorType: 'business', actorId: 'business', username: '', displayName: 'Business', avatarUrl: '', isVerified: true, creatorRelation: 'none', caption: '', createdAt: '2026-11-12', mediaItems: [], likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: true, isLikedByMe: false, isFollowedByMe: false };
    const { container } = render(<MemoryRouter><ReviewPostCard post={post} articleRef={null} onProfile={vi.fn()} onReadReview={vi.fn()} onPrefetch={vi.fn()} footer={null} /></MemoryRouter>);
    expect(container.querySelector('.pro-inline-name')).not.toBeNull();
    expect(container.querySelector('.pro-label')).toBeNull();
  });
  it('verified viewer You row receives PRO in the Top 100 sheet', () => {
    const { container } = render(<MemoryRouter><Top100Leaderboard viewerId="pro" list="gb-i" listSize={100} /></MemoryRouter>);
    const card = container.querySelector('.t100b-lb-card');
    if (!card) throw new Error('Expected the leaderboard card');
    fireEvent.click(card);
    const name = container.querySelector('.t100b-lb-rn .pro-inline-name');
    expect(name?.querySelector('.pro-inline-text')?.textContent).toBe('You');
    expect(name?.querySelector('.pro-label')?.getAttribute('data-size')).toBe('small');
  });
});