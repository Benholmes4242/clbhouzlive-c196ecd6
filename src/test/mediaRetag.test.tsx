import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { memberReasonSentence } from '@/lib/courseMedia/memberReasonSentence';
import { retagHolePhoto } from '@/lib/courseMedia/retagHolePhoto';
import { CourseMediaNotLive, CoursePhotoRetagPicker } from '@/components/course-media-tab/CourseMediaEmptyStates';
import { useHolePhotoTagging } from '@/components/course-media-tab/hooks/useHolePhotoTagging';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), fetchRows: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('@/lib/courseMedia/holePhotoData', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/courseMedia/holePhotoData')>(),
  fetchHolePhotos: mocks.fetchRows,
  fetchOwnPhotoUrls: async () => [], fetchOwnPhotoSources: async () => [], coursePhotoRounds: async () => [],
}));
const rejected = { id: 'photo', course_id: 'here', user_id: 'me', hole_no: 12, status: 'rejected', media_url: '/photo.jpg', reject_reason: 'other', reviewed_at: null } as HolePhoto;
beforeEach(() => { vi.clearAllMocks(); mocks.rpc.mockResolvedValue({ error: null }); mocks.fetchRows.mockResolvedValue([rejected]); });

describe('MEDIA_RETAG_1', () => {
  it('calls only the supplied RPC with the photo id and new hole', async () => {
    await retagHolePhoto(rejected, 7, 'here', 'me', [7, 12]);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('retag_hole_photo', { p_id: 'photo', p_hole_no: 7 });
  });
  it('rejects another member before any write', async () => {
    await expect(retagHolePhoto(rejected, 7, 'here', 'other', [7, 12])).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects another course before any write', async () => {
    await expect(retagHolePhoto(rejected, 7, 'elsewhere', 'me', [7, 12])).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects waiting photographs before any write', async () => {
    await expect(retagHolePhoto({ ...rejected, status: 'pending' }, 7, 'here', 'me', [7, 12])).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects an unchanged hole before any write', async () => {
    await expect(retagHolePhoto(rejected, 12, 'here', 'me', [7, 12])).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects holes missing from actual analysis before any write', async () => {
    await expect(retagHolePhoto(rejected, 18, 'here', 'me', [7, 12])).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('propagates a server refusal without claiming success', async () => {
    const refusal = new Error('Owner check refused'); mocks.rpc.mockResolvedValue({ error: refusal });
    await expect(retagHolePhoto(rejected, 7, 'here', 'me', [7, 12])).rejects.toBe(refusal);
  });
  it('unknown codes cannot return internal reviewer text', () => {
    const internal = 'Private reviewer context';
    expect(memberReasonSentence(internal)).toBe(memberReasonSentence('other'));
    expect(memberReasonSentence(internal)).not.toContain(internal);
    expect(memberReasonSentence(null)).toBe(memberReasonSentence('other'));
  });
  it('picker submits the actual chosen different hole', () => {
    const submit = vi.fn(); render(<CoursePhotoRetagPicker row={rejected} knownHoles={[7, 12]} pending={false} error={null} onSubmit={submit} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    fireEvent.click(screen.getByRole('button', { name: /^Retag$/ }));
    expect(submit).toHaveBeenCalledExactlyOnceWith(7);
  });
  it('successful retag refetches the same owner row as pending at the new hole', async () => {
    const waiting = { ...rejected, status: 'pending', hole_no: 7, reject_reason: null, reviewed_at: null };
    mocks.fetchRows.mockResolvedValueOnce([rejected]).mockResolvedValue([waiting]);
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    function Harness() {
      const tagging = useHolePhotoTagging('here', 'me', [7, 12]);
      return <CourseMediaNotLive rows={tagging.tags.data ?? []} memberId="me" courseId="here" onRetag={row => tagging.retag.mutate({ row, hole: 7 })} />;
    }
    const { container } = render(<QueryClientProvider client={cache}><Harness /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Retag the 12th' }));
    await waitFor(() => expect(container.querySelector('[data-status="pending"]')).not.toBeNull());
    expect(container.querySelector('[data-status="rejected"]')).toBeNull();
    expect(cache.getQueryData(['hole-photo-tags', 'here', 'me'])).toEqual([waiting]);
  });
});