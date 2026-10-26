/** BRIEF_HOLE_TAG_BATCH_V3 §4 — single-shot tagging fires the member toast. */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
const f = vi.hoisted(() => ({ toast: vi.fn(), mutate: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('sonner', () => ({ toast: f.toast }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(async () => ({ data: false, error: null })), from: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ isSuccess: true, data: { available: true, total_rounds: 0, holes: [] } }) }));
vi.mock('@/components/course-media-tab/hooks/useHolePhotoTagging', () => ({ useHolePhotoTagging: () => ({
  ready: true, own: { data: [] }, sources: { data: [], isSuccess: true },
  tags: { isSuccess: true, data: [
    { id: 't1', user_id: 'me', hole_no: 9, status: 'approved', media_url: '/x.jpg' },
    { id: 't2', user_id: 'me', hole_no: 9, status: 'rejected', media_url: '/y.jpg' },
    { id: 't3', user_id: 'other', hole_no: 9, status: 'approved', media_url: '/z.jpg' },
  ] },
  taggedUrls: new Set(), submit: { reset: vi.fn(), mutate: f.mutate, isPending: false, error: null },
  retag: { reset: vi.fn() }, move: {}, remove: {},
}) }));
vi.mock('@/components/course-media-tab/hooks/useCourseMedia', () => ({ useCourseMedia: () => ({ posts: [{ id: 'p', userId: 'me', actorType: 'personal', mediaItems: [{ id: 'm', type: 'image', url: '/p.jpg' }] }], postsForFullscreen: [], mediaCounts: { total: 1, photos: 1, videos: 0 }, countsReady: true }) }));
vi.mock('@/uploads/hooks/useMediaUpload', () => ({ useMediaUpload: () => ({ upload: vi.fn() }) }));
vi.mock('@/components/course-media-tab/CourseMediaCanonGrid', () => ({ CourseMediaCanonGrid: React.forwardRef((props: { posts: unknown[]; tagging?: { onTag: (p: unknown) => void } }, _ref) => props.tagging ? <button type="button" onClick={() => props.tagging!.onTag(props.posts[0])}>open-tag</button> : null) }));
vi.mock('@/components/course-media-tab/CourseMediaHeader', () => ({ CourseMediaHeader: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/course-media-tab/AdminHoleTagging', () => ({ AdminHoleTagging: () => null }));
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';

describe('single-shot toast', () => {
  it('counts the member own non-rejected tags on that hole plus one', async () => {
    f.mutate.mockImplementation((_v: unknown, o: { onSuccess: () => void }) => o.onSuccess());
    const qc = new QueryClient();
    render(<MemoryRouter><QueryClientProvider client={qc}><CourseMediaTabNew courseId="course" /></QueryClientProvider></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'open-tag' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Hole 9' }));
    console.log('MUTATE', f.mutate.mock.calls.length, document.querySelector('[role=dialog]')?.textContent?.slice(0,200));
    await waitFor(() => expect(f.toast).toHaveBeenCalledWith('Tag confirmed. This is your second tag on the 9th.'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
