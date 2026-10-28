import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const f = vi.hoisted(() => ({ register: vi.fn(), attach: vi.fn(), detach: vi.fn(), unregister: vi.fn(), open: vi.fn(), rpc: vi.fn(), reduced: false, verdicts: [] as Array<(won: boolean) => void>, walkProps: vi.fn() }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', async importOriginal => ({ ...await importOriginal<typeof import('@/components/explore-tab-new/courseled/reviewVideoAutoplay')>(), registerReviewVideo: f.register }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: f.attach }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => f.reduced }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.open }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ isSuccess: true, data: { available: true, total_rounds: 0, holes: [] } }) }));
vi.mock('@/components/course-media-tab/hooks/useHolePhotoTagging', () => ({ useHolePhotoTagging: () => ({ ready: true, sources: { isSuccess: true, data: [{ url: 'https://example.test/a.m3u8', createdAt: '', mediaType: 'video', streamId: 'a'.repeat(32), posterUrl: '/a.jpg', durationSeconds: 42 }] }, tags: { isSuccess: true, data: [] }, taggedUrls: new Set(), submit: { reset: vi.fn() }, move: { reset: vi.fn() }, remove: { reset: vi.fn() } }) }));
vi.mock('@/components/course-media-tab/hooks/useCourseMedia', () => ({ useCourseMedia: () => ({ posts: [], postsForFullscreen: [], mediaCounts: { total: 1, photos: 0, videos: 1 }, countsReady: true }) }));
vi.mock('@/uploads/hooks/useMediaUpload', () => ({ useMediaUpload: () => ({ upload: vi.fn() }) }));
vi.mock('@/components/course-media-tab/AdminHoleTagging', () => ({ AdminHoleTagging: () => null }));
vi.mock('@/components/course-media-tab/CourseMediaCanonGrid', () => ({ CourseMediaCanonGrid: () => null }));
vi.mock('@/components/course-media-tab/CourseMediaHeader', () => ({ CourseMediaHeader: () => null }));
vi.mock('@/components/course-media-tab/hooks/useCoursePlaceMedia', () => ({ useCoursePlaceMedia: () => ({ tags: { data: [], isSuccess: true } }) }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/course-media-tab/HoleWalk', async importOriginal => {
  const original = await importOriginal<typeof import('@/components/course-media-tab/HoleWalk')>();
  return { ...original, HoleWalk: (props: Parameters<typeof original.HoleWalk>[0]) => { f.walkProps(props); return <original.HoleWalk {...props} />; } };
});

import { HoleInlineVideo } from '@/components/course-media-tab/HoleInlineVideo';
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import { HolePhotoBatchPath } from '@/components/course-media-tab/HolePhotoFastPaths';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { audioDuck } from '@/audio/audioDuckStore';

const media = { media_url: 'https://example.test/a.m3u8', stream_id: 'a'.repeat(32), poster_url: '/a.jpg', duration_seconds: 42 };
const row = (id: string, type = 'video', duration: number | null = 42) => ({ ...media, id, course_id: 'course', user_id: 'member', hole_no: 1, status: 'approved', media_type: type, duration_seconds: duration, added_at: '2026-10-01T00:00:00Z' }) as HolePhoto;
const hole: CourseHole = { hole_no: 1, par: 4, yards: 400, stroke_index: 1, rounds: 1, avg_gross: 4, avg_to_par: 0, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 1, bogey: 0, double: 0 } };
const props = { media, alt: 'Hole 1', fit: 'cover' as const, autoplayGroup: 'hole-walk', active: true };
const win = (index = f.verdicts.length - 1, won = true) => act(() => f.verdicts[index]?.(won));
function walk(rows = [row('a'), row('b')], mediaPaused = false) {
  f.rpc.mockResolvedValue({ data: rows.map(r => ({ ...r, member_id: r.user_id, member_name: 'Member' })), error: null });
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const make = (paused = mediaPaused) => <QueryClientProvider client={cache}><HoleWalk available holes={[hole]} rows={rows} totalMedia={rows.length} onAddFirst={() => {}} mediaPaused={paused} /></QueryClientProvider>;
  const view = render(make()); fireEvent.click(screen.getByRole('button', { name: 'Hole 1' }));
  return { ...view, make };
}
beforeEach(() => {
  vi.clearAllMocks(); f.reduced = false; f.verdicts = [];
  useFullscreenFeedStore.setState({ isOpen: false });
  f.register.mockImplementation((_group, _el, cb) => { f.verdicts.push(cb); return () => { f.unregister(); cb(false); }; });
  f.attach.mockReturnValue({ detach: f.detach });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); useFullscreenFeedStore.setState({ isOpen: false }); });

describe('active hole tile autoplay', () => {
  it('registers only the active ready slide with the one-player half-visible election', () => {
    walk(); expect(f.register).toHaveBeenCalledTimes(1);
    expect(f.register).toHaveBeenCalledWith('hole-walk', expect.any(Element), expect.any(Function), { threshold: 0.5, maxPlaying: 1 });
    const slides = document.querySelectorAll('.hole-walk-slide'); const video = slides[0].querySelector('video');
    expect(video?.muted).toBe(true); expect(video?.loop).toBe(true); expect(video?.playsInline).toBe(true);
    expect(slides[0].querySelector('.hole-walk-play-disc')).toBeNull(); expect(slides[1].querySelector('video')).toBeNull();
    expect(slides[1].querySelector('img')).toHaveAttribute('src', '/a.jpg');
  });
  it('winning attaches HLS and plays muted without ducking sound, losing resets and detaches', () => {
    const view = render(<HoleInlineVideo {...props} />); expect(f.attach).not.toHaveBeenCalled(); win();
    const video = view.container.querySelector('video');
    expect(f.attach).toHaveBeenCalledWith(video, expect.stringContaining(`/${media.stream_id}/manifest/video.m3u8`), expect.any(Function));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1); expect(video?.muted).toBe(true); expect(audioDuck.isDucked()).toBe(false);
    if (!video) throw new Error('Missing player'); video.currentTime = 5; win(0, false);
    expect(video.currentTime).toBe(0); expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled(); expect(f.detach).toHaveBeenCalledTimes(1);
  });
  it.each(['inactive', 'paused', 'fullscreen', 'unmount'])('%s releases the player and registration', reason => {
    const view = render(<HoleInlineVideo {...props} />); win(); const video = view.container.querySelector('video');
    if (!video) throw new Error('Missing player'); video.currentTime = 5;
    if (reason === 'inactive') view.rerender(<HoleInlineVideo {...props} active={false} />);
    if (reason === 'paused') view.rerender(<HoleInlineVideo {...props} paused />);
    if (reason === 'fullscreen') act(() => useFullscreenFeedStore.setState({ isOpen: true }));
    if (reason === 'unmount') view.unmount();
    expect(f.detach).toHaveBeenCalledTimes(1); expect(f.unregister).toHaveBeenCalledTimes(1); expect(video.currentTime).toBe(0);
  });
  it.each(['paused', 'fullscreen'])('clearing %s waits for a fresh in-view win before resuming', reason => {
    const view = render(<HoleInlineVideo {...props} />); win();
    if (reason === 'paused') { view.rerender(<HoleInlineVideo {...props} paused />); view.rerender(<HoleInlineVideo {...props} />); }
    else { act(() => useFullscreenFeedStore.setState({ isOpen: true })); act(() => useFullscreenFeedStore.setState({ isOpen: false })); }
    expect(f.attach).toHaveBeenCalledTimes(1); win(); expect(f.attach).toHaveBeenCalledTimes(2);
  });
  it('changing the active shot detaches its video and elects the next slide', () => {
    walk(); win(); fireEvent.click(screen.getByRole('button', { name: 'Show shot 2 of 2' }));
    expect(f.detach).toHaveBeenCalledTimes(1); expect(f.register).toHaveBeenCalledTimes(2);
    const slides = document.querySelectorAll('.hole-walk-slide'); expect(slides[0].querySelector('video')).toBeNull(); expect(slides[1].querySelector('video')).not.toBeNull();
  });
  it.each(['reduced motion', 'Save-Data'])('%s keeps the poster and disc without a video', reason => {
    if (reason === 'reduced motion') f.reduced = true;
    else vi.stubGlobal('navigator', { connection: { saveData: true } });
    walk([row('a')]); expect(document.querySelector('.hole-walk-slide video')).toBeNull();
    expect(document.querySelector('.hole-walk-play-disc')).not.toBeNull(); expect(f.register).not.toHaveBeenCalled();
  });
  it('attachment failure releases the player and restores the poster disc', () => {
    walk([row('a')]); win(); act(() => f.attach.mock.calls[0][2]());
    expect(document.querySelector('.hole-walk-slide video')).toBeNull(); expect(document.querySelector('.hole-walk-play-disc')).not.toBeNull(); expect(f.detach).toHaveBeenCalledTimes(1);
  });
  it('a ready autoplay slide still opens its tapped shot in the canonical viewer', async () => {
    walk(); win(); fireEvent.click(document.querySelector('.hole-walk-slide') as Element);
    await waitFor(() => expect(f.open).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'a', options: { readOnly: true, syntheticPosts: true } })));
  });
  it('image and processing slides do not register or create a player', () => {
    walk([row('a', 'image'), row('b', 'video', null)]);
    expect(document.querySelector('.hole-walk-slide img')).toHaveAttribute('src', media.media_url);
    fireEvent.click(screen.getByRole('button', { name: 'Show shot 2 of 2' }));
    expect(document.querySelector('.hole-media-processing')).not.toBeNull(); expect(f.register).not.toHaveBeenCalled(); expect(document.querySelector('video')).toBeNull();
  });
  it('batch glass thumbnail stays still and opens the canonical read-only video viewer', () => {
    const exif = { capturedAt: null, captureDay: null, latitude: null, longitude: null };
    const photos = ['a', 'b'].map(id => ({ url: `https://example.test/${id}.m3u8`, createdAt: '', exif, mediaType: 'video' as const, streamId: id.repeat(32), posterUrl: `/${id}.jpg`, durationSeconds: 42 }));
    render(<HolePhotoBatchPath photos={photos} knownHoles={[1]} onTag={async () => row('a')} onClose={() => {}} />);
    expect(f.register).not.toHaveBeenCalled(); expect(document.querySelector('video')).toBeNull();
    expect(screen.getByAltText('Current video')).toHaveAttribute('src', '/a.jpg');
    fireEvent.click(screen.getByRole('button', { name: 'View shot' }));
    expect(f.open).toHaveBeenCalledWith(expect.objectContaining({ options: { readOnly: true, syntheticPosts: true } }));
    fireEvent.click(screen.getByRole('button', { name: 'Shot 2 of 2' }));
    expect(screen.getByAltText('Current video')).toHaveAttribute('src', '/b.jpg');
  });
  it('batch-open pauses the underlying walk and Close releases it', async () => {
    render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><CourseMediaTabNew courseId="course" /></QueryClientProvider></MemoryRouter>);
    expect(f.walkProps.mock.lastCall?.[0].mediaPaused).toBe(false);
    const row = document.querySelector('.media-v2-untagged');
    if (!row) throw new Error('Missing member untagged row');
    fireEvent.click(row); await screen.findByRole('dialog');
    expect(f.walkProps.mock.lastCall?.[0].mediaPaused).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close' })); expect(f.walkProps.mock.lastCall?.[0].mediaPaused).toBe(false);
  });
});