import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TusUploadOptions } from '@/uploads/tusVideoUpload';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const f = vi.hoisted(() => ({ rpc: vi.fn(), upload: vi.fn(), resilient: vi.fn(), poll: vi.fn(), insert: vi.fn(), auth: vi.fn(), exif: vi.fn(), open: vi.fn() }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: (...args: unknown[]) => f.open(...args) }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/uploads/hooks/useMediaUpload', () => ({ useMediaUpload: () => ({ upload: f.upload }) }));
vi.mock('@/uploads/resilientVideoUpload', () => ({ uploadVideoResilient: f.resilient }));
vi.mock('@/utils/pollStreamMetadata', () => ({ pollStreamMetadata: f.poll }));
vi.mock('@/lib/courseMedia/holePhotoExif', () => ({ readHolePhotoExif: f.exif }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc, auth: { getUser: f.auth }, from: () => ({ insert: f.insert }) } }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ isSuccess: true, data: { available: true, holes: [hole] } }) }));
vi.mock('@/components/course-media-tab/hooks/useHolePhotoTagging', () => ({ useHolePhotoTagging: () => ({ ready: true, own: { data: [] }, sources: { data: [], isSuccess: true }, tags: { data: [], isSuccess: true }, taggedUrls: new Set(), submit: { reset: vi.fn() } }) }));
vi.mock('@/components/course-media-tab/hooks/useCourseMedia', () => ({ useCourseMedia: () => ({ posts: [], postsForFullscreen: [], mediaCounts: { total: 0, photos: 0, videos: 0 }, countsReady: true }) }));
vi.mock('@/components/course-media-tab/CourseMediaCanonGrid', () => ({ CourseMediaCanonGrid: () => null }));
vi.mock('@/components/course-media-tab/CourseMediaHeader', () => ({ CourseMediaHeader: () => null }));
vi.mock('@/components/course-media-tab/hooks/useCoursePlaceMedia', () => ({ useCoursePlaceMedia: () => ({ tags: { data: [], isSuccess: true } }) }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));

import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import { libraryHoleVideoError, submitLibraryHoleVideo } from '@/lib/courseMedia/holePhotoData';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
const sid = 'a'.repeat(32);
const hole: CourseHole = { hole_no: 7, par: 4, yards: 400, stroke_index: 1, avg_to_par: 1, avg_gross: 5, rounds: 10, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 5, bogey: 5, double: 0 } };
const row = { id: 'v', media_type: 'video', media_url: generateStreamHlsUrl(sid), poster_url: '/poster.jpg', stream_id: sid, duration_seconds: null, hole_no: 7, status: 'approved', user_id: 'member', exif_captured_at: null } as HolePhoto;
beforeEach(() => {
  vi.clearAllMocks();
  f.auth.mockResolvedValue({ data: { user: { id: 'member' } }, error: null });
  f.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: row, error: null }) }) });
  f.exif.mockResolvedValue({ capturedAt: null, captureDay: null, latitude: null, longitude: null });
  f.upload.mockResolvedValue({ success: true, mediaUrl: '/r2.jpg' });
  f.poll.mockReturnValue(new Promise(() => {}));
  f.resilient.mockImplementation(async (options: TusUploadOptions) => { options.onSuccess(sid); });
});
afterEach(cleanup);
function mount() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(cache, 'invalidateQueries');
  const view = render(<MemoryRouter><QueryClientProvider client={cache}><CourseMediaTabNew courseId="course" /></QueryClientProvider></MemoryRouter>);
  return { ...view, invalidate };
}
function choose(view: ReturnType<typeof mount>, file: File, first = false) {
  fireEvent.click(screen.getByRole('button', { name: first ? 'Add the first' : 'Hole 7' }));
  if (first) fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
  const input = document.querySelector<HTMLInputElement>('input[type=file]');
  if (!input) throw new Error('Library input missing');
  fireEvent.change(input, { target: { files: [file] } });
}
describe('Stage 2 library routing and persistence', () => {
  it('images retain the R2 upload and original File EXIF path', async () => {
    const view = mount(); const file = new File(['photo'], 'p.jpg', { type: 'image/jpeg' }); choose(view, file);
    await waitFor(() => expect(f.insert).toHaveBeenCalled());
    expect(f.upload).toHaveBeenCalledWith(file, { bucketType: 'clbhouz-course-images', destination: 'r2' });
    expect(f.exif).toHaveBeenCalledWith(file); expect(f.resilient).not.toHaveBeenCalled();
  });
  it('video success inserts Stream URLs and null encode metadata, closes and refreshes all three reads', async () => {
    const view = mount(); const file = new File(['video'], 'v.mov', { type: 'video/quicktime' }); choose(view, file, true);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(f.resilient).toHaveBeenCalledWith(expect.objectContaining({ file })); expect(f.upload).not.toHaveBeenCalled(); expect(f.exif).not.toHaveBeenCalled();
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ media_type: 'video', stream_id: sid, media_url: generateStreamHlsUrl(sid), poster_url: generateStreamThumbnailUrl(sid), duration_seconds: null, width: null, height: null, file_name: 'v.mov', hole_no: 7, status: 'approved', proof_score_id: null, exif_captured_at: null }));
    for (const queryKey of [['hole-photo-tags', 'course', 'member'], ['course-media-counts', 'course'], ['course-media-feed', 'course']]) expect(view.invalidate).toHaveBeenCalledWith({ queryKey });
    expect(f.poll).toHaveBeenCalledWith(sid);
  });
  it('progress keeps the sheet open, disabled and does not insert before upload completion', async () => {
    let finish: (() => void) | undefined;
    f.resilient.mockImplementation(async (options: TusUploadOptions) => { options.onProgress(37, 100); finish = () => options.onSuccess(sid); });
    const view = mount(); choose(view, new File(['video'], 'v.mp4', { type: 'video/mp4' }));
    expect(await screen.findByRole('button', { name: /Uploading 37%/ })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }); expect(screen.getByRole('dialog')).toBeInTheDocument(); expect(f.insert).not.toHaveBeenCalled();
    finish?.(); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('failed upload retains the sheet without saving a contribution', async () => {
    f.resilient.mockImplementation(async (options: TusUploadOptions) => { options.onError(new Error('Upload failed')); });
    const view = mount(); choose(view, new File(['video'], 'v.mp4', { type: 'video/mp4' }));
    await screen.findByRole('alert'); expect(screen.getByRole('dialog')).toBeInTheDocument(); expect(f.insert).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Choose from your library' })).toBeEnabled();
  });
  it('poll completion refreshes tags independently after the sheet closed', async () => {
    let finish: (() => void) | undefined; f.poll.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const view = mount(); choose(view, new File(['video'], 'v.mp4', { type: 'video/mp4' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); const before = view.invalidate.mock.calls.length;
    finish?.(); await waitFor(() => expect(view.invalidate.mock.calls.length).toBe(before + 1));
    expect(view.invalidate).toHaveBeenLastCalledWith({ queryKey: ['hole-photo-tags', 'course', 'member'] });
  });
  it('empty MIME supported extension reaches the resilient uploader', async () => {
    const view = mount(); choose(view, new File(['video'], 'v.M4V'));
    await waitFor(() => expect(f.insert).toHaveBeenCalled()); expect(f.resilient).toHaveBeenCalled(); expect(f.upload).not.toHaveBeenCalled();
  });
  it('library video insertion refuses a different signed-in member', async () => {
    f.auth.mockResolvedValue({ data: { user: { id: 'other' } }, error: null });
    await expect(submitLibraryHoleVideo(new File(['v'], 'v.mp4', { type: 'video/mp4' }), sid, 'course', 'member', 7, [7])).rejects.toThrow('Please sign in again before tagging.'); expect(f.insert).not.toHaveBeenCalled();
  });
});
describe('Founder size and type ruling', () => {
  it.each(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'])('accepts %s', type => expect(libraryHoleVideoError(new File(['v'], 'v', { type }))).toBeNull());
  it.each(['MP4', 'MoV', 'M4v', 'WEBM'])('accepts empty MIME .%s case-insensitively', ext => expect(libraryHoleVideoError(new File(['v'], `v.${ext}`))).toBeNull());
  it('rejects unsupported MIME even with a supported extension', () => expect(libraryHoleVideoError(new File(['v'], 'v.mp4', { type: 'application/octet-stream' }))).toBe("That file type isn't supported."));
  it('rejects an unsupported empty-MIME extension', () => expect(libraryHoleVideoError(new File(['v'], 'v.avi'))).toBe("That file type isn't supported."));
  it('allows exactly 4 GiB', () => { const file = new File([], 'v.mp4', { type: 'video/mp4' }); Object.defineProperty(file, 'size', { value: 4294967296 }); expect(libraryHoleVideoError(file)).toBeNull(); });
  it('rejects one byte over 4 GiB', () => { const file = new File([], 'v.mp4', { type: 'video/mp4' }); Object.defineProperty(file, 'size', { value: 4294967297 }); expect(libraryHoleVideoError(file)).toBe('That video is too large to upload.'); });
});
describe('Stage 2 encode display', () => {
  it('null duration has no playable element; metadata refresh makes the shot open in the viewer', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    f.rpc.mockResolvedValue({ data: [{ ...row, duration_seconds: 42, member_avatar_url: null }], error: null });
    const view = render(<QueryClientProvider client={cache}><HoleWalk available holes={[hole]} rows={[row]} totalMedia={1} onAddFirst={() => {}} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    expect(screen.queryByRole('button', { name: 'Play video' })).toBeNull(); expect(view.container.querySelector('video')).toBeNull();
    expect(view.container.querySelector('.hole-media-processing')).toBeInTheDocument();
    fireEvent.click(view.container.querySelector('.hole-walk-slide') as HTMLElement);
    expect(f.open).not.toHaveBeenCalled();
    view.rerender(<QueryClientProvider client={cache}><HoleWalk available holes={[hole]} rows={[{ ...row, duration_seconds: 42 }]} totalMedia={1} onAddFirst={() => {}} /></QueryClientProvider>);
    expect(view.container.querySelector('.hole-media-processing')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Play video' })).toBeNull();
    fireEvent.click(view.container.querySelector('.hole-walk-slide') as HTMLElement);
    await waitFor(() => expect(f.open).toHaveBeenCalledTimes(1));
    const args = f.open.mock.calls[0][0] as { posts: Array<{ mediaItems: Array<{ type: string }> }>; options?: { readOnly?: boolean } };
    expect(args.posts).toHaveLength(1);
    expect(args.posts[0].mediaItems[0].type).toBe('video');
    expect(args.options).toEqual({ readOnly: true, syntheticPosts: true });
  });
});