import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FeedPost } from '@/components/media-system/types/media';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';

const f = vi.hoisted(() => ({ from: vi.fn(), auth: vi.fn(), insert: vi.fn(), attach: vi.fn(), detach: vi.fn(), posts: [] as Record<string, unknown>[], reviews: [] as Record<string, unknown>[], open: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: f.from, auth: { getUser: f.auth } } }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: f.attach }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: (...args: unknown[]) => f.open(...args) }));
import { canTagHolePhoto, fetchOwnMediaSources, submitHolePhoto } from '@/lib/courseMedia/holePhotoData';
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import { HoleKnownPhotoPath, HolePhotoBatchPath } from '@/components/course-media-tab/HolePhotoFastPaths';
import { HoleMediaVideo } from '@/components/course-media-tab/HoleMediaVideo';
import { audioDuck } from '@/audio/audioDuckStore';

const url = 'https://example.test/clip.m3u8';
const source = { id: 'video', media_url: url, created_at: '2026-10-24', media_type: 'video', stream_id: 'a'.repeat(32), poster_url: '/poster.jpg', duration_seconds: 42, width: 640, height: 480, processing_status: 'complete', processing_error: null, status: 'attached' };
const post = { userId: 'member', actorType: 'personal', mediaItems: [{ id: 'video', type: 'video', hlsUrl: url, width: 640, height: 480, isProcessing: false }] } as FeedPost;
const row = { id: 'video', course_id: 'course', hole_no: 7, user_id: 'member', media_url: url, media_type: 'video', stream_id: source.stream_id, poster_url: '/poster.jpg', duration_seconds: 42, status: 'approved', exif_captured_at: null, created_at: '2026-10-24' } as HolePhoto;
const hole = { hole_no: 7, par: 4, yards: 400, stroke_index: 1, avg_to_par: 1, avg_gross: 5, rounds: 10, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 5, bogey: 5, double: 0 } } as CourseHole;
beforeEach(() => {
  vi.clearAllMocks(); f.posts = []; f.reviews = [];
  f.auth.mockResolvedValue({ data: { user: { id: 'member' } }, error: null });
  f.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: row, error: null }) }) });
  f.attach.mockReturnValue({ detach: f.detach });
  f.from.mockImplementation((table: string) => { const chain = { select: () => chain, eq: () => chain, or: () => chain, order: () => chain, range: async () => ({ data: table === 'post_media' ? f.posts : table === 'course_review_media' ? f.reviews : [], error: null }), insert: f.insert }; return chain; });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); audioDuck.reset(); });

describe('Stage1 encoded hole-video sources', () => {
  it('includes encoded post video and its metadata', async () => { f.posts = [source]; expect(await fetchOwnMediaSources('course', 'member')).toEqual([{ url, createdAt: '2026-10-24', mediaType: 'video', streamId: source.stream_id, posterUrl: '/poster.jpg', durationSeconds: 42, width: 640, height: 480 }]); });
  it.each(['processing', 'pending', 'error'])('excludes post encode status %s', async processing_status => { f.posts = [{ ...source, processing_status }]; expect(await fetchOwnMediaSources('course', 'member')).toEqual([]); });
  it('excludes missing duration', async () => { f.posts = [{ ...source, duration_seconds: null }]; expect(await fetchOwnMediaSources('course', 'member')).toEqual([]); });
  it('excludes processing error', async () => { f.posts = [{ ...source, processing_error: 'Encode failed' }]; expect(await fetchOwnMediaSources('course', 'member')).toEqual([]); });
  it('review attached video is eligible but failed and undated encode are excluded', async () => { f.reviews = [source, { ...source, media_url: 'failed', status: 'failed' }, { ...source, media_url: 'pending', duration_seconds: null }]; expect((await fetchOwnMediaSources('course', 'member')).map(s => s.url)).toEqual([url]); });
  it('same URL mirrored in post and review dedupes once', async () => { f.posts = [source]; f.reviews = [source]; expect(await fetchOwnMediaSources('course', 'member')).toHaveLength(1); });
  it('derives Stream poster when the row lacks one', async () => { f.posts = [{ ...source, poster_url: null }]; expect((await fetchOwnMediaSources('course', 'member'))[0]?.posterUrl).toContain(`/${source.stream_id}/thumbnails/thumbnail.jpg`); });
  it('tagged video writes its authoritative source metadata', async () => { f.posts = [source]; await submitHolePhoto(post, 'course', 'member', 7, [7]); expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ hole_no: 7, media_type: 'video', media_url: url, stream_id: source.stream_id, poster_url: '/poster.jpg', duration_seconds: 42, width: 640, height: 480 })); });
  it('finished own video is eligible', () => expect(canTagHolePhoto(post, 'member', 1, new Set())).toBe(true));
  it('processing video is not eligible', () => expect(canTagHolePhoto({ ...post, mediaItems: [{ ...post.mediaItems[0], isProcessing: true }] }, 'member', 1, new Set())).toBe(false));
});
describe('Stage1 hole video display and lifecycle', () => {
  it('video-only hole uses poster and count one and opens the viewer with the stream', () => {
    render(<HoleWalk available holes={[hole]} rows={[row]} totalMedia={1} onAddFirst={() => {}} />);
    const tile = screen.getByRole('button', { name: 'Hole 7' });
    expect(tile.querySelector('img')).toHaveAttribute('src', '/poster.jpg');
    expect(tile.querySelector('.hole-walk-count')).toHaveTextContent('1');
    fireEvent.click(tile);
    const panel = screen.getByRole('region');
    expect(screen.queryByRole('button', { name: 'Play video' })).toBeNull();
    const slide = panel.querySelector('.hole-walk-slide') as HTMLElement;
    expect(slide.querySelector('img')).toHaveAttribute('src', '/poster.jpg');
    expect(slide.querySelector('.hole-walk-play-disc')).toBeTruthy();
    fireEvent.click(slide);
    expect(f.open).toHaveBeenCalledTimes(1);
    const args = f.open.mock.calls[0][0] as { posts: Array<{ mediaItems: Array<{ type: string; hlsUrl?: string }> }>; options?: { readOnly?: boolean } };
    expect(args.posts).toHaveLength(1);
    expect(args.posts[0].mediaItems[0].type).toBe('video');
    expect(args.posts[0].mediaItems[0].hlsUrl).toContain(`/${source.stream_id}/manifest/video.m3u8`);
    expect(args.options).toEqual({ readOnly: true, syntheticPosts: true });
    expect(f.attach).not.toHaveBeenCalled();
  });
  it('known-hole pile shows eligible video poster and duration', () => { render(<HoleKnownPhotoPath hole={7} photos={[url]} sources={[{ url, createdAt: '', mediaType: 'video', streamId: source.stream_id, posterUrl: '/poster.jpg', durationSeconds: 42, width: 640, height: 480 }]} pending={false} error={null} onChoose={() => {}} onLibrary={() => {}} onClose={() => {}} />); expect(screen.getByRole('button', { name: 'Choose video' }).querySelector('img')).toHaveAttribute('src', '/poster.jpg'); });
  it('batch uses video poster rather than manifest', () => { render(<HolePhotoBatchPath photos={[{ url, createdAt: '', mediaType: 'video', posterUrl: '/poster.jpg', durationSeconds: 42, exif: { capturedAt: null, captureDay: null, latitude: null, longitude: null } }]} knownHoles={[7]} onTag={async () => row} onClose={() => {}} />); expect(screen.getByAltText('Current video')).toHaveAttribute('src', '/poster.jpg'); });
  it('manual play attaches HLS with sound and cleanup detaches it', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const view = render(<HoleMediaVideo media={row} label="Hole 7" />);
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
    expect(f.attach).toHaveBeenCalledTimes(1); expect(view.container.querySelector('video')?.muted).toBe(false);
    expect(audioDuck.isDucked()).toBe(true);
    view.unmount(); expect(f.detach).toHaveBeenCalledTimes(1); expect(audioDuck.isDucked()).toBe(false);
  });
});