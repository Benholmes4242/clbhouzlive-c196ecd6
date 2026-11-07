import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/post-v2/hooks/useCoursePhoto', () => ({ useCoursePhoto: () => null }));
vi.mock('@/components/courses/course-detail/about/AboutSection', () => ({ VERDICT_KICKER: {} }));
import { effectiveHoleGuide, golfPostPatch, composerDestinations } from '@/features/post-v2/lib/composerGolfRules';
import { ComposerHoleGuide } from '@/features/post-v2/components/golf/ComposerGolf';
import { holeShotsToFeedPosts, placeShotsToFeedPosts, latestHolesToFeedPosts, type MemberShotRow } from '@/lib/courseMedia/memberShotPosts';
import { MemberShotCredit } from '@/components/fullscreen-feed/MemberShotCredit';
import type { MediaItem } from '@/components/media-system/types/media';

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
  it('golfPostPatch writes the effective boolean false when a hole is set', () => {
    expect(golfPostPatch({ course, holeNo: 15, addToGuide: false })).toEqual({ tagged_course_ids: ['c1'], hole_no: 15, add_to_hole_guide: false });
    expect(golfPostPatch({ course, holeNo: 15, addToGuide: true })).toEqual({ tagged_course_ids: ['c1'], hole_no: 15, add_to_hole_guide: true });
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
    fireEvent.click(container.querySelector('.composer-golf-att-tap')!);
    expect(onRowTap).toHaveBeenCalledTimes(1);
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
  it('place shots never get one', () => {
    const posts = placeShotsToFeedPosts([shotRow('a', 'post-9', '2026-11-06T10:00:00Z')], 'Machrihanish', 'c1', 'clubhouse', 'The clubhouse');
    expect(posts[0].mediaItems[0].memberShot?.sourcePostId).toBeNull();
  });
});

const shotItem = (sourcePostId: string | null, type: 'image' | 'video' = 'image'): MediaItem => ({
  id: 'm1', type, imageUrl: '/m1.jpg', width: 800, height: 1000,
  memberShot: { kicker: 'The 15th', title: 'Machrihanish', credit: 'Benjamin Holmes · November 2026', avatarUrl: null, memberName: 'Benjamin Holmes', sourcePostId },
});

describe('PF2 View post pill', () => {
  it('renders only with a sourcePostId and lifts the caption only then', () => {
    const { container, rerender } = render(<MemberShotCredit syntheticPosts item={shotItem('post-1')} onViewPost={() => {}} />);
    expect(screen.getByRole('button', { name: 'View post' })).toBeTruthy();
    expect(container.querySelector('.member-shot-caption')?.className).toContain('member-shot-caption-lifted');
    rerender(<MemberShotCredit syntheticPosts item={shotItem(null)} onViewPost={() => {}} />);
    expect(screen.queryByRole('button', { name: 'View post' })).toBeNull();
    expect(container.querySelector('.member-shot-caption')?.className).not.toContain('member-shot-caption-lifted');
  });
  it('the tap reports the post and never reaches the slide', () => {
    const onViewPost = vi.fn();
    const onSlideTap = vi.fn();
    render(<div onClick={onSlideTap}><MemberShotCredit syntheticPosts item={shotItem('post-1')} onViewPost={onViewPost} /></div>);
    fireEvent.click(screen.getByRole('button', { name: 'View post' }));
    expect(onViewPost).toHaveBeenCalledWith('post-1');
    expect(onSlideTap).not.toHaveBeenCalled();
  });
  it('video shots use the video geometry classes', () => {
    const { container } = render(<MemberShotCredit syntheticPosts item={shotItem('post-1', 'video')} onViewPost={() => {}} />);
    expect(container.querySelector('.member-shot-caption')?.className).toContain('member-shot-caption-video');
    expect(container.querySelector('.member-shot-viewpost')?.className).toContain('member-shot-viewpost-video');
  });
});
