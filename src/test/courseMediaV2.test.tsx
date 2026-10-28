import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { ReadyShotCover, readyCoverShots } from '@/components/course-media-tab/ReadyShotCover';
import { approvedPlaceGroups, CoursePlaceTiles, placeAge } from '@/components/course-media-tab/CoursePlaceTiles';
import type { PlaceMedia } from '@/components/course-media-tab/hooks/useCoursePlaceMedia';
import { COURSE_PLACES } from '@/lib/courseMedia/places';
import { placeShotsToFeedPosts } from '@/lib/courseMedia/memberShotPosts';

const row = (id: string, place: string, status = 'approved', date = '2026-10-26T12:00:00Z') => ({ id, place, status, course_id: 'course', user_id: 'member', media_type: 'image', media_url: `/${id}.jpg`, added_at: date }) as PlaceMedia;
describe('Media place catalogue and readiness', () => {
  it('uses the approved shared nine-place order', () => {
    expect(COURSE_PLACES.map(p => p.id)).toEqual(['clubhouse', 'food_drink', 'practice', 'pro_shop', 'views', 'golfers', 'conditions', 'stay', 'other']);
  });
  it('groups only approved shots in catalogue order and sorts newest first', () => {
    const groups = approvedPlaceGroups([row('g', 'golfers'), row('v-old', 'views'), row('v-new', 'views', 'approved', '2026-10-27T12:00:00Z'), row('private', 'clubhouse', 'rejected')]);
    expect(groups.map(g => g.id)).toEqual(['views', 'golfers']);
    expect(groups[0].shots.map(s => s.id)).toEqual(['v-new', 'v-old']);
  });
  it('place tiles open exactly their sorted approved rows', () => {
    const open = vi.fn(); const view = render(<CoursePlaceTiles rows={[row('a', 'views'), row('b', 'golfers'), row('c', 'conditions')]} onOpen={open} />);
    const tiles = view.container.querySelectorAll('.media-v2-place-tile');
    expect(tiles).toHaveLength(3);
    fireEvent.click(tiles[0]); expect(open).toHaveBeenCalledWith('views', [row('a', 'views')], tiles[0]);
  });
  it('empty or private-only place groups render nothing', () => {
    const view = render(<CoursePlaceTiles rows={[row('a', 'views', 'rejected')]} onOpen={() => {}} />);
    expect(view.container.childElementCount).toBe(0);
  });
  it('conditions age uses local calendar day boundaries', () => {
    const now = new Date(2026, 9, 27, 12).getTime();
    expect(placeAge(new Date(2026, 9, 27, 1).toISOString(), now)).toEqual({ key: 'today' });
    expect(placeAge(new Date(2026, 9, 26, 23).toISOString(), now)).toEqual({ key: 'yesterday' });
    expect(placeAge(new Date(2026, 9, 25).toISOString(), now)).toEqual({ key: 'days', count: 2 });
    expect(placeAge(new Date(2026, 9, 13).toISOString(), now)).toEqual({ key: 'weeks', count: 2 });
    expect(placeAge(new Date(2026, 8, 27).toISOString(), now)).toEqual({ key: 'months', count: 1 });
  });
  it('processing videos are skipped while ready videos and images remain', () => {
    expect(readyCoverShots([row('a', 'views'), { ...row('b', 'views'), media_type: 'video', duration_seconds: null }, { ...row('c', 'views'), media_type: 'video', duration_seconds: 42 }]).map(s => s.id)).toEqual(['a', 'c']);
  });
  it('cover shimmers until load and retries the next ready image on error', () => {
    const view = render(<ReadyShotCover shots={[row('a', 'views'), row('b', 'views')]} />);
    expect(view.container.querySelector('.clb-shimmer-dark')).not.toBeNull();
    const first = view.container.querySelector('img'); if (!first) throw new Error('Missing cover');
    fireEvent.error(first);
    expect(first).toHaveAttribute('src', '/b.jpg');
    fireEvent.load(first);
    expect(view.container.querySelector('.clb-shimmer-dark')).toBeNull(); expect(first).toHaveClass('is-loaded');
  });
  it('exhausted covers and processing-only rows render the nonblank processing state', () => {
    const view = render(<ReadyShotCover shots={[row('a', 'views')]} />);
    const image = view.container.querySelector('img'); if (!image) throw new Error('Missing cover');
    fireEvent.error(image); expect(view.container.querySelector('.media-v2-processing')).not.toBeNull();
    view.rerender(<ReadyShotCover shots={[{ ...row('b', 'views'), media_type: 'video', duration_seconds: null }]} />);
    expect(view.container.querySelector('img')).toBeNull(); expect(view.container.querySelector('.media-v2-processing')).not.toBeNull();
  });
  it('place viewer is one ready-only newest-first run with each member credited', () => {
    const posts = placeShotsToFeedPosts([
      { ...row('a', 'views'), member_name: 'First', member_avatar_url: '/first.jpg' },
      { ...row('b', 'views', 'approved', '2026-10-27T12:00:00Z'), member_name: 'Second', member_avatar_url: '/second.jpg' },
      { ...row('c', 'views'), media_type: 'video', duration_seconds: null },
    ], 'Royal Portrush', 'course', 'views', 'Views');
    expect(posts).toHaveLength(1); expect(posts[0].id).toBe('shots:place:course:views');
    expect(posts[0].mediaItems.map(m => m.id)).toEqual(['b', 'a']);
    expect(posts[0].mediaItems.map(m => m.memberShot?.memberName)).toEqual(['Second', 'First']);
    expect(posts[0].mediaItems.map(m => m.memberShot?.avatarUrl)).toEqual(['/second.jpg', '/first.jpg']);
  });
});