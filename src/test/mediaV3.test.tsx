import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { PlaceMedia } from '@/components/course-media-tab/hooks/useCoursePlaceMedia';
const f = vi.hoisted(() => ({ rpc: vi.fn(), open: vi.fn(), filter: vi.fn(), counts: { total: 3, photos: 2, videos: 1 }, tagged: true, placeRead: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.open }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc, from: () => ({ select: () => ({ eq: () => ({ single: f.placeRead }) }) }) } }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => true }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ isSuccess: true, data: { available: true, total_rounds: 0, holes: [] } }) }));
vi.mock('@/uploads/hooks/useMediaUpload', () => ({ useMediaUpload: () => ({ upload: vi.fn() }) }));
vi.mock('@/components/course-media-tab/hooks/useCourseMedia', () => ({ useCourseMedia: (args: unknown) => { f.filter(args); return { posts: [], postsForFullscreen: [], mediaCounts: f.counts, countsReady: true, resetSeen: vi.fn() }; } }));
vi.mock('@/components/course-media-tab/hooks/useHolePhotoTagging', () => ({ useHolePhotoTagging: () => ({ ready: true, sources: { data: [], isSuccess: true }, tags: { isSuccess: true, data: f.tagged ? [{ status: 'approved', hole_no: 1 }] : [] }, taggedUrls: new Set(), submit: { reset: vi.fn() } }) }));
vi.mock('@/components/course-media-tab/hooks/useCoursePlaceMedia', () => ({ useCoursePlaceMedia: () => ({ tags: { isSuccess: true, data: f.tagged ? [{ id: 'p', place: 'views', status: 'approved', added_at: '2026-10-01', media_type: 'image', media_url: '/a.jpg' }] : [] } }) }));
vi.mock('@/components/course-media-tab/HoleWalk', () => ({ HoleWalk: () => f.tagged ? <div data-hole-rail /> : null }));
vi.mock('@/components/course-media-tab/CourseMediaCanonGrid', () => ({ CourseMediaCanonGrid: () => <div data-media-grid /> }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
import { HolePhotoTagDialog } from '@/components/course-media-tab/HolePhotoTagDialog';
import { HolePhotoBatchPath } from '@/components/course-media-tab/HolePhotoFastPaths';
import { AdminHoleTagging } from '@/components/course-media-tab/AdminHoleTagging';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import { CourseFirstPhotoPicker } from '@/components/course-media-tab/CourseMediaEmptyStates';

const photo = (url: string) => ({ url, createdAt: '2026-10-01', exif: { capturedAt: null, captureDay: null, latitude: null, longitude: null } });
const placeRow = { id: 'saved', place: 'views', course_id: 'course', user_id: 'owner', media_url: '/a.jpg', media_type: 'image' } as PlaceMedia;
const primary = () => { const node = document.querySelector<HTMLButtonElement>('[data-tag-primary]'); if (!node) throw new Error('Tag primary missing'); return node; };
function provider(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const view = render(<MemoryRouter><QueryClientProvider client={client}>{children}</QueryClientProvider></MemoryRouter>);
  return { ...view, client, invalidate };
}
beforeEach(() => { vi.clearAllMocks(); f.counts = { total: 3, photos: 2, videos: 1 }; f.tagged = true;
  f.rpc.mockImplementation(async (name: string) => ({ data: name === 'admin_get_untagged_course_media' ? [] : 'saved', error: null }));
  f.placeRead.mockResolvedValue({ data: placeRow, error: null });
});
afterEach(cleanup);
describe('Media v3 selection rules', () => {
  it('single has one selection across holes and places, and only submits on primary', () => {
    const hole = vi.fn(), place = vi.fn(); render(<HolePhotoTagDialog imageUrl="/a.jpg" holeCount={2} knownHoleNumbers={[1,2]} pending={false} error={null} onClose={() => {}} onSubmit={hole} onSubmitPlace={place} />);
    expect(primary()).toBeDisabled(); fireEvent.click(screen.getByRole('button', { name: 'Hole 2' }));
    expect(primary()).toBeEnabled(); fireEvent.click(screen.getByRole('button', { name: 'Views' }));
    expect(screen.getByRole('button', { name: 'Hole 2' })).toHaveAttribute('aria-pressed', 'false');
    expect(hole).not.toHaveBeenCalled(); expect(place).not.toHaveBeenCalled(); fireEvent.click(primary()); expect(place).toHaveBeenCalledWith('views');
    fireEvent.click(screen.getByRole('button', { name: 'Hole 1' })); expect(screen.getByRole('button', { name: 'Views' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(primary()); expect(hole).toHaveBeenCalledWith(1);
  });
  it('batch uses one selection and clears it when jumping to a fresh shot', () => {
    render(<HolePhotoBatchPath photos={[photo('/a.jpg'), photo('/b.jpg')]} knownHoles={[1]} onTag={vi.fn()} onTagPlace={vi.fn()} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Views' })); fireEvent.click(screen.getByRole('button', { name: 'Hole 1' }));
    expect(screen.getByRole('button', { name: 'Views' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Shot 2 of 2' })); expect(primary()).toBeDisabled();
  });
  it('single thumbnail opens canonical read-only viewer without saving', () => {
    const save = vi.fn(); render(<HolePhotoTagDialog imageUrl="/a.jpg" holeCount={0} knownHoleNumbers={[]} pending={false} error={null} onClose={() => {}} onSubmit={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'View shot' }));
    expect(f.open).toHaveBeenCalledWith(expect.objectContaining({ options: { readOnly: true, syntheticPosts: true }, mediaId: '/a.jpg' })); expect(save).not.toHaveBeenCalled();
  });
  it('no hole list renders place choices without a hole section', () => {
    render(<HolePhotoTagDialog imageUrl="/a.jpg" holeCount={0} knownHoleNumbers={[]} pending={false} error={null} onClose={() => {}} onSubmit={vi.fn()} />);
    expect(document.querySelector('[data-tag-holes]')).toBeNull(); expect(document.querySelectorAll('[data-place]')).toHaveLength(9);
  });
  it('single Skip saves nothing and closes', () => {
    const close = vi.fn(), save = vi.fn(); render(<HolePhotoTagDialog imageUrl="/a.jpg" holeCount={1} knownHoleNumbers={[1]} pending={false} error={null} onClose={close} onSubmit={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 1' })); fireEvent.click(screen.getByRole('button', { name: 'Skip' })); expect(close).toHaveBeenCalledOnce(); expect(save).not.toHaveBeenCalled();
  });
  it('batch Skip advances and closes after last without saving', () => {
    const close = vi.fn(), save = vi.fn(); render(<HolePhotoBatchPath photos={[photo('/a.jpg'),photo('/b.jpg')]} knownHoles={[1]} onClose={close} onTag={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' })); expect(screen.getByRole('button', { name: 'Shot 2 of 2' })).toHaveAttribute('aria-current', 'true'); expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' })); expect(close).toHaveBeenCalledOnce(); expect(save).not.toHaveBeenCalled();
  });
});
describe('Media v3 admin places', () => {
  async function admin() {
    f.rpc.mockImplementation(async (name: string) => ({ data: name === 'admin_get_untagged_course_media' ? [{ media_id: 'media-a', media_url: '/a.jpg', created_at: '2026-10-01', owner_name: 'Thomas Holmes', media_type: 'image' }, { media_id: 'media-b', media_url: '/b.jpg', created_at: '2026-10-02', owner_name: 'Ben', media_type: 'image' }] : 'saved', error: null }));
    const view = provider(<AdminHoleTagging courseId="course" knownHoles={null} />); fireEvent.click(await screen.findByRole('button', { name: 'Tag them' })); return view;
  }
  it('admin place tag passes media id/place and invalidates queue, place and hole keys', async () => {
    const view = await admin(); fireEvent.click(screen.getByRole('button', { name: 'Views' })); fireEvent.click(primary());
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('admin_tag_place_media', { p_course_id: 'course', p_media_id: 'media-a', p_place: 'views' }));
    await waitFor(() => expect(view.invalidate).toHaveBeenCalledWith({ queryKey: ['course-place-media','course'] }));
    expect(view.invalidate).toHaveBeenCalledWith({ queryKey: ['hole-photo-tags','course'] }); expect(view.invalidate).toHaveBeenCalledWith({ queryKey: ['admin-untagged-course-media','course'] });
  });
  it('admin place undo uses admin_untag_place_media and refreshes all three keys', async () => {
    const view = await admin(); fireEvent.click(screen.getByRole('button', { name: 'Views' })); fireEvent.click(primary());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Shot 2 of 2' })).toHaveAttribute('aria-current','true'));
    fireEvent.click(screen.getByRole('button', { name: 'Shot 1 of 2' })); fireEvent.click(screen.getByRole('button', { name: 'Remove tag' }));
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('admin_untag_place_media', { p_tag_id: 'saved' }));
    for (const key of ['course-place-media','hole-photo-tags','admin-untagged-course-media']) expect(view.invalidate).toHaveBeenCalledWith({ queryKey: [key,'course'] });
  });
});