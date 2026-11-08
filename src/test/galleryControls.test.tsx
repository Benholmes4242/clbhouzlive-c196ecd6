/** GALLERY_CONTROLS — Share in the top row, Tag + the shared mute in the
 * bottom row, squircle credit avatar and the posted date. */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FeedPost } from '@/components/media-system/types/media';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { filteredGallery, galleryPost, galleryShots } from '@/lib/courseMedia/courseGallery';
import { postedDateLabel } from '@/lib/courseMedia/addedMonth';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useSessionAudio } from '@/audio/sessionAudioStore';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => false }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/course-media-tab/CourseGalleryTagger', () => ({ CourseGalleryTagger: () => <div data-test-tagger /> }));
import { CourseGalleryChrome } from '@/components/fullscreen-feed/CourseGalleryChrome';

const post = (id: string, type: 'image' | 'video' = 'image', createdAt = '2026-01-14T10:00:00Z'): FeedPost => ({ id: `post-${id}`, userId: 'me', actorId: 'me', actorType: 'personal', displayName: 'Benjamin Holmes', avatarUrl: `/${id}.png`, username: '', isVerified: false, creatorRelation: 'none', caption: '', createdAt, mediaItems: [{ id, type, imageUrl: type === 'video' ? `/${id}.m3u8` : `/${id}.jpg`, thumbnailUrl: type === 'video' ? `/${id}.jpg` : undefined, streamId: type === 'video' ? 'a'.repeat(32) : undefined, width: 1000, height: 1000 }], likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false });
const holeTag = (id: string, hole_no: number, added_at = '2026-03-01T00:00:00Z'): HolePhoto => ({ id, hole_no, media_url: type_url(id), media_type: type_of(id), user_id: 'me', course_id: 'course', added_at, status: 'approved' }) as HolePhoto;
const type_of = (id: string) => (id.startsWith('v') ? 'video' : 'image') as 'video' | 'image';
const type_url = (id: string) => (id.startsWith('v') ? `/${id}.m3u8` : `/${id}.jpg`);

function mount(ids: { id: string; type?: 'image' | 'video' }[], startShotId: string, tags: HolePhoto[] = []) {
  const shots = galleryShots(ids.map(row => post(row.id, row.type ?? 'image')), tags, []);
  const options = { courseId: 'course', courseName: 'Sundridge Park (East)', filter: 'all' as const, startShotId };
  const data = { shots, holes: [], scored: false };
  const list = filteredGallery(shots, 'all');
  useFullscreenFeedStore.setState({ isOpen: true, courseGallery: options, galleryData: data, posts: galleryPost(list, options), activePagerIdx: Math.max(0, list.findIndex(shot => shot.id === startShotId)), syntheticPosts: true, readOnly: true });
  return render(<CourseGalleryChrome onClose={vi.fn()} />);
}

beforeEach(() => { useSessionAudio.setState({ isMuted: true }); });
afterEach(() => { cleanup(); useFullscreenFeedStore.setState({ isOpen: false, courseGallery: null, galleryData: null, restoreStack: [] }); useSessionAudio.setState({ isMuted: true }); });

describe('course gallery controls', () => {
  it('the top row renders close, heading, Share and grid in that order', () => {
    const view = mount([{ id: 'a' }], 'a');
    const top = view.container.querySelector('.course-gallery-top') as HTMLElement;
    const children = [...top.children];
    expect(children[0]).toBe(screen.getByRole('button', { name: 'Close' }));
    expect(children[1].className).toContain('course-gallery-heading');
    expect(children[2]).toBe(screen.getByRole('button', { name: 'Share' }));
    expect(children[3]).toBe(screen.getByRole('button', { name: 'Grid view' }));
  });
  it('grid view hides Share and keeps close and grid', () => {
    mount([{ id: 'a' }], 'a');
    fireEvent.click(screen.getByRole('button', { name: 'Grid view' }));
    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Close' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Full screen' })).not.toBeNull();
  });
  it('a video shot renders Tag then mute in the bottom row', () => {
    const view = mount([{ id: 'v1', type: 'video' }], 'v1');
    const actions = [...(view.container.querySelector('.course-gallery-actions') as HTMLElement).children];
    expect(actions[0]).toBe(screen.getByRole('button', { name: 'Tag this shot' }));
    expect(actions[1]).toBe(screen.getByRole('button', { name: 'Unmute' }));
  });
  it('a photo shot renders Tag with no mute and no blank slot', () => {
    const view = mount([{ id: 'a' }], 'a');
    const actions = view.container.querySelector('.course-gallery-actions') as HTMLElement;
    expect(actions.children).toHaveLength(1);
    expect(actions.children[0]).toBe(screen.getByRole('button', { name: 'Tag this shot' }));
    expect(screen.queryByRole('button', { name: 'Unmute' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mute' })).toBeNull();
  });
  it('tapping mute toggles the session audio and a photo shot never changes it', () => {
    const view = mount([{ id: 'v1', type: 'video' }, { id: 'a' }], 'v1');
    expect(useSessionAudio.getState().isMuted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
    expect(useSessionAudio.getState().isMuted).toBe(false);
    expect(screen.getByRole('button', { name: 'Mute' })).not.toBeNull();
    cleanup();
    mount([{ id: 'a' }], 'a');
    expect(useSessionAudio.getState().isMuted).toBe(false);
    view.unmount();
  });
  it('the credit avatar is the 32px squircle with the hairline ring', () => {
    const view = mount([{ id: 'a' }], 'a');
    const credit = view.container.querySelector('.course-gallery-credit') as HTMLElement;
    expect(credit.querySelector('.course-gallery-avatar')).toBeNull();
    const squircle = credit.querySelector('[style*="border-radius: 34%"]') as HTMLElement;
    expect(squircle).not.toBeNull();
    expect(squircle.style.width).toBe('32px');
    const ring = credit.querySelector('[style*="rgba(255,255,255,0.22)"]') as HTMLElement;
    expect(ring).not.toBeNull();
    expect(ring.style.border).toContain('1px');
  });
  it('the date line reads the post createdAt as a full date, not the later tag month', () => {
    const view = mount([{ id: 'a' }], 'a', [holeTag('a', 1, '2026-03-01T00:00:00Z')]);
    const who = view.container.querySelector('.course-gallery-credit-who') as HTMLElement;
    expect(who.querySelector('b')?.textContent).toBe('Benjamin Holmes');
    expect(who.querySelector('small')?.textContent).toBe('14 Jan 2026');
    expect(who.textContent).not.toContain('Mar 2026');
    expect(who.textContent).not.toContain('·');
  });
  it('postedDateLabel uses a day without a leading zero and rejects bad input', () => {
    expect(postedDateLabel('2026-01-04T23:30:00Z')).toBe('4 Jan 2026');
    expect(postedDateLabel('2026-12-25T00:00:00Z')).toBe('25 Dec 2026');
    expect(postedDateLabel(null)).toBeNull();
    expect(postedDateLabel('not-a-date')).toBeNull();
  });
  it('ImmersiveFullscreenChrome mutes through the shared hook, not its own copy', () => {
    const source = readFileSync('src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx', 'utf8');
    expect(source).toContain("import { useFullscreenMuteControl } from './useFullscreenMuteControl';");
    expect(source).toContain('useFullscreenMuteControl()');
    expect(source).not.toContain('const handleMuteTap = useCallback');
  });
});
