import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/post-v2/hooks/useCoursePhoto', () => ({ useCoursePhoto: () => null }));
vi.mock('@/components/courses/course-detail/about/AboutSection', () => ({ VERDICT_KICKER: {} }));
import { effectiveHoleGuide, golfPostPatch, composerDestinations } from '@/features/post-v2/lib/composerGolfRules';
import { ComposerHoleGuide } from '@/features/post-v2/components/golf/ComposerGolf';
import { holeShotsToFeedPosts, placeShotsToFeedPosts, latestHolesToFeedPosts, type MemberShotRow } from '@/lib/courseMedia/memberShotPosts';
import { MemoryRouter } from 'react-router-dom';
import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: () => ({ status: null, isLoading: false }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: null, isLoading: false }) }));
vi.mock('@/audio/useLaneAudioBlocked', () => ({ useLaneAudioBlocked: () => false }));
vi.mock('@/video/useVideoProgressWriter', () => ({ useVideoProgressWriter: () => {} }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: () => null }));

afterEach(cleanup);

const course = { id: 'c1', name: 'Machrihanish Golf Club', country: 'Scotland' };

describe('PF2 effective hole guide rule', () => {
  it('personal + anyone + media is on when the member switch is on', () => {
    expect(effectiveHoleGuide(true, 1, true, 'anyone')).toBe(true);
    expect(effectiveHoleGuide(undefined, 2, true, 'anyone')).toBe(true);
  });
  it('followers and private are off while the member switch stays on', () => {
    expect(effectiveHoleGuide(true, 1, true, 'followers')).toBe(false);
    expect(effectiveHoleGuide(true, 1, true, 'private')).toBe(false);
    expect(effectiveHoleGuide(true, 1, true, 'anyone')).toBe(true);
  });
  it('a business actor and no media are always off', () => {
    expect(effectiveHoleGuide(true, 1, false, 'anyone')).toBe(false);
    expect(effectiveHoleGuide(true, 0, true, 'anyone')).toBe(false);
  });
  it('the member switch off stays off', () => {
    expect(effectiveHoleGuide(false, 1, true, 'anyone')).toBe(false);
  });
  it('golfPostPatch no longer writes either legacy guide boolean', () => {
    expect(golfPostPatch({ course, holeNo: 15, addToGuide: false })).toEqual({ tagged_course_ids: ['c1'] });
    expect(golfPostPatch({ course, holeNo: 15, addToGuide: true })).toEqual({ tagged_course_ids: ['c1'] });
  });
  it('footer sub-line carries the guide only when the effective value is on', () => {
    expect(composerDestinations(15, true, null)).toBe("Shares to your Clubhouse feed · the 15th's hole guide");
    expect(composerDestinations(15, false, null)).toBe('Shares to your Clubhouse feed');
  });
});

describe('PF2 ComposerHoleGuide copy and audience states', () => {
  it('mock A: Everyone copy without the approval promise', () => {
    render(<ComposerHoleGuide course={course} hole={15} on audienceOk onToggle={() => {}} onRowTap={() => {}} />);
    expect(screen.getByText('Golfers planning a round see it on the Machrihanish course page, credited to you.')).toBeTruthy();
    expect(screen.queryByText(/once it's approved/)).toBeNull();
  });
  it('mock B: non-Everyone copy, locked-off switch, row tap opens visibility', () => {
    const onRowTap = vi.fn();
    const onToggle = vi.fn();
    const { container } = render(<ComposerHoleGuide course={course} hole={15} on audienceOk={false} onToggle={onToggle} onRowTap={onRowTap} />);
    const copy = container.querySelector('.composer-golf-att p');
    expect(copy?.textContent).toBe('Hole guides are public. Change Who can see this to Everyone.');
    const em = copy?.querySelector('em');
    expect(em?.textContent).toBe('Who can see this');
    const box = container.querySelector('.composer-golf-box');
    expect(box?.getAttribute('data-on')).toBeNull();
    const toggle = screen.getByRole('switch', { name: 'Add to hole guide' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveProperty('disabled', true);
    fireEvent.click(toggle);
    expect(onToggle).not.toHaveBeenCalled();
    // The locked switch is part of the row: its tap bubbles to the row and opens the sheet.
    expect(onRowTap).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector('.composer-golf-att-tap')!);
    expect(onRowTap).toHaveBeenCalledTimes(2);
  });
});

const shotRow = (id: string, source_post_id: string | null, added_at: string): MemberShotRow => ({
  id, course_id: 'c1', media_type: 'image', media_url: `/${id}.jpg`,
  member_name: 'Benjamin Holmes', member_avatar_url: '/ben.jpg', added_at, hole_no: 15, par: 3, yards: 166, source_post_id,
});

describe('PF2 holeShotItems source post', () => {
  it('carries source_post_id into memberShot.sourcePostId and keeps server order', () => {
    const rows = [shotRow('newest', 'post-1', '2026-11-06T10:00:00Z'), shotRow('oldest', null, '2026-11-01T10:00:00Z')];
    const posts = holeShotsToFeedPosts(rows, 'Machrihanish', 'c1', 15);
    const items = posts[0].mediaItems;
    expect(items.map(i => i.id)).toEqual(['newest', 'oldest']);
    expect(items[0].memberShot?.sourcePostId).toBe('post-1');
    expect(items[1].memberShot?.sourcePostId).toBeNull();
  });
  it('latest holes carries it too', () => {
    const posts = latestHolesToFeedPosts([shotRow('a', 'post-9', '2026-11-06T10:00:00Z')]);
    expect(posts[0].mediaItems[0].memberShot?.sourcePostId).toBe('post-9');
  });
  it('place shots carry their source post', () => {
    const posts = placeShotsToFeedPosts([shotRow('a', 'post-9', '2026-11-06T10:00:00Z')], 'Machrihanish', 'c1', 'clubhouse', 'The clubhouse');
    expect(posts[0].mediaItems[0].memberShot?.sourcePostId).toBe('post-9');
  });
});

const shotItem = (sourcePostId: string | null, type: 'image' | 'video' = 'image'): MediaItem => ({
  id: 'm1', type, imageUrl: '/m1.jpg', width: 800, height: 1000,
  memberShot: { kicker: 'The 15th', title: 'Machrihanish', credit: 'Benjamin Holmes · November 2026', avatarUrl: null, memberName: 'Benjamin Holmes', sourcePostId },
});

const shotPost = (item: MediaItem): FeedPost => ({
  id: 'shots:hole:c1:15', userId: '', actorId: '', actorType: 'personal', username: '', displayName: 'Machrihanish',
  avatarUrl: '', isVerified: false, creatorRelation: 'none', caption: '', createdAt: '2026-11-06T10:00:00Z',
  mediaItems: [item], likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false,
  isLikedByMe: false, isFollowedByMe: false, courseId: 'c1', courseName: 'Machrihanish',
});
const chrome = (item: MediaItem) => <MemoryRouter><ImmersiveFullscreenChrome
  posts={[shotPost(item)]} activeIndex={0} syntheticPosts readOnly
  onClose={vi.fn()} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()}
  getLikeState={() => ({ isLiked: false, count: 0 })} getCommentCount={() => 0} getFollowState={() => false}
  onFollow={vi.fn()} onViewProfile={vi.fn()} onReviewTap={vi.fn()} isOwnPost={false} /></MemoryRouter>;

describe('PF2 View post line in the canonical viewer', () => {
  it('renders only with a sourcePostId, on its own line in the Full review style', () => {
    useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null });
    useClubhouseStore.setState({ isTournamentCardActive: false });
    const { container, rerender } = render(chrome(shotItem('post-1')));
    expect(screen.getByRole('button', { name: 'View post' })).toBeTruthy();
    expect(container.querySelector('[data-fullscreen-view-post]')).not.toBeNull();
    rerender(chrome(shotItem(null)));
    expect(screen.queryByRole('button', { name: 'View post' })).toBeNull();
  });
  it('the tap opens the post and never reaches the slide', () => {
    useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null });
    const onSlideTap = vi.fn();
    render(<div onClick={onSlideTap}>{chrome(shotItem('post-1'))}</div>);
    fireEvent.click(screen.getByRole('button', { name: 'View post' }));
    expect(onSlideTap).not.toHaveBeenCalled();
  });
  it('video shots keep View post in the stack with the canonical video row below it', () => {
    useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null });
    const { container } = render(chrome(shotItem('post-1', 'video')));
    expect(container.querySelector('[data-fullscreen-stack] [data-fullscreen-view-post]')).not.toBeNull();
    expect(container.querySelector('[data-fullscreen-video-row]')).not.toBeNull();
  });
});
