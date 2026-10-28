import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TusUploadOptions } from '@/uploads/tusVideoUpload';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';

const f = vi.hoisted(() => ({
  upload: vi.fn(), resilient: vi.fn(), poll: vi.fn(), insert: vi.fn(), tables: [] as string[], auth: vi.fn(), exif: vi.fn(),
  analysis: null as unknown, total: 0, holeTags: [] as unknown[], placeTags: [] as unknown[],
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/uploads/hooks/useMediaUpload', () => ({ useMediaUpload: () => ({ upload: f.upload }) }));
vi.mock('@/uploads/resilientVideoUpload', () => ({ uploadVideoResilient: f.resilient }));
vi.mock('@/utils/pollStreamMetadata', () => ({ pollStreamMetadata: f.poll }));
vi.mock('@/lib/courseMedia/holePhotoExif', () => ({ readHolePhotoExif: f.exif }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(), auth: { getUser: f.auth }, from: (table: string) => { f.tables.push(table); return { insert: f.insert }; } } }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ isSuccess: true, data: f.analysis }) }));
vi.mock('@/components/course-media-tab/hooks/useHolePhotoTagging', () => ({ useHolePhotoTagging: () => ({ ready: true, own: { data: [] }, sources: { data: [], isSuccess: true }, tags: { data: f.holeTags, isSuccess: true }, taggedUrls: new Set(), submit: { reset: vi.fn() } }) }));
vi.mock('@/components/course-media-tab/hooks/useCourseMedia', () => ({ useCourseMedia: () => ({ posts: [], postsForFullscreen: [], mediaCounts: { total: f.total, photos: f.total, videos: 0 }, countsReady: true, resetSeen: vi.fn() }) }));
vi.mock('@/components/course-media-tab/hooks/useCoursePlaceMedia', () => ({ placeMediaKey: (c: string, m?: string) => ['course-place-media', c, m], useCoursePlaceMedia: () => ({ tags: { data: f.placeTags, isSuccess: true } }) }));
vi.mock('@/components/course-media-tab/HoleWalk', () => ({ HoleWalk: () => null }));
vi.mock('@/components/course-media-tab/CourseMediaCanonGrid', () => ({ CourseMediaCanonGrid: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));

import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';

const sid = 'b'.repeat(32);
const hole = (n: number): CourseHole => ({ hole_no: n, par: 4, yards: 400, stroke_index: 1, avg_to_par: 1, avg_gross: 5, rounds: 10, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 5, bogey: 5, double: 0 } });
const withHoles = { available: true, total_rounds: 10, holes: [hole(7)] };
const noHoles = { available: false, total_rounds: 0, holes: [] };
const primary = () => document.querySelector<HTMLButtonElement>('[data-tag-primary]');
beforeEach(() => {
  vi.clearAllMocks(); f.tables = []; f.analysis = withHoles; f.total = 0; f.holeTags = []; f.placeTags = [];
  f.auth.mockResolvedValue({ data: { user: { id: 'member' } }, error: null });
  f.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: 'row' }, error: null }) }) });
  f.exif.mockResolvedValue({ capturedAt: null, captureDay: null, latitude: null, longitude: null });
  f.upload.mockResolvedValue({ success: true, mediaUrl: '/r2.jpg' });
  f.poll.mockReturnValue(new Promise(() => {}));
  f.resilient.mockImplementation(async (options: TusUploadOptions) => { options.onSuccess(sid); });
});
afterEach(cleanup);
function mount() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(cache, 'invalidateQueries');
  const view = render(<MemoryRouter><QueryClientProvider client={cache}><CourseMediaTabNew courseId="course" courseName="Hollow Down" /></QueryClientProvider></MemoryRouter>);
  return { ...view, invalidate };
}
function pick(file: File) {
  fireEvent.click(screen.getByRole('button', { name: 'Add a photo or video' }));
  const input = document.querySelector<HTMLInputElement>('input[data-add-shot-input]');
  if (!input) throw new Error('Library input missing');
  fireEvent.change(input, { target: { files: [file] } });
}
const image = () => new File(['photo'], 'p.jpg', { type: 'image/jpeg' });

describe('Media header line', () => {
  it.each([
    ['tagged', () => { f.total = 2; f.holeTags = [{ status: 'approved', hole_no: 7, user_id: 'x' }]; }],
    ['nothing tagged', () => { f.total = 2; }],
    ['no shots', () => {}],
    ['no rounds', () => { f.analysis = noHoles; }],
  ])('title is the same in the %s state', (_name, arrange) => {
    arrange(); const view = mount();
    expect(view.container.querySelector('.media-v2-top h2')?.textContent).toBe("How it really looks, from the golfers who've played it");
  });
  it('sub-line shows only with approved tags', () => {
    f.total = 2; const untagged = mount(); expect(untagged.container.querySelector('.media-v2-top p')).toBeNull(); untagged.unmount();
    f.placeTags = [{ id: 'p', place: 'views', status: 'approved', added_at: '2026-10-01', media_type: 'image', media_url: '/a.jpg', user_id: 'x' }];
    const tagged = mount(); expect(tagged.container.querySelector('.media-v2-top p')).not.toBeNull();
  });
  it('no shots shows the card and no Everything section', () => {
    const view = mount();
    expect(view.container.querySelector('[data-media-no-shots]')).not.toBeNull();
    expect(view.container.querySelector('[data-media-everything]')).toBeNull();
  });
});

describe('Add a photo or video flow', () => {
  it('picking a file opens the tag card without uploading', () => {
    mount(); pick(image());
    expect(primary()).not.toBeNull(); expect(document.querySelector('[data-tag-position]')).toBeNull();
    expect(f.upload).not.toHaveBeenCalled(); expect(f.resilient).not.toHaveBeenCalled(); expect(f.insert).not.toHaveBeenCalled();
  });
  it('Cancel closes the card and uploads nothing', () => {
    mount(); pick(image()); fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(primary()).toBeNull(); expect(f.upload).not.toHaveBeenCalled(); expect(f.insert).not.toHaveBeenCalled();
  });
  it('a hole confirm uses the existing hole library submit', async () => {
    mount(); const file = image(); pick(file);
    expect(screen.getByRole('button', { name: 'Hole 7' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' })); fireEvent.click(primary() as HTMLButtonElement);
    await waitFor(() => expect(f.insert).toHaveBeenCalled());
    expect(f.upload).toHaveBeenCalledWith(file, { bucketType: 'clbhouz-course-images', destination: 'r2' });
    expect(f.tables).toEqual(['course_hole_media']);
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ hole_no: 7, media_url: '/r2.jpg', file_name: 'p.jpg', user_id: 'member', course_id: 'course' }));
  });
  it('a place confirm uploads, then inserts into course_place_media with the media fields', async () => {
    mount(); pick(image()); fireEvent.click(screen.getByRole('button', { name: 'Views' })); fireEvent.click(primary() as HTMLButtonElement);
    await waitFor(() => expect(f.insert).toHaveBeenCalled());
    expect(f.upload.mock.invocationCallOrder[0]).toBeLessThan(f.insert.mock.invocationCallOrder[0]);
    expect(f.tables).toEqual(['course_place_media']);
    expect(f.insert).toHaveBeenCalledWith({ course_id: 'course', user_id: 'member', place: 'views', status: 'approved', media_type: 'image', media_url: '/r2.jpg', file_name: 'p.jpg', width: null, height: null });
  });
  it('a video place inserts Stream fields and the poll refreshes place media', async () => {
    let finish: (() => void) | undefined; f.poll.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const view = mount(); pick(new File(['v'], 'v.mp4', { type: 'video/mp4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clubhouse' })); fireEvent.click(primary() as HTMLButtonElement);
    await waitFor(() => expect(primary()).toBeNull());
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ place: 'clubhouse', media_type: 'video', stream_id: sid, media_url: generateStreamHlsUrl(sid), poster_url: generateStreamThumbnailUrl(sid), duration_seconds: null, file_name: 'v.mp4' }));
    expect(f.poll).toHaveBeenCalledWith(sid);
    const before = view.invalidate.mock.calls.length; finish?.();
    await waitFor(() => expect(view.invalidate.mock.calls.length).toBe(before + 1));
    expect(view.invalidate).toHaveBeenLastCalledWith({ queryKey: ['course-place-media', 'course', 'member'] });
  });
  it('success invalidates hole-tag, place-media, count and feed keys', async () => {
    const view = mount(); pick(image()); fireEvent.click(screen.getByRole('button', { name: 'Views' })); fireEvent.click(primary() as HTMLButtonElement);
    await waitFor(() => expect(primary()).toBeNull());
    for (const queryKey of [['hole-photo-tags', 'course', 'member'], ['course-place-media', 'course', 'member'], ['course-media-counts', 'course'], ['course-media-feed', 'course']]) expect(view.invalidate).toHaveBeenCalledWith({ queryKey });
  });
  it('no hole list means no hole section in the tagger', () => {
    f.analysis = noHoles; mount(); pick(image());
    expect(primary()).not.toBeNull(); expect(document.querySelector('[data-tag-holes]')).toBeNull();
  });
});
