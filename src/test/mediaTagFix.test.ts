import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { FeedPost } from '@/components/media-system/types/media';

const f = vi.hoisted(() => ({ exif: vi.fn(), insert: vi.fn(), from: vi.fn(), auth: vi.fn() }));
vi.mock('@/lib/courseMedia/holePhotoExif', () => ({ readHolePhotoExif: f.exif }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: f.from, auth: { getUser: f.auth } } }));

import { prepareHolePhoto, submitHolePhoto, submitLibraryHolePhoto } from '@/lib/courseMedia/holePhotoData';
import { composerPhotoMetadata, writeComposerHolePhoto } from '@/lib/courseMedia/composerHolePhotos';
import { batchVerdicts } from '@/lib/courseMedia/holePhotoBatch';

const url = 'https://example.test/photo.webp';
const empty = { capturedAt: null, captureDay: null, latitude: null, longitude: null };
const post = { userId: 'member', actorType: 'personal', mediaItems: [{ id: 'p', type: 'image', imageUrl: url, width: 32, height: 32 }] } as FeedPost;
const file = new File(['original'], 'original.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Remote media must never be fetched')));
  f.exif.mockResolvedValue(empty);
  f.auth.mockResolvedValue({ data: { user: { id: 'member' } }, error: null });
  f.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { status: 'pending', media_url: url }, error: null }) }) });
  f.from.mockImplementation((table: string) => {
    const rows = table === 'course_review_media' ? [{ media_url: url, created_at: '' }] : [];
    const chain = {
      select: () => chain, eq: () => chain, or: () => chain, order: () => chain,
      range: async () => ({ data: rows, error: null }),
      limit: async () => ({ data: [], error: null }), insert: f.insert,
    };
    return chain;
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('MEDIA_TAGFIX_1 original File boundary', () => {
  it('URL-only preparation never fetches media or invokes the EXIF reader', async () => {
    expect(await prepareHolePhoto(url)).toEqual({ exif: empty });
    expect(fetch).not.toHaveBeenCalled(); expect(f.exif).not.toHaveBeenCalled();
  });
  it('pile and existing-photo hole tagging write Waiting without EXIF or round matching', async () => {
    expect(await submitHolePhoto(post, 'course', 'member', 2, [2, 9])).toEqual({ status: 'pending', media_url: url });
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ course_id: 'course', user_id: 'member', hole_no: 2, media_url: url, status: 'pending', auto_verdict: 'queued', proof_score_id: null, exif_captured_at: null, exif_lat: null, exif_lng: null }));
    expect(f.from.mock.calls.map(([table]) => table)).not.toContain('whs_scores');
    expect(fetch).not.toHaveBeenCalled(); expect(f.exif).not.toHaveBeenCalled();
  });
  it('URL-only batch photos all wait even when the member played here', async () => {
    const { exif } = await prepareHolePhoto(url);
    expect(batchVerdicts([{ url, createdAt: '2026-10-18', exif }], 'member', 'course', [{ id: 'round', userId: 'member', golfCourseId: 'course', playDate: '2026-10-18' }])).toEqual({ published: 0, waiting: 1, all: false });
    expect(fetch).not.toHaveBeenCalled(); expect(f.exif).not.toHaveBeenCalled();
  });
  it('URL-only composer metadata skips the parser entirely', async () => {
    expect(await composerPhotoMetadata(undefined, url)).toEqual(empty);
    expect(fetch).not.toHaveBeenCalled(); expect(f.exif).not.toHaveBeenCalled();
  });
  it('composer metadata still parses the exact original File', async () => {
    const metadata = { ...empty, captureDay: '2026-10-18', capturedAt: '2026-10-18T12:00:00' };
    f.exif.mockResolvedValue(metadata);
    expect(await composerPhotoMetadata(file, url)).toEqual(metadata);
    expect(f.exif).toHaveBeenCalledExactlyOnceWith(file); expect(fetch).not.toHaveBeenCalled();
  });
  it('URL-only composer contributions write Waiting without blocking on metadata', async () => {
    await writeComposerHolePhoto({ courseId: 'course', assignments: { p: 2 }, knownHoles: [2, 9], proofScoreId: null }, 'member', { id: 'p', type: 'image' }, url);
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', proof_score_id: null, media_url: url, hole_no: 2 }));
    expect(fetch).not.toHaveBeenCalled(); expect(f.exif).not.toHaveBeenCalled();
  });
  it('library tagging retains original File parsing without fetching its uploaded URL', async () => {
    await submitLibraryHolePhoto(file, url, 'course', 'member', 2, [2, 9]);
    expect(f.exif).toHaveBeenCalledExactlyOnceWith(file); expect(fetch).not.toHaveBeenCalled();
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', file_name: 'original.jpg' }));
  });
});