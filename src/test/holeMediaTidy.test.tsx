import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FeedPost } from '@/components/media-system/types/media';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const f = vi.hoisted(() => ({ from: vi.fn(), auth: vi.fn(), insert: vi.fn(), posts: [] as Record<string, unknown>[], reviews: [] as Record<string, unknown>[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: f.from, auth: { getUser: f.auth } } }));

import { holeMediaKey, submitHolePhoto } from '@/lib/courseMedia/holePhotoData';
import { HolePhotoTagDialog } from '@/components/course-media-tab/HolePhotoTagDialog';
import { HolePhotoBatchPath } from '@/components/course-media-tab/HolePhotoFastPaths';
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';

const UID = 'b'.repeat(32);
const canonical = 'https://cdn.example.test/post-media-original';
const derived = `https://customer-x.cloudflarestream.com/${UID}/manifest/video.m3u8`;
const source = { id: 'v', media_url: canonical, created_at: '2026-10-24', media_type: 'video', stream_id: UID, poster_url: '/poster.jpg', duration_seconds: 12, width: 100, height: 100, processing_status: 'complete', processing_error: null, status: 'attached' };
const videoPost = { userId: 'member', actorType: 'personal', mediaItems: [{ id: 'v', type: 'video', hlsUrl: derived, width: 100, height: 100, isProcessing: false }] } as FeedPost;
const batchPhoto = (url: string) => ({ url, createdAt: '2026-10-01T12:00:00Z', exif: { captureDay: null, capturedAt: null, latitude: null, longitude: null } });
const hole = (n: number): CourseHole => ({ hole_no: n, par: 4, yards: 400, stroke_index: 1, avg_to_par: 1, avg_gross: 5, rounds: 10, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 5, bogey: 5, double: 0 } });
const row = (n: number): HolePhoto => ({ id: `p${n}`, hole_no: n, status: 'approved', user_id: 'member', media_url: `/photo-${n}.jpg`, exif_captured_at: null }) as HolePhoto;

beforeEach(() => {
  vi.clearAllMocks(); f.posts = []; f.reviews = [];
  f.auth.mockResolvedValue({ data: { user: { id: 'member' } }, error: null });
  f.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { status: 'approved' }, error: null }) }) });
  f.from.mockImplementation((table: string) => { const chain = { select: () => chain, eq: () => chain, or: () => chain, order: () => chain, range: async () => ({ data: table === 'post_media' ? f.posts : table === 'course_review_media' ? f.reviews : [], error: null }), insert: f.insert }; return chain; });
});

describe('HOLE_MEDIA_TIDY stream-UID identity', () => {
  it('a feed video whose derived URL differs from the source media_url but shares the stream UID matches', () => {
    expect(holeMediaKey(videoPost.mediaItems[0])).toBe(holeMediaKey({ mediaType: 'video', url: canonical, streamId: UID }));
  });
  it('two different UIDs do not match', () => {
    expect(holeMediaKey(videoPost.mediaItems[0])).not.toBe(holeMediaKey({ mediaType: 'video', url: canonical, streamId: 'c'.repeat(32) }));
  });
  it('images still match by URL', () => {
    expect(holeMediaKey({ type: 'image', imageUrl: '/a.jpg' })).toBe(holeMediaKey({ mediaType: 'image', url: '/a.jpg' }));
    expect(holeMediaKey({ type: 'image', imageUrl: '/a.jpg' })).not.toBe(holeMediaKey({ mediaType: 'image', url: '/b.jpg' }));
  });
  it('submitHolePhoto inserts the source media_url for a video selected via its feed item', async () => {
    f.posts = [source];
    await submitHolePhoto(videoPost, 'course', 'member', 7, [7]);
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ hole_no: 7, media_type: 'video', media_url: canonical, stream_id: UID }));
  });
  it('the tag dialog renders the poster, never an img holding a video URL', () => {
    render(<HolePhotoTagDialog imageUrl={derived} mediaSource={{ mediaType: 'video', posterUrl: '/poster.jpg', streamId: UID }} holeCount={2} knownHoleNumbers={[1, 2]} pending={false} error={null} onClose={() => {}} onSubmit={() => {}} />);
    const images = Array.from(document.querySelectorAll('img'));
    expect(images.some(img => img.src.includes('manifest/video.m3u8'))).toBe(false);
    expect(screen.getByAltText('Your video')).toHaveAttribute('src', '/poster.jpg');
  });
});

describe('HOLE_MEDIA_TIDY batch path without a floor', () => {
  it('after tagging an item to hole 4, holes 1-3 stay enabled and no closed-holes paragraph renders', async () => {
    const tag = vi.fn().mockResolvedValue({ status: 'approved' } as HolePhoto);
    render(<HolePhotoBatchPath photos={[batchPhoto('/a.jpg'), batchPhoto('/b.jpg')]} knownHoles={[1, 2, 3, 4]} onTag={tag} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' })); fireEvent.click(screen.getByRole('button', { name: 'Confirm tag' }));
    await waitFor(() => expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/b.jpg'));
    expect(tag).toHaveBeenCalledWith('/a.jpg', 4);
    for (const n of [1, 2, 3]) expect(screen.getByRole('button', { name: `Hole ${n}` })).toBeEnabled();
    expect(screen.queryByText(/closed because/)).toBeNull();
  });
});

describe('HOLE_MEDIA_TIDY hole walk panel', () => {
  it('a hole with one item offers "Add a photo or video" to a member and passes the hole', () => {
    const chosen: number[] = [];
    render(<HoleWalk available holes={[hole(7)]} rows={[row(7)]} totalMedia={1} onAddFirst={n => chosen.push(n)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add a photo or video' }));
    expect(chosen).toEqual([7]);
  });
  it('an empty hole keeps "Add the first" and never shows the more button', () => {
    render(<HoleWalk available holes={[hole(1), hole(7)]} rows={[row(1)]} focus={{ hole: 7, id: '', nonce: 1 }} totalMedia={1} onAddFirst={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add the first' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add a photo or video' })).toBeNull();
  });
  it('the caption rule carries no gradient or background, and the name keeps its legibility shadow', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/course-media-tab/hole-walk.css'), 'utf8');
    const caption = css.split('.hole-walk-caption {')[1]?.split('}')[0] ?? '';
    expect(caption).not.toContain('background');
    expect(caption).not.toContain('gradient');
    expect(css).not.toMatch(/\.hole-walk-caption::(before|after)/);
    expect(css).toContain('text-shadow: 0 1px 3px rgba(0,0,0,0.6)');
  });
});
