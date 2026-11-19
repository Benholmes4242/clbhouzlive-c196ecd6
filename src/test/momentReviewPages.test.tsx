import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CourseMoment } from '@/hooks/useUserCourseMoments';

const h = vi.hoisted(() => ({ toggle: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useUserCourseMoments', () => ({ useUserCourseMoments: () => ({ data: moments, isLoading: false }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'author' } }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { username: 'author', display_name: 'Author' } }) }));
vi.mock('@/features/stories/useStoryEngagement', () => ({ useStoryEngagement: () => ({ engagementFor: () => ({ likeCount: 6, commentCount: 2, viewerLiked: false }) }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ toggle: h.toggle, viewerId: 'author', unavailable: false }) }));
import CourseMoments from '@/components/courses/phase5/CourseMoments';
import YourMomentsSection, { useMomentPosts } from '@/components/courses/course-detail/you/YourMomentsSection';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useViewerEngagement } from '@/components/fullscreen-feed/useViewerEngagement';

const moment = (id: string, reviewId: string, createdAt: string): CourseMoment => ({
  id, reviewId, createdAt, type: 'review_media', mediaType: 'image', mediaUrl: `/${id}.jpg`,
  reviewInput: { reviewId, userId: 'author', courseId: 'course', rating: 9, text: 'Review',
    breakdown: { design: 9, conditions: 8, clubhouse: 7, facilities: 6 } },
});
const moments = [moment('m-new', 'review-a', '2026-11-19'), moment('m-other', 'review-b', '2026-11-18'), moment('m-old', 'review-a', '2026-11-17')];
afterEach(() => { cleanup(); vi.clearAllMocks(); useFullscreenFeedStore.setState({ isOpen: false, posts: [], restoreStack: [] }); });
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient()}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;

function assertOpenAndReaction() {
  const state = useFullscreenFeedStore.getState();
  expect(state.posts.map(p => p.id)).toEqual(['review-a', 'review-b']);
  expect(state.mediaId).toBe('m-old');
  expect(state.activeIndex).toBe(0);
  expect(state.posts[0].mediaItems.map(m => m.id)).toEqual(['m-new', 'm-old']);
  expect(state.posts[0].engagementTarget).toEqual({ type: 'review', id: 'review-a' });
  expect(state.posts[0].review?.breakdown?.facilities).toBe(6);
  const postLike = vi.fn();
  const { result } = renderHook(() => useViewerEngagement({ posts: state.posts, handleLike: postLike,
    getActiveLikeState: () => ({ isLiked: false, count: 0 }), getCommentCount: () => 0, handleShare: vi.fn() }), { wrapper });
  expect(result.current.getViewerLikeState(state.posts[0]).count).toBe(6);
  expect(result.current.getViewerCommentCount(state.posts[0])).toBe(2);
  expect(result.current.commentTargetFor(state.posts[0])).toEqual({ type: 'review', id: 'review-a' });
  act(() => result.current.handleViewerLike(state.posts[0]));
  expect(h.toggle).toHaveBeenCalledWith('review', 'review-a', expect.any(Function));
  expect(postLike).not.toHaveBeenCalled();
}
describe('moments review pages', () => {
  it('CourseMoments opens grouped reviews at the tapped media and likes the review', () => {
    const view = render(<CourseMoments courseId="course" courseName="Course" />, { wrapper });
    const image = view.container.querySelector('img[src="/m-old.jpg"]');
    if (!image) throw new Error('Missing moment image');
    fireEvent.click(image);
    assertOpenAndReaction();
  });
  it('YourMomentsSection opens grouped reviews at the tapped media and likes the review', () => {
    const view = render(<YourMomentsSection courseId="course" courseName="Course" />, { wrapper });
    const image = view.container.querySelector('img[src="/m-old.jpg"]');
    if (!image) throw new Error('Missing moment image');
    fireEvent.click(image);
    assertOpenAndReaction();
  });
  it('CourseYouTab shares the moments opener with review targets and tapped media', () => {
    const { result } = renderHook(() => useMomentPosts('course', 'Course'), { wrapper });
    act(() => result.current.openMoment(2));
    assertOpenAndReaction();
    const source = readFileSync('src/components/courses/course-detail/CourseYouTab.tsx', 'utf8');
    expect(source).toContain('const { moments, openMoment } = useMomentPosts(courseId, courseName)');
    expect(source).toContain('openMoment(index);');
  });
});