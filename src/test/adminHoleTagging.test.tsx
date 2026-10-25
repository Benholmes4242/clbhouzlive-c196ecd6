import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, renderHook, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
const f = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), single: vi.fn(), user: { id: 'admin' } as { id: string } | null, own: false, memberSubmit: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc, from: f.from } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: f.user }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ isSuccess: true, data: { available: true, total_rounds: 0, holes: [] } }) }));
vi.mock('@/components/course-media-tab/hooks/useHolePhotoTagging', () => ({ useHolePhotoTagging: () => ({ ready: true, own: { data: [] }, sources: { data: f.own ? [{ url: '/own.jpg', createdAt: '2026-10-01', mediaType: 'image' }] : [], isSuccess: true }, tags: { data: [], isSuccess: true }, taggedUrls: new Set(), submit: { reset: vi.fn(), mutateAsync: f.memberSubmit } }) }));
vi.mock('@/components/course-media-tab/hooks/useCourseMedia', () => ({ useCourseMedia: () => ({ posts: [], postsForFullscreen: [], mediaCounts: { total: 0, photos: 0, videos: 0 }, countsReady: true }) }));
vi.mock('@/uploads/hooks/useMediaUpload', () => ({ useMediaUpload: () => ({ upload: vi.fn() }) }));
vi.mock('@/components/course-media-tab/CourseMediaCanonGrid', () => ({ CourseMediaCanonGrid: () => null }));
vi.mock('@/components/course-media-tab/CourseMediaHeader', () => ({ CourseMediaHeader: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAdminUntaggedCourseMedia, type AdminUntaggedMedia } from '@/hooks/useAdminUntaggedCourseMedia';
import { AdminHoleTagging, adminBatchPhotos, tagAdminHole } from '@/components/course-media-tab/AdminHoleTagging';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
const row = (id: string, date: string, owner = 'Thomas Holmes'): AdminUntaggedMedia => ({ media_id: id, media_url: `/${id}.jpg`, created_at: date, owner_name: owner, owner_id: 'member', source: 'post', media_type: 'image', stream_id: '', poster_url: '', duration_seconds: 0 });
let rows: AdminUntaggedMedia[];
beforeEach(() => {
  vi.clearAllMocks(); f.user = { id: 'admin' }; f.own = false;
  rows = [row('later', '2026-10-02T00:00:00Z'), row('earlier', '2026-09-01T00:00:00Z')];
  f.rpc.mockImplementation(async (name: string) => ({ data: name === 'is_admin' ? true : name === 'admin_get_untagged_course_media' ? rows : 'new-tag', error: null }));
  f.from.mockReturnValue(f); f.select.mockReturnValue(f); f.eq.mockReturnValue(f);
  f.single.mockResolvedValue({ data: { id: 'new-tag', user_id: 'member', hole_no: 7, status: 'approved' } as HolePhoto, error: null });
  f.memberSubmit.mockResolvedValue({ status: 'approved' });
});
afterEach(cleanup);
function setup() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter><QueryClientProvider client={cache}>{children}</QueryClientProvider></MemoryRouter>;
  return { cache, wrapper };
}
function mount(holes: number[] | null = [4, 7]) {
  const { cache, wrapper } = setup(); const invalidate = vi.spyOn(cache, 'invalidateQueries');
  return { ...render(<AdminHoleTagging courseId="course" knownHoles={holes} />, { wrapper }), cache, invalidate };
}
describe('admin privilege and queue reads', () => {
  it('signed-out admin check is false and does not call the RPC', () => {
    f.user = null; const { wrapper } = setup(); const { result } = renderHook(useIsAdmin, { wrapper });
    expect(result.current).toBe(false); expect(f.rpc).not.toHaveBeenCalled();
  });
  it('loading is false and settled true is scoped by user with ten-minute stale time', async () => {
    const { wrapper, cache } = setup(); const { result } = renderHook(useIsAdmin, { wrapper }); expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true)); expect(f.rpc).toHaveBeenCalledWith('is_admin');
    expect(cache.getQueryCache().find({ queryKey: ['is-admin', 'admin'] })?.options.staleTime).toBe(600000);
  });
  it('admin-check error returns false', async () => {
    f.rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    const { wrapper } = setup(); const { result } = renderHook(useIsAdmin, { wrapper });
    await waitFor(() => expect(f.rpc).toHaveBeenCalled()); expect(result.current).toBe(false);
  });
  it('disabled queue does not call admin media RPC', () => {
    const { wrapper } = setup(); renderHook(() => useAdminUntaggedCourseMedia('course', false), { wrapper }); expect(f.rpc).not.toHaveBeenCalled();
  });
  it('queue uses course-scoped key and exact RPC args', async () => {
    const { wrapper, cache } = setup(); const { result } = renderHook(() => useAdminUntaggedCourseMedia('course', true), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true)); expect(f.rpc).toHaveBeenCalledWith('admin_get_untagged_course_media', { p_course_id: 'course' });
    expect(cache.getQueryData(['admin-untagged-course-media', 'course'])).toEqual(rows);
  });
});
describe('admin block and batch', () => {
  it('non-admin sees no block and no admin media read', async () => {
    f.rpc.mockResolvedValue({ data: false, error: null }); mount();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('is_admin')); expect(screen.queryByText('Admin')).toBeNull();
    expect(f.rpc).not.toHaveBeenCalledWith('admin_get_untagged_course_media', expect.anything());
  });
  it('empty queue has no block', async () => {
    rows = []; mount(); await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('admin_get_untagged_course_media', expect.anything())); expect(screen.queryByText('Admin')).toBeNull();
  });
  it('no walk disables the admin queue and block', async () => {
    mount(null); await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('is_admin')); expect(screen.queryByText('Admin')).toBeNull(); expect(f.rpc).not.toHaveBeenCalledWith('admin_get_untagged_course_media', expect.anything());
  });
  it('admin block shows count, own attribution copy and Tag them', async () => {
    mount(); expect(await screen.findByRole('heading', { name: 'Two untagged shots here' })).toBeInTheDocument(); expect(screen.getByText("Each tag is saved as the member's own.")).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Tag them' })).toBeEnabled();
  });
  it('single item says shot', async () => { rows = [rows[0] as AdminUntaggedMedia]; mount(); expect(await screen.findByRole('heading', { name: 'One untagged shot here' })).toBeInTheDocument(); });
  it('opens oldest-first batch and active owner month', async () => {
    mount(); fireEvent.click(await screen.findByRole('button', { name: 'Tag them' }));
    expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/earlier.jpg'); expect(screen.getByText('Thomas Holmes · Sep 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Skip this one' })); expect(screen.getByText('Thomas Holmes · Oct 2026')).toBeInTheDocument();
  });
  it('empty owner name hides owner line', async () => {
    rows = [row('only', '2026-10-01', '')]; mount(); fireEvent.click(await screen.findByRole('button', { name: 'Tag them' })); expect(screen.queryByText(/Oct 2026/)).toBeNull();
  });
  it('video mapper preserves preview data and null EXIF', () => {
    const video = { ...rows[0], media_type: 'video', stream_id: 'stream', poster_url: '/poster.jpg', duration_seconds: 22 } as AdminUntaggedMedia;
    expect(adminBatchPhotos([video])[0]).toEqual(expect.objectContaining({ mediaId: 'later', mediaType: 'video', streamId: 'stream', posterUrl: '/poster.jpg', durationSeconds: 22, exif: { capturedAt: null, captureDay: null, latitude: null, longitude: null } }));
  });
  it('tag passes media id/hole, reads returned row and refreshes all required keys', async () => {
    const view = mount(); view.cache.setQueryData(['gam', 'get_latest_hole_media', { p_limit: 30 }], []);
    fireEvent.click(await screen.findByRole('button', { name: 'Tag them' })); fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    await waitFor(() => expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/later.jpg'));
    expect(f.rpc).toHaveBeenCalledWith('admin_tag_hole_media', { p_course_id: 'course', p_media_id: 'earlier', p_hole_no: 7 });
    expect(f.from).toHaveBeenCalledWith('course_hole_media'); expect(f.select).toHaveBeenCalledWith('*'); expect(f.eq).toHaveBeenCalledWith('id', 'new-tag');
    for (const queryKey of [['hole-photo-tags', 'course'], ['admin-untagged-course-media', 'course'], ['hole-media', 'course', 7]]) expect(view.invalidate).toHaveBeenCalledWith({ queryKey });
    expect(view.cache.getQueryState(['gam', 'get_latest_hole_media', { p_limit: 30 }])?.isInvalidated).toBe(true); expect(screen.getByRole('button', { name: 'Hole 4' })).toBeEnabled();
  });
  it('23505 displays message and advances without member mutation', async () => {
    const original = f.rpc.getMockImplementation(); f.rpc.mockImplementation((name: string, args: unknown) => name === 'admin_tag_hole_media' ? Promise.resolve({ data: null, error: { code: '23505' } }) : original?.(name, args));
    mount(); fireEvent.click(await screen.findByRole('button', { name: 'Tag them' })); fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    await waitFor(() => expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/later.jpg')); expect(screen.getByRole('alert')).toHaveTextContent('That shot is already tagged.'); expect(f.memberSubmit).not.toHaveBeenCalled();
  });
  it('other error keeps current shot and existing error handling', async () => {
    const original = f.rpc.getMockImplementation(); f.rpc.mockImplementation((name: string, args: unknown) => name === 'admin_tag_hole_media' ? Promise.resolve({ data: null, error: { code: '42501' } }) : original?.(name, args));
    mount(); fireEvent.click(await screen.findByRole('button', { name: 'Tag them' })); fireEvent.click(screen.getByRole('button', { name: 'Hole 4' })); await screen.findByRole('alert'); expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/earlier.jpg');
  });
  it('readback resolves member-owned row without client insert', async () => { const result = await tagAdminHole('course', 'earlier', 7); expect(result.user_id).toBe('member'); expect(result.id).toBe('new-tag'); });
  it('member own block stays before admin and uses unchanged member write', async () => {
    f.own = true; const { wrapper } = setup(); render(<CourseMediaTabNew courseId="course" />, { wrapper });
    const own = screen.getByRole('heading', { name: 'One of yours is untagged' }); const admin = await screen.findByRole('heading', { name: 'Two untagged shots here' }); expect(own.compareDocumentPosition(admin) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Tag them' })[0] as HTMLElement); await screen.findByRole('dialog'); fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    await waitFor(() => expect(f.memberSubmit).toHaveBeenCalled()); expect(f.memberSubmit).toHaveBeenCalledWith(expect.objectContaining({ hole: 7, post: expect.objectContaining({ userId: 'admin' }) })); expect(f.rpc).not.toHaveBeenCalledWith('admin_tag_hole_media', expect.anything());
  });
});