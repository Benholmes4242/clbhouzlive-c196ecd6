import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseMediaNotLive } from '@/components/course-media-tab/CourseMediaEmptyStates';
import { retagHolePhoto } from '@/lib/courseMedia/retagHolePhoto';
import { submitLibraryHolePhoto, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { composerPhotoVerdict } from '@/lib/courseMedia/composerHolePhotos';

const f = vi.hoisted(() => ({ rpc: vi.fn(), exif: vi.fn(), insert: vi.fn(), auth: vi.fn() }));
vi.mock('@/lib/courseMedia/holePhotoExif', () => ({ readHolePhotoExif: f.exif }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc, auth: { getUser: f.auth }, from: () => ({ insert: f.insert }) } }));
const row = { id: 'photo', course_id: 'course', user_id: 'member', hole_no: 2, media_url: '/photo.jpg', status: 'rejected', reject_reason: 'not_your_photo', reviewed_at: null } as HolePhoto;
beforeEach(() => vi.clearAllMocks());

describe('MEDIA_TRUST_1_R3 publication and ownership', () => {
  it('not_your_photo cannot invoke Retag', async () => {
    await expect(retagHolePhoto(row, 9, 'course', 'member', [2, 9])).rejects.toThrow('This photograph cannot be retagged because it is not yours.');
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it('not_your_photo has no Retag control while other rejected reasons do', () => {
    render(<CourseMediaNotLive rows={[row, { ...row, id: 'other', hole_no: 9, reject_reason: 'wrong_hole' }]} memberId="member" courseId="course" onRetag={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Retag the 2nd' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Retag the 9th' })).toBeEnabled();
    expect(screen.getAllByRole('status')[0].textContent).toContain('This photo cannot be retagged because it is not yours.');
  });
  it('historical pending rows never enter State D', () => {
    const { container } = render(<CourseMediaNotLive rows={[{ ...row, status: 'pending' }]} memberId="member" courseId="course" onRetag={() => {}} />);
    expect(container.childElementCount).toBe(0);
  });
  it('unreadable original File metadata never blocks an approved library insert', async () => {
    f.auth.mockResolvedValue({ data: { user: { id: 'member' } }, error: null });
    f.exif.mockRejectedValue(new Error('Unknown file format'));
    f.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { status: 'approved' }, error: null }) }) });
    await expect(submitLibraryHolePhoto(new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }), 'https://example.test/photo.jpg', 'course', 'member', 2, [2, 9])).resolves.toEqual({ status: 'approved' });
    const payload = f.insert.mock.calls[0]?.[0];
    expect(payload).toMatchObject({ status: 'approved', exif_captured_at: null });
    expect(payload).not.toHaveProperty('exif_lat'); expect(payload).not.toHaveProperty('exif_lng');
  });
  it('chosen round association does not persist GPS or alter publication', async () => {
    const metadata = { capturedAt: '2026-10-18T12:00:00', captureDay: '2026-10-18', latitude: 54.2, longitude: -5.8 };
    const chosen = await composerPhotoVerdict(metadata, 'member', 'course', 'round');
    const unchosen = await composerPhotoVerdict(metadata, 'member', 'course', null);
    expect(chosen).toEqual({ status: 'approved', exif_captured_at: '2026-10-18T12:00:00', proof_score_id: 'round' });
    expect(unchosen).toEqual({ ...chosen, proof_score_id: null });
  });
});