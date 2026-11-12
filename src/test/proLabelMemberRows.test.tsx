import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/pro-verification/useProMembers', () => ({ useProMembers: (ids: Array<string | null | undefined>) => ({ members: new Map(ids.filter(id => id === 'pro').map(id => [id, { user_id: id, pro_kind: 'teaching_pro', pro_tour: null, pro_tour_code: null, pro_club: null, pro_player_id: null }])), isLoading: false }) }));
vi.mock('@/hooks/useSingleReviewContext', () => ({ useSingleReviewContext: () => ({ data: null }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
import { RaterReviewRow } from '@/components/courses/course-detail/reviews/SingleReview';
import { FeedCommentPreview } from '@/components/feed/FeedCommentPreview';
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
    const { container } = render(<FeedCommentPreview preview={preview} commentCount={1} onOpenComments={vi.fn()} />);
    expect(container.querySelector('.pro-label')).toBeNull();
  });
});