/** CANONICAL_FULLSCREEN_VIEWER part 2 — the course Media gallery wears the canonical viewer layout. */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function mount(filter: GalleryFilter, start: string, extra: FeedPost[] = [], confirmedSource = false) {
  const shots = galleryShots([post('h'), post('c'), post('u'), ...extra], [holeTag('h', 4)], [placeTag('c', 'clubhouse')]);
  const data = { shots, holes: [hole(4)], scored: true };
  const options = { courseId: 'course', courseName: 'The London Club (Heritage)', filter, startShotId: start };
  const list = filteredGallery(shots, filter);
  useFullscreenFeedStore.setState({ isOpen: true, courseGallery: options, galleryData: data, posts: galleryPost(list, options), activePagerIdx: Math.max(0, list.findIndex(s => s.id === start)), syntheticPosts: true, readOnly: true });
  const shot = list.find(s => s.id === start);
  const sourcePostId = shot?.item.memberShot?.sourcePostId ?? (!shot?.post.id.startsWith('shots:') ? shot?.post.id : null);
  const engagement = confirmedSource && sourcePostId ? { likeState: { isLiked: false, count: 0 }, commentCount: 0, onLike: vi.fn(), onComment: vi.fn(), onShare: vi.fn() } : undefined;
  return render(<CourseGalleryChrome onClose={vi.fn()} engagement={engagement} />);
}
afterEach(() => { cleanup(); f.viewer = 'me'; f.admin = false; useFullscreenFeedStore.setState({ isOpen: false, courseGallery: null, galleryData: null, restoreStack: [] }); });

describe('canonical course gallery chrome', () => {
  it('source-post gallery actions are two flex pills plus three 44px squares and four 8px gaps', () => {
    const view = mount('all', 'u', [], true);
    const pills = [...view.container.querySelectorAll('[data-gallery-pills] [data-pill]')];
    expect(pills.map(p => p.getAttribute('data-pill'))).toEqual(['like', 'comment', 'tag', 'share', 'grid']);
    expect(pills.filter(p => !p.classList.contains('is-square'))).toHaveLength(2);
    expect(pills.filter(p => p.classList.contains('is-square'))).toHaveLength(3);
    const css = readFileSync('src/components/fullscreen-feed/course-gallery.css', 'utf8');
    expect(css).toMatch(/course-gallery-pills\s*\{[^}]*gap:8px/);
    expect(css).toMatch(/course-gallery-pill\s*\{[^}]*flex:1 1 0; min-width:0/);
    expect(css).toMatch(/course-gallery-pill\.is-square\s*\{[^}]*flex:0 0 44px; width:44px/);
    expect(320 - 32 - 3 * 44 - 4 * 8).toBe(124);
  });
  it('(a) the top bar renders the canonical back circle and no share or grid circles', () => {
    const view = mount('all', 'h');
    const top = view.container.querySelector('.course-gallery-top') as HTMLElement;
    expect(top.querySelector('[data-fullscreen-back-circle]')).not.toBeNull();
    expect(top.querySelectorAll('button')).toHaveLength(1);
    expect(top.querySelector('[aria-label="Share"], [aria-label="Grid view"]')).toBeNull();
  });
  it('(b) the Tag pill follows galleryAction: tag primary, retag glass, null absent', () => {
    let view = mount('all', 'u');
    const tag = view.container.querySelector('[data-pill="tag"]') as HTMLElement;
    expect(tag.getAttribute('aria-label')).toBe('Tag this shot'); expect(tag.className).toContain('is-primary');
    cleanup(); view = mount('holes', 'h');
    const retag = view.container.querySelector('[data-pill="tag"]') as HTMLElement;
    expect(retag.getAttribute('aria-label')).toBe('Fix tag'); expect(retag.className).not.toContain('is-primary');
    cleanup(); f.viewer = undefined; view = mount('holes', 'h');
    expect(view.container.querySelector('[data-pill="tag"]')).toBeNull();
  });
  it('(c) the grid pill toggles grid and is pressed while on; Share in grid shares the filter link without a shot id', async () => {
    const shareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: shareFn });
    const view = mount('holes', 'h');
    const pill = () => view.container.querySelector('[data-pill="grid"]') as HTMLElement;
    expect(pill().getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(pill());
    expect(view.container.querySelector('[data-gallery-grid]')).not.toBeNull();
    expect(pill().getAttribute('aria-pressed')).toBe('true');
    expect(view.container.querySelector('[data-pill="tag"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(shareFn).toHaveBeenCalledTimes(1));
    const url = shareFn.mock.calls[0][0].url as string;
    expect(url).toContain('/courses/course?tab=media&filter=holes');
    expect(url).not.toContain('shot=');
    fireEvent.click(pill());
    expect(view.container.querySelector('[data-gallery-grid]')).toBeNull();
    Reflect.deleteProperty(navigator, 'share');
  });
  it('(d) the stat row replaces the hole facts card, the place facts card and the untagged gap', () => {
    let view = mount('holes', 'h');
    expect(view.container.querySelector('[data-gallery-facts="hole"]')).toBeNull();
    const values = [...view.container.querySelectorAll('[data-fullscreen-stats] b')] as HTMLElement[];
    expect(values.map(v => v.textContent)).toEqual(['4th', '4', '303', '7', '+0.4']);
    for (const v of values) expect(v.style.color).toBe('');
    expect(view.container.querySelector('hr')).toBeNull();
    cleanup(); view = mount('clubhouse', 'c');
    expect(view.container.querySelector('[data-gallery-facts="place"]')).toBeNull();
    expect([...view.container.querySelectorAll('[data-fullscreen-stats] b')].map(v => v.textContent)).toEqual(['The clubhouse', '1']);
    cleanup(); view = mount('all', 'u');
    expect(view.container.querySelector('[data-gallery-facts]')).toBeNull();
    expect(view.container.querySelector('[data-fullscreen-stats]')).not.toBeNull();
  });
  it('(e) a video shot has one mute, in the pill row, and none in the scrubber row', () => {
    const view = mount('all', 'vid', [post('vid', 'video')]);
    expect(view.container.querySelector('[data-fullscreen-video-row]')).toBeNull();
    const row = view.container.querySelector('[data-fullscreen-pill-row]') as HTMLElement;
    expect(screen.getAllByRole('button', { name: /^(Mute|Unmute)$/ })).toHaveLength(1);
    expect(row.contains(screen.getByRole('button', { name: /^(Mute|Unmute)$/ }))).toBe(true);
    expect(view.container.querySelector('.course-gallery-circle')).toBeNull();
  });
  it('the gallery chrome uses no amber', () => {
    const css = readFileSync('src/components/fullscreen-feed/course-gallery.css', 'utf8');
    const tsx = readFileSync('src/components/fullscreen-feed/CourseGalleryChrome.tsx', 'utf8');
    for (const src of [css, tsx]) { expect(src).not.toMatch(/amber/i); expect(src).not.toMatch(/F7931E/i); }
  });
  it('a ?filter= landing opens on that filter; an unknown value falls back to the default', () => {
    let view = mount(linkedGalleryFilter('holes') ?? 'all', 'h');
    expect(screen.getByRole('button', { name: 'Holes 1' }).getAttribute('aria-pressed')).toBe('true');
    cleanup();
    expect(linkedGalleryFilter('nonsense')).toBeNull();
    view = mount(linkedGalleryFilter('nonsense') ?? 'all', 'h');
    expect(screen.getByRole('button', { name: 'All 3' }).getAttribute('aria-pressed')).toBe('true');
    expect(view.container.querySelector('[data-gallery-filter]')?.getAttribute('data-gallery-filter')).toBe('all');
  });
});
