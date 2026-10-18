import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';

const f = vi.hoisted(() => ({ insert: vi.fn(), eq: vi.fn(), from: vi.fn(), rpc: vi.fn(), invoke: vi.fn(), matched: vi.fn(), exif: vi.fn(), analysis: { data: { available: true, holes: [{ hole_no: 9 }, { hole_no: 2 }] } }, rounds: [] as any[] }));
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
import { useReviewHoleTags } from '@/features/review-v2/hooks/useReviewHoleTags';
import { writeComposerHolePhoto, composerPhotoVerdict, composerVerdictSentence, type ComposerHoleJob } from '@/lib/courseMedia/composerHolePhotos';
import { uploadAndPublishReview } from '@/features/review-v2/lib/reviewUploadController';
import type { MediaItem } from '@/features/review-v2/types';

const exif = { captureDay: '2026-06-02', capturedAt: '2026-06-02T12:00:00', latitude: null, longitude: null };
const photo: MediaItem = { id: 'p', type: 'image', previewUrl: '/photo.jpg', status: 'pending', progress: 0, file: new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }) };
const job: ComposerHoleJob = { courseId: 'course', assignments: { p: 2 }, knownHoles: [2, 9], proofScoreId: null };
const props = (overrides: Record<string, unknown> = {}) => ({ holes: [2, 9], photos: [photo], rounds: [], chosenRound: null, chooseRound: vi.fn(), assignments: {}, assign: vi.fn(), metadata: {}, capture: () => job, ...overrides } as ReturnType<typeof useReviewHoleTags>);
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;

beforeEach(() => {
  cleanup(); vi.clearAllMocks();
  f.exif.mockResolvedValue(exif); f.matched.mockResolvedValue([]);
  f.insert.mockResolvedValue({ error: null });
  const chain: any = { select: () => chain, eq: f.eq, limit: () => Promise.resolve({ data: [], error: null }), insert: f.insert, update: () => chain };
  f.eq.mockReturnValue(chain); f.from.mockReturnValue(chain);
  f.analysis.data = { available: true, holes: [{ hole_no: 9 }, { hole_no: 2 }] }; f.rounds = [];
});

describe('COMPOSER_HOLES_1 optional assignments', () => {
  it('unavailable analysis creates no tagging section', () => {
    render(<ReviewHoleTags {...props({ holes: [] })} />);
    expect(screen.queryByRole('region')).toBeNull(); expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
  it('video-only reviews create no tagging section', () => {
    render(<ReviewHoleTags {...props({ photos: [] })} />); expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
  it('nine actual holes yield nine selectable chips without padding', () => {
    render(<ReviewHoleTags {...props({ holes: [1,2,3,4,5,6,7,8,9] })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    expect(screen.getAllByRole('button', { name: /^Hole / })).toHaveLength(9);
    expect(screen.queryByRole('button', { name: 'Hole 10' })).toBeNull();
  });
  it('a lower already-used hole remains selectable and closes immediately', () => {
    const assign = vi.fn(); render(<ReviewHoleTags {...props({ assignments: { p: 9 }, assign })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 1' }));
    expect(screen.getByRole('button', { name: 'Hole 9' })).toHaveAttribute('data-state', 'used');
    expect(screen.getByRole('button', { name: 'Hole 2' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' }));
    expect(assign).toHaveBeenCalledWith('p', 2); expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('two photographs can choose the same used hole', () => {
    const assign = vi.fn(); render(<ReviewHoleTags {...props({ photos: [photo, { ...photo, id: 'q' }], assignments: { p: 2 }, assign })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tag photo 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' })); expect(assign).toHaveBeenCalledWith('q', 2);
  });
  it('assignments are client-only until capture and exclude removed files and videos', async () => {
    const { result, rerender } = renderHook(({ items }) => useReviewHoleTags('course', 'member', items), { initialProps: { items: [photo] }, wrapper });
    act(() => result.current.assign('p', 9));
    expect(f.insert).not.toHaveBeenCalled(); expect(result.current.capture()?.assignments).toEqual({ p: 9 });
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
    expect(f.matched).toHaveBeenCalledWith('course', 'member', '2026-06-02'); expect(verdict.proof_score_id).toBe('nine-round');
  });
  it('missing date and no chosen proof queues', async () => {
    const verdict = await composerPhotoVerdict({ ...exif, captureDay: null }, 'member', 'course', null);
    expect(verdict.status).toBe('pending'); expect(verdict.proof_score_id).toBeNull();
  });
  it('writes uploaded URL and chosen proof without any review-media identifier', async () => {
    await writeComposerHolePhoto({ ...job, proofScoreId: 'chosen' }, 'member', photo, 'https://example.test/p.jpg');
    expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ course_id: 'course', hole_no: 2, user_id: 'member', media_url: 'https://example.test/p.jpg', proof_score_id: 'chosen' }));
    expect(f.from.mock.calls.every(([table]) => table === 'course_hole_media')).toBe(true);
  });
  it('untagged photographs and videos never write hole rows', async () => {
    await writeComposerHolePhoto(job, 'member', { ...photo, id: 'untagged' }, 'url');
    await writeComposerHolePhoto(job, 'member', { ...photo, type: 'video' }, 'url'); expect(f.from).not.toHaveBeenCalled();
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
});