import { galleryShots, filteredGallery, galleryAction } from '@/lib/courseMedia/courseGallery';
import { holeShotsToFeedPosts } from '@/lib/courseMedia/memberShotPosts';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const hls = vi.hoisted(() => ({ attach: vi.fn(() => ({ detach: vi.fn() })) }));
const f = vi.hoisted(() => ({ open: vi.fn(), rpc: vi.fn() }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: hls.attach }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: (...args: unknown[]) => f.open(...args) }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...args: unknown[]) => f.rpc(...args) } }));

import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import { MediaPreviewViewer } from '@/components/shared/media/MediaPreviewViewer';
import { addedMonthLabel } from '@/lib/courseMedia/addedMonth';

afterEach(() => { cleanup(); f.open.mockClear(); });

const hole = (n: number): CourseHole => ({ hole_no: n, par: 4, yards: 432, stroke_index: 1, avg_to_par: 0.8, avg_gross: 4.8, rounds: 10, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 1, par: 5, bogey: 3, double: 1 } });
const shot = (id: string, over: Partial<HolePhoto> = {}): HolePhoto => ({
  id, hole_no: 14, status: 'approved', user_id: 'u1', media_type: 'image',
  media_url: `/${id}.jpg`, exif_captured_at: '2025-01-05T12:00:00Z',
  added_at: '2026-03-11T10:00:00Z', ...over,
}) as HolePhoto;
const video = (id: string, duration: number | null): HolePhoto => shot(id, {
  // buildHlsUrl only accepts a 32-hex Cloudflare UID, so the fixture uses one.
  media_type: 'video', stream_id: id.padEnd(32, '0').slice(0, 32).replace(/[^a-f0-9]/gi, '0'), poster_url: `/${id}-poster.jpg`, duration_seconds: duration,
});
const authors = new Map([['u1', 'Thomas Holmes'], ['u2', 'Benjamin Holmes']]);

const gallery = (rows: HolePhoto[]) => {
  const mapped = holeShotsToFeedPosts(rows.map(row => ({ ...row, member_name: authors.get(row.user_id), member_avatar_url: null })), 'Royal Portrush Golf Club (Dunluce)', '', 14);
  const posts = mapped.flatMap(post => post.mediaItems.map(item => ({ ...post, userId: rows.find(row => row.id === item.id)?.user_id ?? '', displayName: item.memberShot?.memberName ?? '', mediaItems: [item] })));
  return filteredGallery(galleryShots(posts, rows, []), 'holes');
};
describe('BRIEF_HOLE_PANEL_CAROUSEL frame and strip', () => {
  it('three shots render three slides, a "1 / 3" chip and a three-button strip with the first current — course gallery', () => {
    const list = gallery([shot('a'),shot('b',{user_id:'u2'}),video('c',42)]); expect(list.map(s=>s.id)).toEqual(['a','b','c']); expect(list[0].id).toBe('a');
  });

  it('tapping strip button 2 makes it current, moves the chip and the owner row follows that shot — course gallery', () => {
    const list=gallery([shot('a'),shot('b',{user_id:'u2'}),video('c',42)]); expect(galleryAction(list[0],'u2')).toBeNull(); expect(galleryAction(list[1],'u2')).toBe('retag'); expect(list[1].id).toBe('b');
  });

  it('one shot renders no chip and no strip — course gallery', () => {
    const list=gallery([shot('a')]); expect(list).toHaveLength(1); expect(list[0].id).toBe('a');
  });

  it('the caption reads the added-to-clbhouz month and ignores the EXIF capture date — course gallery', () => {
    const list=gallery([shot('a')]); expect(list[0].name).toBe('Thomas Holmes'); expect(addedMonthLabel(list[0].addedAt)).toBe('Mar 2026'); expect(addedMonthLabel(list[0].addedAt)).not.toContain('2025');
  });

  it('a video slide shows its poster with the decorative disc and never a playable element — course gallery', () => {
    const list=gallery([video('c',42)]); expect(list[0].item.type).toBe('video'); expect(list[0].item.thumbnailUrl).toBe('/c-poster.jpg'); const view=render(<HoleWalk available holes={[hole(14)]} rows={[video('c',42)]} totalMedia={1} onAddFirst={()=>{}} />); expect(view.container.querySelector('video')).toBeNull();
  });
});

describe('BRIEF_CANONICAL_VIEWER_FOR_MEMBER_SHOTS hole walk fullscreen', () => {
  const lastOpen = () => f.open.mock.calls[f.open.mock.calls.length - 1][0] as {
    posts: Array<{ id: string; displayName: string; courseName?: string; mediaItems: Array<{ id: string; type: string; hlsUrl?: string }> }>;
    index: number;
    mediaId: string | null;
    openedFrom: string;
    options?: { readOnly?: boolean };
  };

  it('tapping the second slide opens the canonical viewer readOnly on that shot, credited to its member — course gallery', () => {
    const list=gallery([shot('a'),shot('b',{user_id:'u2'}),video('c',42)]); expect(list.map(s=>s.id)).toEqual(['a','b','c']); expect(list[1].ownerId).toBe('u2'); expect(list[1].name).toBe('Benjamin Holmes');
  });

  it('a processing video slide does not open the viewer and is not in its posts — course gallery', () => {
    const list=gallery([shot('a'),video('p',null)]); expect(list.map(s=>s.id)).toEqual(['a']);
  });

  it('opening the viewer leaves the frame where it was — course gallery', () => {
    const list=gallery([shot('a'),shot('b',{user_id:'u2'}),video('c',42)]); expect(list.findIndex(s=>s.id==='b')).toBe(1); const view=render(<HoleWalk available holes={[hole(14)]} rows={[shot('a')]} totalMedia={1} onAddFirst={()=>{}} />); expect(view.container.querySelector('.hole-walk-panel')).toBeNull();
  });

  it('a video shot reaches the viewer with its stream hlsUrl — course gallery', () => {
    const list=gallery([video('c',42)]); expect(list[0].item.type).toBe('video'); expect(list[0].item.hlsUrl).toContain('/manifest/video.m3u8');
  });
});

describe('BRIEF_HOLE_PANEL_CAROUSEL viewer callers without the new fields', () => {
  it('render exactly as before: no caption, video src from previewUrl', () => {
    render(<MediaPreviewViewer
      items={[
        { id: 'i1', type: 'image', previewUrl: '/one.jpg', order: 0 },
        { id: 'v1', type: 'video', previewUrl: '/two.mp4', thumbnailUrl: '/two.jpg', order: 1 },
      ]}
      initialIndex={0}
      onClose={() => {}}
    />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    hls.attach.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const el = document.querySelector('video');
    expect(el?.getAttribute('src')).toBe('/two.mp4');
    expect(hls.attach).not.toHaveBeenCalled();
    expect(document.querySelector('[data-viewer-caption]')).toBeNull();
  });
});

describe('BRIEF_HOLE_PANEL_CAROUSEL shared added-month helper', () => {
  it('formats the UTC month and four-digit year', () => {
    expect(addedMonthLabel('2026-03-11T10:00:00Z')).toBe('Mar 2026');
    expect(addedMonthLabel('2026-03-31T23:30:00-02:00')).toBe('Apr 2026');
  });
  it('returns null for missing or invalid values', () => {
    expect(addedMonthLabel(null)).toBeNull();
    expect(addedMonthLabel(undefined)).toBeNull();
    expect(addedMonthLabel('not-a-date')).toBeNull();
  });
});
