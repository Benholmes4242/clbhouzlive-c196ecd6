import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';

const f = vi.hoisted(() => ({ insert: vi.fn(), eq: vi.fn(), or: vi.fn(), limit: vi.fn(), from: vi.fn(), rpc: vi.fn(), invoke: vi.fn(), matched: vi.fn(), exif: vi.fn(), analysis: { data: { available: true, holes: [{ hole_no: 9 }, { hole_no: 2 }] } }, rounds: [] as any[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: f.from, rpc: f.rpc, functions: { invoke: f.invoke } } }));
vi.mock('@/lib/courseMedia/holePhotoExif', () => ({ readHolePhotoExif: f.exif }));
vi.mock('@/lib/courseMedia/holePhotoData', () => ({ matchedPhotoRounds: f.matched, prepareHolePhoto: vi.fn(), spellPhotoCount: (n: number) => ['zero', 'one', 'two', 'three'][n] ?? String(n), capitalPhotoCount: (n: number) => ['Zero', 'One', 'Two', 'Three'][n] ?? String(n) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => f.analysis }));
vi.mock('@/hooks/feed/useMyRoundsAtCourse', async importOriginal => ({ ...await importOriginal<typeof import('@/hooks/feed/useMyRoundsAtCourse')>(), useMyRoundsAtCourse: () => ({ data: f.rounds, isSuccess: true }) }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/uploads/resilientVideoUpload', () => ({ uploadVideoResilient: vi.fn() }));

import { ReviewHoleTags } from '@/features/review-v2/components/ReviewHoleTags';
import { A } from '@/features/courses/components/holes/analytical/tokens';

import { useReviewHoleTags } from '@/features/review-v2/hooks/useReviewHoleTags';
import { writeComposerHolePhoto, composerPhotoVerdict, type ComposerHoleJob } from '@/lib/courseMedia/composerHolePhotos';
import { uploadAndPublishReview, startReviewUpload } from '@/features/review-v2/lib/reviewUploadController';
import { useReviewMediaPipeline } from '@/features/review-v2/hooks/useReviewMediaPipeline';
import { uploadVideoResilient } from '@/uploads/resilientVideoUpload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import type { MediaItem } from '@/features/review-v2/types';

const exif = { captureDay: '2026-06-02', capturedAt: '2026-06-02T12:00:00', latitude: null, longitude: null };
const photo: MediaItem = { id: 'p', type: 'image', previewUrl: '/photo.jpg', status: 'pending', progress: 0, file: new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }) };
const video: MediaItem = { id: 'v', type: 'video', previewUrl: '/clip.mp4', posterUrl: '/poster.jpg', streamId: 'stream-1', durationSeconds: 75, status: 'pending', progress: 0, file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }) };
const job: ComposerHoleJob = { courseId: 'course', assignments: { p: 2 }, knownHoles: [2, 9], proofScoreId: null };
const props = (overrides: Record<string, unknown> = {}) => ({ holes: [2, 9], shots: [photo], rounds: [], chosenRound: null, chooseRound: vi.fn(), assignments: {}, assign: vi.fn(), unassign: vi.fn(), metadata: {}, capture: () => job, ...overrides } as ReturnType<typeof useReviewHoleTags>);
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;

beforeEach(() => {
  cleanup(); vi.clearAllMocks();
  f.exif.mockResolvedValue(exif); f.matched.mockResolvedValue([]);
  f.insert.mockResolvedValue({ error: null });
  f.limit.mockResolvedValue({ data: [], error: null });
  const chain: any = { select: () => chain, eq: f.eq, or: f.or, limit: f.limit, insert: f.insert, update: () => chain };
  f.eq.mockReturnValue(chain); f.or.mockReturnValue(chain); f.from.mockReturnValue(chain);
  f.analysis.data = { available: true, holes: [{ hole_no: 9 }, { hole_no: 2 }] }; f.rounds = [];
});

describe('COMPOSER_HOLES_1 optional assignments', () => {
  it('unavailable analysis creates no tagging section', () => {
    render(<ReviewHoleTags {...props({ holes: [] })} />);
    expect(screen.queryByRole('region')).toBeNull(); expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
  it('a video-only review shows the section with Video 1', () => {
    render(<ReviewHoleTags {...props({ shots: [video] })} />);
    expect(screen.getByRole('region', { name: 'Holes for your photos and videos' })).toBeInTheDocument();
    expect(screen.getByText('Video 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tag video 1' })).toBeInTheDocument();
  });
  it('photos and videos number separately with their own aria-labels', () => {
    render(<ReviewHoleTags {...props({ shots: [photo, video, { ...photo, id: 'q' }] })} />);
    expect(screen.getByRole('button', { name: 'Tag photo 1' })).toHaveTextContent('Photo 1');
    expect(screen.getByRole('button', { name: 'Tag video 1' })).toHaveTextContent('Video 1');
    expect(screen.getByRole('button', { name: 'Tag photo 2' })).toHaveTextContent('Photo 2');
    expect(screen.getByRole('button', { name: 'Tag video 1' }).querySelector('img')).toHaveAttribute('src', '/poster.jpg');
    expect(screen.getByRole('button', { name: 'Tag video 1' })).toHaveTextContent('1:15');
    expect(screen.getByRole('button', { name: 'Tag photo 1' })).toHaveTextContent('No date on file');
  });
  it('the video hero plays inline with its poster and duration badge, never a Taken chip', () => {
    render(<ReviewHoleTags {...props({ shots: [video] })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag video 1' }));
    const sheet = screen.getByRole('dialog');
    const heroVideo = sheet.querySelector('video');
    expect(heroVideo).not.toBeNull();
    expect(heroVideo).toHaveAttribute('src', '/clip.mp4');
    expect(heroVideo).toHaveAttribute('poster', '/poster.jpg');
    expect(heroVideo).toHaveProperty('muted', true);
    expect(heroVideo).toHaveAttribute('autoplay');
    expect(heroVideo).toHaveAttribute('loop');
    expect(heroVideo).toHaveAttribute('playsinline');
    expect(sheet.querySelector('img[alt="Your video"]')).toBeNull();
    expect(sheet).toHaveTextContent('1:15');
    expect(sheet.textContent).not.toMatch(/Taken|No date/);
  });
  it('nine actual holes yield nine selectable chips without padding', () => {
    render(<ReviewHoleTags {...props({ holes: [1,2,3,4,5,6,7,8,9] })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    expect(screen.getAllByRole('button', { name: /^Hole / })).toHaveLength(9);
    expect(screen.queryByRole('button', { name: 'Hole 10' })).toBeNull();
  });
  it('a lower already-used hole stays selectable and a selection only highlights it', () => {
    const assign = vi.fn(); render(<ReviewHoleTags {...props({ assign })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    expect(screen.getByRole('button', { name: 'Hole 9' })).toHaveAttribute('data-state', 'open');
    expect(screen.getByRole('button', { name: 'Hole 2' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' }));
    expect(screen.getByRole('button', { name: 'Hole 2' })).toHaveAttribute('aria-pressed', 'true');
    expect(assign).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });
  it('tapping the selected hole again deselects it and disables Confirm tag; a different tap moves the selection', () => {
    render(<ReviewHoleTags {...props({})} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' }));
    expect(screen.getByRole('button', { name: 'Hole 2' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' }));
    expect(screen.getByRole('button', { name: 'Hole 2' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Confirm tag' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Hole 9' }));
    expect(screen.getByRole('button', { name: 'Hole 9' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Hole 2' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Confirm tag' })).toBeEnabled();
  });
  it('two photographs can choose the same used hole', () => {
    const assign = vi.fn(); render(<ReviewHoleTags {...props({ shots: [photo, { ...photo, id: 'q' }], assignments: { p: 2 }, assign })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm tag' }));
    expect(assign).toHaveBeenCalledWith('q', 2);
  });
  it('a used hole renders exactly like every other hole in the grid', () => {
    render(<ReviewHoleTags {...props({ shots: [photo, { ...photo, id: 'q' }], assignments: { p: 9 } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 2' }));
    const buttons = screen.getAllByRole('button', { name: /^Hole / });
    expect(buttons).toHaveLength(2);
    expect(new Set(buttons.map(btn => btn.style.border)).size).toBe(1);
    expect(new Set(buttons.map(btn => btn.style.color)).size).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 9' }));
    expect(screen.getByRole('button', { name: 'Hole 9' })).toHaveStyle({ background: A.INK, color: A.CANVAS });
  });
  it('the sheet never prints the green-hole explanation', () => {
    render(<ReviewHoleTags {...props({ shots: [photo, { ...photo, id: 'q' }], assignments: { p: 9 } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).not.toMatch(/green/i);
    expect(dialog.textContent).not.toMatch(/already used/i);
    expect(screen.queryByText(/because you have already used/)).toBeNull();
  });

  it('Confirm tag assigns and advances to the next untagged shot', () => {
    const assign = vi.fn();
    render(<ReviewHoleTags {...props({ shots: [photo, video, { ...photo, id: 'q' }], assignments: { v: 2 }, assign })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm tag' }));
    expect(assign).toHaveBeenCalledWith('p', 2);
    const sheet = screen.getByRole('dialog');
    expect(sheet).toHaveTextContent('Photo tagged to the 2nd.');
    expect(sheet.querySelector('[data-chip]')).toHaveTextContent('3 / 3');
    expect(screen.getByRole('button', { name: 'Confirm tag' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hole 9' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('tapping a tagged thumbnail shows Remove tag and dims the other holes', () => {
    render(<ReviewHoleTags {...props({ shots: [photo, video], assignments: { v: 2 } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Shot 2 of 2, tagged to the 2nd' }));
    expect(screen.getByRole('button', { name: 'Remove tag' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Hole 2' })).toHaveStyle({ background: A.INK });
    expect(screen.getByRole('button', { name: 'Hole 9' })).toHaveStyle({ opacity: '0.4' });
  });
  it('Remove tag clears the assignment and re-enables the grid', () => {
    const unassign = vi.fn();
    render(<ReviewHoleTags {...props({ shots: [photo, { ...photo, id: 'q' }], assignments: { p: 9 }, unassign })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Shot 1 of 2, tagged to the 9th' }));
    expect(screen.getByRole('button', { name: 'Remove tag' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove tag' }));
    expect(unassign).toHaveBeenCalledWith('p');
    expect(screen.getByRole('dialog')).toHaveTextContent('Tag removed. Pick the right hole.');
    expect(screen.getByRole('button', { name: 'Hole 9' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Confirm tag' })).toBeDisabled();
  });
  it('with every shot tagged a row open shows the tagged state with Remove tag', () => {
    render(<ReviewHoleTags {...props({ shots: [photo, video], assignments: { p: 9, v: 2 } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    expect(screen.getByRole('button', { name: 'Remove tag' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Hole 9' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Hole 2' })).toHaveStyle({ opacity: '0.4' });
  });
  it('confirming the last tagged shot reads All tagged and is disabled', () => {
    const assignments: Record<string, number> = { p: 2 };
    const assign = vi.fn((id: string, hole: number) => { assignments[id] = hole; });
    render(<ReviewHoleTags {...props({ shots: [photo, video], assignments, assign })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag video 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm tag' }));
    expect(assign).toHaveBeenCalledWith('v', 2);
    expect(screen.getByRole('button', { name: 'All tagged' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hole 2' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('opening a row on a tagged shot enters the tagged state; an untagged row starts fresh', () => {
    render(<ReviewHoleTags {...props({ shots: [photo, { ...photo, id: 'q' }], holes: [7, 9], assignments: { p: 7 } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    expect(screen.getByText('Tagged to the 7th. Remove the tag to choose a different hole.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove tag' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Hole 7' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Hole 9' })).toHaveStyle({ opacity: '0.4' });
    cleanup();
    render(<ReviewHoleTags {...props({ shots: [photo, { ...photo, id: 'q' }], holes: [7, 9] })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    expect(screen.queryByRole('button', { name: 'Remove tag' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Confirm tag' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hole 7' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Hole 9' })).not.toHaveStyle({ opacity: '0.4' });
  });
  it('the sheet body clears the home indicator and wears the Media tab theme', () => {
    render(<ReviewHoleTags {...props({})} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    const sheet = screen.getByRole('dialog') as HTMLElement;
    const body = sheet.querySelector('[data-sheet-body]') as HTMLElement;
    expect(body).toHaveStyle({ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' });
    expect(body).toHaveStyle({ paddingTop: '10px' });
    expect(sheet.style.getPropertyValue('--hole-walk-ink')).toBe(A.INK);
    expect(sheet.style.getPropertyValue('--hole-photo-success')).toBe(A.IMPROVED);
  });

  it('assignments are client-only until capture, exclude removed files and include tagged videos', async () => {
    const { result, rerender } = renderHook(({ items }) => useReviewHoleTags('course', 'member', items), { initialProps: { items: [photo, video] }, wrapper });
    act(() => { result.current.assign('p', 9); result.current.assign('v', 2); });
    expect(f.insert).not.toHaveBeenCalled(); expect(result.current.capture()?.assignments).toEqual({ p: 9, v: 2 });
    rerender({ items: [photo] }); expect(result.current.capture()?.assignments).toEqual({ p: 9 });
    rerender({ items: [] }); expect(result.current.capture()?.assignments).toEqual({});
  });
  it('a five-month-old round is not preselected', async () => {
    f.rounds = [{ whsScoreId: 'old', playDate: '2026-05-01', grossScore: 82, teeMarker: null }];
    const { result } = renderHook(() => useReviewHoleTags('course', 'member', [photo]), { wrapper });
    await waitFor(() => expect(result.current.rounds).toHaveLength(1)); expect(result.current.chosenRound).toBeNull();
  });
  it('a today round is preselected using the existing helper and captured as proof', async () => {
    const d = new Date(); const day = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    f.rounds = [{ whsScoreId: 'today', playDate: day, grossScore: 82, teeMarker: null }];
    const { result } = renderHook(() => useReviewHoleTags('course', 'member', [photo]), { wrapper });
    await waitFor(() => expect(result.current.chosenRound?.whsScoreId).toBe('today'));
    expect(result.current.capture()?.proofScoreId).toBe('today');
  });
});

describe('COMPOSER_HOLES_1_R2 independent job writes', () => {
  it('chosen proof approves without EXIF and without a round-match query', async () => {
    const verdict = await composerPhotoVerdict({ ...exif, captureDay: null }, 'member', 'course', 'chosen');
    expect(verdict.status).toBe('approved'); expect(verdict.proof_score_id).toBe('chosen'); expect(f.matched).not.toHaveBeenCalled();
  });
  it('unchosen proof uses the existing EXIF match', async () => {
    f.matched.mockResolvedValue([{ id: 'nine-round', userId: 'member', golfCourseId: 'course', playDate: '2026-06-02' }]);
    const verdict = await composerPhotoVerdict(exif, 'member', 'course', null);
    expect(f.matched).not.toHaveBeenCalled(); expect(verdict.proof_score_id).toBeNull(); expect(verdict.status).toBe('approved');
  });
  it('missing date and no chosen proof queues', async () => {
    const verdict = await composerPhotoVerdict({ ...exif, captureDay: null }, 'member', 'course', null);
    expect(verdict.status).toBe('approved'); expect(verdict.proof_score_id).toBeNull();
  });
  it('writes uploaded URL and chosen proof without any review-media identifier', async () => {
    await writeComposerHolePhoto({ ...job, proofScoreId: 'chosen' }, 'member', photo, 'https://example.test/p.jpg');
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ course_id: 'course', hole_no: 2, user_id: 'member', media_url: 'https://example.test/p.jpg', proof_score_id: 'chosen' }));
    expect(f.from.mock.calls.every(([table]) => table === 'course_hole_media')).toBe(true);
  });
  it('untagged photographs and videos never write hole rows', async () => {
    await writeComposerHolePhoto(job, 'member', { ...photo, id: 'untagged' }, 'url');
    await writeComposerHolePhoto(job, 'member', { ...video, id: 'untagged-v' }, 'url'); expect(f.from).not.toHaveBeenCalled();
  });
  it('a tagged video writes one row with stream fields from the item', async () => {
    await writeComposerHolePhoto({ ...job, assignments: { v: 9 } }, 'member', video, generateStreamHlsUrl('stream-1'));
    expect(f.insert).toHaveBeenCalledTimes(1);
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({
      course_id: 'course', hole_no: 9, user_id: 'member', media_type: 'video', stream_id: 'stream-1',
      media_url: generateStreamHlsUrl('stream-1'), poster_url: '/poster.jpg', duration_seconds: 75,
    }));
    expect(f.exif).not.toHaveBeenCalled();
  });
  it('a tagged video with no streamId writes nothing', async () => {
    await writeComposerHolePhoto({ ...job, assignments: { v: 9 } }, 'member', { ...video, streamId: null }, 'url');
    expect(f.from).not.toHaveBeenCalled();
  });
  it('the duplicate check matches on stream_id', async () => {
    f.limit.mockResolvedValueOnce({ data: [{ id: 'dup' }], error: null });
    await writeComposerHolePhoto({ ...job, assignments: { v: 9 } }, 'member', video, generateStreamHlsUrl('stream-1'));
    expect(f.or).toHaveBeenCalledWith(`media_url.eq.${generateStreamHlsUrl('stream-1')},stream_id.eq.stream-1`);
    expect(f.insert).not.toHaveBeenCalled();
  });
  it('hole insert rejection is swallowed and does not reject the job', async () => {
    f.insert.mockRejectedValue(new Error('refused')); await expect(writeComposerHolePhoto(job, 'member', photo, 'url')).resolves.toBeUndefined();
  });
  it('review publication failure still leaves a per-item hole write', async () => {
    f.invoke.mockResolvedValue({ data: { success: true, publicUrl: 'https://example.test/p.jpg' }, error: null });
    f.rpc.mockResolvedValue({ error: { code: '02000', message: 'superseded' } });
    const outcome = await uploadAndPublishReview('test-independent', 'member', 'pending', [{ id: 'p', type: 'image', file: photo.file as File }], undefined, job);
    expect(outcome.ok).toBe(false); await waitFor(() => expect(f.insert).toHaveBeenCalled());
  });
  it('failed hole insertion does not affect successful review publication', async () => {
    f.invoke.mockResolvedValue({ data: { success: true, publicUrl: 'https://example.test/p.jpg' }, error: null });
    f.rpc.mockResolvedValue({ data: 'rating', error: null }); f.insert.mockRejectedValue(new Error('refused'));
    const outcome = await uploadAndPublishReview('test-tag-failed', 'member', 'pending', [{ id: 'p', type: 'image', file: photo.file as File }], undefined, job);
    expect(outcome).toEqual({ ok: true, ratingId: 'rating' });
  });
  it('joining a running tile upload retains newly captured hole assignments', async () => {
    let finish: (value: unknown) => void = () => {};
    f.invoke.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const inputs = [{ id: 'p', type: 'image' as const, file: photo.file as File }];
    const first = startReviewUpload('join-tags', 'member', inputs);
    const joined = startReviewUpload('join-tags', 'member', inputs, job);
    expect(joined).toBe(first);
    finish({ data: { success: true, publicUrl: 'https://example.test/p.jpg' }, error: null });
    await joined; await waitFor(() => expect(f.insert).toHaveBeenCalled());
    expect(f.invoke).toHaveBeenCalledTimes(1);
  });
  it('the upload controller passes a video through with its stream id and poster', async () => {
    vi.mocked(uploadVideoResilient).mockImplementation((opts: any) => { opts.onSuccess('stream-1'); return Promise.resolve({} as Awaited<ReturnType<typeof uploadVideoResilient>>); });
    f.rpc.mockResolvedValue({ data: 'rating', error: null });
    const outcome = await uploadAndPublishReview('video-tags', 'member', 'pending', [{ id: 'v', type: 'video', file: video.file as File, durationSeconds: 75 }], undefined, { ...job, assignments: { v: 9 } });
    expect(outcome.ok).toBe(true);
    await waitFor(() => expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ media_type: 'video', stream_id: 'stream-1', hole_no: 9, duration_seconds: 75 })));
  });
  it('the media pipeline passes a video through with its stream id and poster', async () => {
    const { result } = renderHook(() => useReviewMediaPipeline({ userId: 'member', existingMedia: [{ id: 'm1', media_url: generateStreamHlsUrl('stream-1'), media_type: 'video', poster_url: '/poster.jpg', stream_id: 'stream-1' }] }), { wrapper });
    act(() => result.current.writeUploadedHolePhotos({ ...job, assignments: { 'existing-m1': 2 } }));
    await waitFor(() => expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ media_type: 'video', stream_id: 'stream-1', hole_no: 2, poster_url: '/poster.jpg' })));
  });
});