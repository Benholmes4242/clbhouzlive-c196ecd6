import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const m = vi.hoisted(() => ({
  viewer: 'me', admin: false,
  submit: vi.fn(), move: vi.fn(), remove: vi.fn(), placeSubmit: vi.fn(), placeRemove: vi.fn(),
  rpc: vi.fn(), update: vi.fn(), eq: vi.fn(), tagAdminHole: vi.fn(),
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: m.viewer } }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => m.admin }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: m.rpc,
  from: (table: string) => ({ update: (v: unknown) => { m.update(table, v); return { eq: (c: string, id: string) => { m.eq(c, id); return Promise.resolve({ error: null }); } }; } }),
} }));
vi.mock('@/components/course-media-tab/hooks/useHolePhotoTagging', () => ({ useHolePhotoTagging: () => ({
  submit: { mutateAsync: m.submit }, move: { mutateAsync: m.move }, remove: { mutateAsync: m.remove } }) }));
vi.mock('@/components/course-media-tab/hooks/useCoursePlaceMedia', () => ({ useCoursePlaceMedia: () => ({
  submit: { mutateAsync: m.placeSubmit }, remove: { mutateAsync: m.placeRemove } }) }));
vi.mock('@/components/course-media-tab/AdminHoleTagging', () => ({ tagAdminHole: m.tagAdminHole }));
vi.mock('@/features/courses/_shared/scorecard/ScorecardGlassOverlay', () => ({ ScorecardGlassOverlay: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/course-media-tab/HoleMediaVideo', () => ({ HoleMediaThumbnail: () => <span /> }));

import { CourseGalleryTagger } from '@/components/course-media-tab/CourseGalleryTagger';
import type { GalleryShot } from '@/lib/courseMedia/courseGallery';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const holeRow = (extra: Partial<HolePhoto> = {}) => ({ id: 'tag', hole_no: 6, status: 'approved', media_url: '/a.jpg', media_type: 'image', source_post_media_id: null, ...extra }) as HolePhoto;
const shot = (over: Partial<GalleryShot> = {}): GalleryShot => ({
  id: 's', ownerId: 'me', name: 'Ann', avatar: '', addedAt: '2026-01-01',
  item: { id: 'i', url: '/a.jpg', type: 'image', width: 1, height: 1 } as GalleryShot['item'], post: { id: 'p' } as GalleryShot['post'], holeTag: holeRow(), ...over,
});
const mount = (s: GalleryShot) => {
  const onSaved = vi.fn(); const onClose = vi.fn();
  render(<QueryClientProvider client={new QueryClient()}><CourseGalleryTagger courseId="c" shot={s} holes={[6, 7]} onClose={onClose} onSaved={onSaved} /></QueryClientProvider>);
  return { onSaved, onClose };
};
const primary = () => document.querySelector('[data-tag-primary]') as HTMLButtonElement;

beforeEach(() => {
  vi.clearAllMocks(); m.viewer = 'me'; m.admin = false;
  m.rpc.mockResolvedValue({ data: null, error: null });
});

describe('MEDIA_RETAG_1 one-step retag', () => {
  it('hole-tagged shot: unlocked, current preselected, disabled; move calls moveHoleTag once', async () => {
    const { onClose } = mount(shot());
    expect(screen.getByRole('button', { name: 'Hole 7' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hole 6' })).toHaveAttribute('aria-pressed', 'true');
    expect(primary()).toBeDisabled(); expect(primary().textContent).toBe('Tagged to the 6th');
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    expect(primary().textContent).toBe('Move to the 7th');
    fireEvent.click(primary());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(m.move).toHaveBeenCalledTimes(1); expect(m.remove).not.toHaveBeenCalled();
  });
  it('post-sourced hole: updates post_media.hole_no only', async () => {
    const { onClose } = mount(shot({ holeTag: holeRow({ source_post_media_id: 'pm1' }) }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' })); fireEvent.click(primary());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(m.update).toHaveBeenCalledWith('post_media', { hole_no: 7 }); expect(m.eq).toHaveBeenCalledWith('id', 'pm1');
    expect(m.move).not.toHaveBeenCalled(); expect(m.remove).not.toHaveBeenCalled();
  });
  it('hole to Clubhouse: remove then place submit; failure restores the old hole and shows the error', async () => {
    m.placeSubmit.mockRejectedValueOnce(new Error('x'));
    const { onClose } = mount(shot());
    fireEvent.click(document.querySelector('[data-place="clubhouse"]')!);
    expect(primary().textContent).toBe('Move to Clubhouse');
    fireEvent.click(primary());
    await screen.findByRole('alert');
    expect(m.remove).toHaveBeenCalledTimes(1); expect(m.placeSubmit).toHaveBeenCalledTimes(1);
    expect(m.submit).toHaveBeenCalledWith(expect.objectContaining({ hole: 6 }));
    expect(m.remove.mock.invocationCallOrder[0]).toBeLessThan(m.placeSubmit.mock.invocationCallOrder[0]);
    expect(onClose).not.toHaveBeenCalled();
  });
  it('deselecting the current tag offers Remove tag and removes in one tap', async () => {
    const { onClose } = mount(shot());
    fireEvent.click(screen.getByRole('button', { name: 'Hole 6' }));
    expect(primary()).not.toBeDisabled(); expect(primary().textContent).toBe('Remove tag');
    fireEvent.click(primary());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(m.remove).toHaveBeenCalledTimes(1); expect(m.submit).not.toHaveBeenCalled(); expect(m.placeSubmit).not.toHaveBeenCalled();
  });
  it('shows no separate Remove tag row', () => {
    mount(shot());
    expect(document.querySelector('.media-v3-tag-remove')).toBeNull();
  });
  it('first tag keeps the existing labels', () => {
    mount(shot({ holeTag: undefined }));
    expect(primary()).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Hole 6' }));
    expect(primary().textContent).toBe('Tag to the 6th');
  });
  it('admin on another member shot: untag RPC then the admin tag path in one tap', async () => {
    m.viewer = 'admin'; m.admin = true;
    m.rpc.mockImplementation(async (name: string) => name === 'admin_get_untagged_course_media'
      ? { data: [{ media_id: 'm1', media_url: '/a.jpg', media_type: 'image', stream_id: null }], error: null } : { data: null, error: null });
    m.tagAdminHole.mockResolvedValue(holeRow({ hole_no: 7 }));
    const { onClose } = mount(shot());
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' })); fireEvent.click(primary());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(m.rpc.mock.calls[0]).toEqual(['admin_untag_hole_media', { p_tag_id: 'tag' }]);
    expect(m.tagAdminHole).toHaveBeenCalledWith('c', 'm1', 7);
  });
});
