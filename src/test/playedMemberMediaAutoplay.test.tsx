/** BRIEF_PLAYED_MEMBER_MEDIA_AUTOPLAY §3. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ user: null as null | { id: string }, rpc: [] as any[], result: [] as any[], pending: false, observers: [] as any[], videos: [] as any[], opened: [] as any[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: f.user, loading: false }) }));
vi.mock('@/hooks/useCourseMediaCounts', () => ({ useCourseMediaCounts: () => ({ data: { photos: 0, videos: 0, total: 0 } }) }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span data-face="" /> }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: (a: any) => { f.opened.push(a); } }));
vi.mock('@/components/course-media-tab/HoleInlineVideo', () => ({
  HoleInlineVideo: (p: any) => { f.videos.push(p); return <span data-inline-video={p.autoplayGroup} data-fit={p.fit} data-stream={p.media.stream_id ?? ''} data-poster={p.media.poster_url ?? ''} />; },
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (name: string, params: any) => { f.rpc.push([name, params]); return f.pending ? new Promise(() => {}) : Promise.resolve({ data: f.result, error: null }); } },
}));
import { RegionRails } from '@/components/courses/browse/RegionRails';
import { PlayedTile } from '@/components/courses/browse/PlayedTile';

class IO { cb: any; els: Element[] = []; constructor(cb: any) { this.cb = cb; f.observers.push(this); } observe(el: Element) { this.els.push(el); } disconnect() {} unobserve() {} takeRecords() { return []; } }
const near = (i = 0) => act(() => { const o = f.observers[i]; o.cb(o.els.map((target: Element) => ({ isIntersecting: true, target }))); });

const course = { id: 'yas', name: 'Yas Links Abu Dhabi', imageUrl: 'https://stock/yas.jpg', region: null, subCountry: null, country: 'United Arab Emirates', continent: 'Asia', lat: null, lng: null } as any;
const group = { courseId: 'yas', activity: 21, rows: [], reviews: [], posts: 21, faces: [], best: null, latestAt: '2026-11-10' } as any;
const rail = { key: 'abroad', kind: 'abroad', nations: ['United Arab Emirates'], kicker: 'FURTHER AFIELD', title: 'Abroad', courseIds: ['yas'], playedTotal: 1, activity: 21 } as any;
const wrap = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
const rails = (onOpen = vi.fn()) => wrap(<RegionRails rails={[rail]} groups={[group]} courseMap={new Map([['yas', course]])} onOpen={onOpen} />);
const img = { media_id: 'm', media_type: 'image', media_url: 'https://media/member.jpg', stream_id: null, poster_url: null, duration_seconds: null, source_review_id: 'r1' };
const vid = { ...img, media_type: 'video', media_url: 'https://stream/abc/manifest/video.m3u8', stream_id: 'abc', poster_url: 'https://stream/abc/thumb.jpg', duration_seconds: 12 };

let origIO: any;
beforeEach(() => { f.user = null; f.rpc = []; f.result = []; f.pending = false; f.observers = []; f.videos = []; f.opened = []; origIO = (window as any).IntersectionObserver; (window as any).IntersectionObserver = IO; });
afterEach(() => { cleanup(); (window as any).IntersectionObserver = origIO; });

describe('rail card member media', () => {
  it('is lazy: no read for a card that has not come near the viewport', () => {
    rails();
    expect(f.rpc).toHaveLength(0);
    expect(f.observers).toHaveLength(1);
  });

  it('signed out, reads get_course_media_v2 with a null user and one row, then draws the newest member photo', async () => {
    f.result = [img];
    const { container } = rails();
    near();
    await waitFor(() => expect(container.querySelector('[data-rail-media="image"] img')).not.toBeNull());
    expect(f.rpc[0]).toEqual(['get_course_media_v2', expect.objectContaining({ p_user_id: null, p_course_id: 'yas', p_filter: 'all', p_page_size: 1 })]);
    expect(container.querySelector('[data-rail-media] img')!.getAttribute('src')).toBe('https://media/member.jpg');
  });

  it('signed in passes the user id', async () => {
    f.user = { id: 'me' }; f.result = [img];
    const { container } = rails(); near();
    await waitFor(() => expect(container.querySelector('[data-rail-media]')).not.toBeNull());
    expect(f.rpc[0][1].p_user_id).toBe('me');
  });

  it('keeps the course image while pending and when there is no member media', async () => {
    f.pending = true;
    const a = rails(); near();
    expect(a.container.querySelector('[data-rail-media]')).toBeNull();
    expect(a.container.querySelector('[data-rail-card] img')).not.toBeNull();
    cleanup(); f.pending = false; f.result = []; f.observers = []; f.rpc = [];
    const b = rails(); near();
    await waitFor(() => expect(f.rpc).toHaveLength(1));
    expect(b.container.querySelector('[data-rail-media]')).toBeNull();
    expect(b.container.querySelector('[data-rail-card] img')).not.toBeNull();
  });

  it('a video card renders HoleInlineVideo in courses-member-shots with its poster, and the tap still opens the sheet', async () => {
    f.result = [vid];
    const onOpen = vi.fn();
    const { container } = rails(onOpen); near();
    await waitFor(() => expect(container.querySelector('[data-inline-video="courses-region-abroad"]')).not.toBeNull());
    const v = container.querySelector('[data-inline-video]')!;
    expect(v.getAttribute('data-fit')).toBe('cover');
    expect(v.getAttribute('data-poster')).toBe(vid.poster_url);
    expect(f.videos.at(-1).active).toBe(true);
    fireEvent.click(container.querySelector('[data-rail-card]')!);
    expect(onOpen).toHaveBeenCalledWith('yas');
  });
});

describe('tile row videos', () => {
  const tileGroup = { ...group, rows: [], reviews: [] };
  const holeVideo = { kind: 'hole', key: 'h:v', holeNo: 3, addedAt: '2026-11-10', imageUrl: 'https://p/h.jpg', par: 4, yards: 400, memberName: 'Tom', memberId: 'tom', memberPhoto: null, sourcePostId: null, mediaId: 'v', rows: [{ id: 'v', hole_no: 3, media_type: 'video', media_url: 'https://s/v.m3u8', stream_id: 'sv', poster_url: 'https://p/h.jpg' }], video: { media_url: 'https://s/v.m3u8', stream_id: 'sv', poster_url: 'https://p/h.jpg', duration_seconds: 9 } };
  const photo = { kind: 'course', key: 'c:p', postId: 'p', mediaId: 'pm', createdAt: '2026-11-11', imageUrl: 'https://x/c.jpg', caption: 'Lovely', memberName: 'Dan', memberId: 'dan', memberPhoto: null };
  const tile = { ready: true, hardestHole: null, holes: [holeVideo], photos: [photo], coursePosts: [{ id: 'p', userId: 'dan', createdAt: '2026-11-11', mediaItems: [{ id: 'pm', type: 'image', imageUrl: 'https://x/c.jpg' }] }] } as any;
  it('a video tile autoplays through HoleInlineVideo with its poster; the photo tile has no video; taps still open the viewer', async () => {
    const { container } = wrap(<PlayedTile group={tileGroup} course={course} tile={tile} />);
    const tiles = container.querySelectorAll('[data-tile-photo]');
    expect(tiles).toHaveLength(2);
    const v = tiles[0].querySelector('[data-inline-video="courses-played-tile"]');
    expect(v).not.toBeNull();
    expect(v!.getAttribute('data-poster')).toBe('https://p/h.jpg');
    expect(tiles[1].querySelector('[data-inline-video]')).toBeNull();
    fireEvent.click(tiles[0]);
    await waitFor(() => expect(f.opened).toHaveLength(1));
  });
});
