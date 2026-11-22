/** COURSE MEDIA VIEWER addendum — place and untagged shots use the shared stat row. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import type { FeedPost } from '@/components/media-system/types/media';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import type { PlaceMedia } from '@/components/course-media-tab/hooks/useCoursePlaceMedia';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { filteredGallery, galleryPost, galleryShots, linkedGalleryFilter, type GalleryFilter } from '@/lib/courseMedia/courseGallery';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

const f = vi.hoisted(() => ({ viewer: 'me' as string | undefined, admin: false }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: f.viewer ? { id: f.viewer } : null }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => f.admin }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/course-media-tab/CourseGalleryTagger', () => ({ CourseGalleryTagger: () => <div data-test-tagger /> }));
import { CourseGalleryChrome } from '@/components/fullscreen-feed/CourseGalleryChrome';

const post = (id: string, type: 'image' | 'video' = 'image'): FeedPost => ({ id: `post-${id}`, userId: 'me', actorId: 'me', actorType: 'personal', displayName: 'Thomas Holmes', avatarUrl: '', username: '', isVerified: false, creatorRelation: 'none', caption: '', createdAt: '2026-01-01T00:00:00Z', mediaItems: [{ id, type, imageUrl: type === 'video' ? `/${id}.m3u8` : `/${id}.jpg`, streamId: type === 'video' ? 'a'.repeat(32) : undefined, width: 1000, height: 1000 }], likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false });
const holeTag = (id: string, hole_no: number): HolePhoto => ({ id, hole_no, media_url: `/${id}.jpg`, media_type: 'image', user_id: 'me', course_id: 'course', added_at: '2026-02-01T00:00:00Z', status: 'approved' }) as HolePhoto;
const placeTag = (id: string, place: string): PlaceMedia => ({ id, place, media_url: `/${id}.jpg`, media_type: 'image', user_id: 'me', course_id: 'course', added_at: '2026-10-28T00:00:00Z', status: 'approved' }) as PlaceMedia;
const hole = (n: number): CourseHole => ({ hole_no: n, par: 4, yards: 303, stroke_index: 7, avg_to_par: .4, avg_gross: 4.4, rounds: 2, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 1, bogey: 1, double: 0 } });

function mount(filter: GalleryFilter, start: string, extra: FeedPost[] = [], confirmedSource = false, extraPlaces: PlaceMedia[] = []) {
  const shots = galleryShots([post('h'), post('c'), post('u'), ...extra], [holeTag('h', 4)], [placeTag('c', 'clubhouse'), ...extraPlaces]);
  const data = { shots, holes: [hole(4)], scored: true };
  const options = { courseId: 'course', courseName: 'The London Club (Heritage)', filter, startShotId: start };
  const list = filteredGallery(shots, filter);
  useFullscreenFeedStore.setState({ isOpen: true, courseGallery: options, galleryData: data, posts: galleryPost(list, options), activePagerIdx: Math.max(0, list.findIndex(s => s.id === start)), syntheticPosts: true, readOnly: true });
  const shot = list.find(s => s.id === start);
  const sourcePostId = shot?.item.memberShot?.sourcePostId ?? (!shot?.post.id.startsWith('shots:') ? shot?.post.id : null);
  const engagement = confirmedSource && sourcePostId ? { likeState: { isLiked: false, count: 0 }, commentCount: 0, onLike: vi.fn(), onComment: vi.fn(), onShare: vi.fn() } : undefined;
  return render(<CourseGalleryChrome onClose={vi.fn()} engagement={engagement} courseFigures={{ par: 72, yards: 6512, members: 8.4 }} />);
}
afterEach(() => { cleanup(); f.viewer = 'me'; f.admin = false; useFullscreenFeedStore.setState({ isOpen: false, courseGallery: null, galleryData: null, restoreStack: [] }); });

import { placeCells, shortPlaceAge } from '@/lib/fullscreen/statRow';
const cells = (c: HTMLElement) => [...c.querySelectorAll('[data-fullscreen-stats] [data-stat]')].map(d => [d.getAttribute('data-stat'), d.querySelector('b')?.textContent]);

describe('course Media viewer addendum', () => {
  it('no [data-gallery-facts] tile renders for hole, place or untagged shots', () => {
    for (const [filter, id] of [['holes', 'h'], ['clubhouse', 'c'], ['all', 'u']] as const) {
      const view = mount(filter, id);
      expect(view.container.querySelector('[data-gallery-facts]')).toBeNull();
      expect(view.container.querySelector('[data-fullscreen-stats]')).not.toBeNull();
      cleanup();
    }
  });
  it('a clubhouse shot shows PLACE and MEMBER SHOTS only', () => {
    const view = mount('clubhouse', 'c');
    expect(cells(view.container)).toEqual([['place', 'The clubhouse'], ['memberShots', '1']]);
  });
  it('a conditions shot adds LATEST with the short age', () => {
    const recent = new Date(Date.now() - 2 * 86400000 - 3600000).toISOString();
    const view = mount('conditions', 'k', [post('k')], false, [{ ...placeTag('k', 'conditions'), added_at: recent }]);
    expect(cells(view.container).map(c => c[0])).toEqual(['place', 'memberShots', 'latest']);
    expect(cells(view.container)[2][1]).toMatch(/^\d+d$/);
  });
  it('placeCells gives LATEST on conditions only', () => {
    const age = { key: 'days', count: 2 };
    expect(placeCells({ place: 'conditions', title: 'Course conditions', count: 5, age }).map(c => c.key)).toEqual(['place', 'memberShots', 'latest']);
    for (const place of ['clubhouse', 'practice', 'food_drink', 'pro_shop', 'views', 'golfers', 'stay', 'other'])
      expect(placeCells({ place, title: 'x', count: 1, age }).map(c => c.key)).toEqual(['place', 'memberShots']);
    expect(shortPlaceAge({ key: 'weeks', count: 3 })).toBe('3w');
    expect(shortPlaceAge({ key: 'yesterday' })).toBe('1d');
  });
  it('an untagged shot shows PAR, YARDS and MEMBERS', () => {
    const view = mount('all', 'u');
    expect(cells(view.container)).toEqual([['par', '72'], ['yards', '6,512'], ['members', '8.4']]);
  });
  it('swiping hole → place → hole keeps one stat row of the same class (constant height)', () => {
    const seq = ['h', 'c', 'h'];
    const view = mount('all', seq[0]);
    const list = filteredGallery(useFullscreenFeedStore.getState().galleryData!.shots, 'all');
    for (const id of seq) {
      act(() => useFullscreenFeedStore.setState({ activePagerIdx: list.findIndex(s => s.id === id) }));
      const rows = view.container.querySelectorAll('[data-gallery-stack] .fs-stats');
      expect(rows).toHaveLength(1);
      expect(view.container.querySelector('[data-gallery-facts]')).toBeNull();
    }
  });
});
