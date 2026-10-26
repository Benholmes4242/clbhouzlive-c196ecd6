import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, render, cleanup } from '@testing-library/react';
const f = vi.hoisted(() => ({ invoke: vi.fn(), rpc: vi.fn(), from: vi.fn(), video: vi.fn(), probe: vi.fn(), session: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ SUPABASE_URL: 'https://app.test', supabase: { functions: { invoke: f.invoke }, rpc: f.rpc, from: f.from, auth: { getSession: f.session } } }));
vi.mock('@/uploads/resilientVideoUpload', () => ({ uploadVideoResilient: f.video }));
vi.mock('@/features/review-v2/lib/probeVideo', () => ({ probeVideo: f.probe }));
vi.mock('@/lib/courseMedia/composerHolePhotos', () => ({ writeComposerHolePhoto: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
import { useReviewMediaPipeline } from '@/features/review-v2/hooks/useReviewMediaPipeline';
import { enqueueReviewUpload, uploadAndPublishReview, abandonReviewPreuploads, removeReviewPreupload } from '@/features/review-v2/lib/reviewUploadController';
import { mediaUploadSummary, mediaCountKey } from '@/features/review-v2/lib/mediaUploadSummary';
import { MediaTray } from '@/features/review-v2/components/MediaTray';
import type { MediaItem } from '@/features/review-v2/types';
const requests: FakeXHR[] = [];
class FakeXHR {
  upload: { onprogress?: (e: { loaded: number; total: number; lengthComputable: boolean }) => void } = {};
  status = 200; responseText = ''; onload?: () => void; onabort?: () => void; onerror?: () => void;
  open = vi.fn(); setRequestHeader = vi.fn(); send = vi.fn(() => requests.push(this)); abort = vi.fn(() => this.onabort?.());
  finish(url = 'https://media.clbhouz.co.uk/member/course-media/p.jpg') { this.responseText = JSON.stringify({ success: true, publicUrl: url }); this.onload?.(); }
}
const photo = () => new File(['1234567890'], 'p.jpg', { type: 'image/jpeg' });
const video = () => new File(['clip'], 'v.mp4', { type: 'video/mp4' });
let key = 0;
const urlOrig = { create: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'), revoke: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL') };
beforeEach(() => {
  if (!('createObjectURL' in URL)) Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:test'), writable: true, configurable: true });
  if (!('revokeObjectURL' in URL)) Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true, configurable: true });
  vi.clearAllMocks(); requests.length = 0; vi.stubGlobal('XMLHttpRequest', FakeXHR);
  vi.stubGlobal('Image', class { naturalWidth = 100; naturalHeight = 100; onload?: () => void; set src(_v: string) { queueMicrotask(() => this.onload?.()); } });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  f.session.mockResolvedValue({ data: { session: { access_token: 'fixture-token' } } });
  f.invoke.mockResolvedValue({ data: {}, error: null }); f.rpc.mockResolvedValue({ data: 'rating', error: null });
  f.probe.mockResolvedValue({ duration: 75, posterUrl: null });
  f.video.mockImplementation((opts: any) => { opts.onSuccess('stream'); return Promise.resolve({ abort: vi.fn() }); });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  if (urlOrig.create) Object.defineProperty(URL, 'createObjectURL', urlOrig.create); else delete (URL as any).createObjectURL;
  if (urlOrig.revoke) Object.defineProperty(URL, 'revokeObjectURL', urlOrig.revoke); else delete (URL as any).revokeObjectURL;
});
it('photos start upload immediately on add without any row insert', async () => {
  const { result } = renderHook(() => useReviewMediaPipeline({ userId: 'member' }));
  await act(async () => { await result.current.addFiles([photo()]); });
  await waitFor(() => expect(requests).toHaveLength(1)); expect(f.from).not.toHaveBeenCalled();
  expect(result.current.items[0].status).toBe('uploading');
});
it('video upload waits for passing probe and gets Stream poster', async () => {
  let resolve: (p: { duration: number; posterUrl: null }) => void = () => {};
  f.probe.mockReturnValue(new Promise(r => { resolve = r; }));
  const { result } = renderHook(() => useReviewMediaPipeline({ userId: 'member' }));
  act(() => { void result.current.addFiles([video()]); }); expect(f.video).not.toHaveBeenCalled();
  await act(async () => { resolve({ duration: 180, posterUrl: null }); });
  await waitFor(() => expect(result.current.items[0].status).toBe('uploaded'));
  expect(result.current.items[0].posterUrl).toContain('thumbnail'); expect(f.video).toHaveBeenCalledTimes(1);
});
it('over-limit video is removed and never uploaded', async () => {
  f.probe.mockResolvedValue({ duration: 181, posterUrl: null });
  const { result } = renderHook(() => useReviewMediaPipeline({ userId: 'member' }));
  await act(async () => { await result.current.addFiles([video()]); }); expect(result.current.items).toHaveLength(0); expect(f.video).not.toHaveBeenCalled();
});
it('at most two uploads run and later files start in tray order', async () => {
  const k = `queue-${++key}`; const inputs = [1,2,3,4].map(n => ({ id: String(n), type: 'image' as const, file: photo(), trackBytes: true }));
  const promises = inputs.map(i => enqueueReviewUpload(k, 'member', i));
  await waitFor(() => expect(requests).toHaveLength(2)); requests[0].finish();
  await waitFor(() => expect(requests).toHaveLength(3)); requests[1].finish();
  await waitFor(() => expect(requests).toHaveLength(4)); requests[2].finish(); requests[3].finish();
  expect((await Promise.all(promises)).map(r => r.id)).toEqual(['1','2','3','4']); abandonReviewPreuploads(k);
});
it('publish reuses uploaded, joins uploading and uploads pending once', async () => {
  const k = `publish-${++key}`; const input = { id: 'b', type: 'image' as const, file: photo(), trackBytes: true };
  const first = enqueueReviewUpload(k, 'member', input); await waitFor(() => expect(requests).toHaveLength(1));
  const publish = uploadAndPublishReview(k, 'member', 'pending', [{ ...input, id: 'a', uploadedUrl: 'already' }, input, { ...input, id: 'c' }]);
  await waitFor(() => expect(requests).toHaveLength(2)); requests.forEach(r => r.finish());
  expect(await publish).toEqual({ ok: true, ratingId: 'rating' }); await first;
  expect(requests).toHaveLength(2); expect(f.rpc.mock.calls[0][1].p_media).toHaveLength(3);
});
it('unmount during submitted upload does not cancel background publish', async () => {
  const { result, unmount } = renderHook(() => useReviewMediaPipeline({ userId: 'member' }));
  await act(async () => { await result.current.addFiles([photo()]); }); await waitFor(() => expect(requests).toHaveLength(1));
  act(() => { result.current.startBackgroundPublish('pending'); }); unmount(); requests[0].finish();
  await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('publish_pending_review', expect.anything())); expect(requests[0].abort).not.toHaveBeenCalled();
});
it('removing uploaded tile sends the asset for cleanup', async () => {
  const k = `remove-${++key}`; const p = enqueueReviewUpload(k, 'member', { id: 'p', type: 'image', file: photo(), trackBytes: true });
  await waitFor(() => expect(requests).toHaveLength(1)); requests[0].finish(); await p; removeReviewPreupload(k, 'p');
  expect(f.invoke).toHaveBeenCalledWith('cleanup-review-media', expect.objectContaining({ body: { mediaItems: [expect.objectContaining({ media_type: 'image', media_url: expect.stringContaining('/member/') })] } }));
});
it('abandon cleans each unattached uploaded asset', async () => {
  const k = `abandon-${++key}`; const p = [1,2].map(n => enqueueReviewUpload(k, 'member', { id: String(n), type: 'image', file: photo(), trackBytes: true }));
  await waitFor(() => expect(requests).toHaveLength(2)); requests.forEach(r => r.finish()); await Promise.all(p); abandonReviewPreuploads(k);
  expect(f.invoke.mock.calls.filter(c => c[0] === 'cleanup-review-media')).toHaveLength(2);
});
it('byte-weighted batch uses actual file sizes', () => {
  const items = [{ id: '1', type: 'image', previewUrl: '', file: new File(['1234567890'], 'a'), status: 'uploaded', progress: 100 }, { id: '2', type: 'video', previewUrl: '', file: new File(['123456789012345678901234567890'], 'b'), status: 'uploading', progress: 20 }] as MediaItem[];
  expect(mediaUploadSummary(items)).toMatchObject({ uploaded: 1, total: 2, percent: 40, active: true });
});
it.each(['uploaded','uploading','pending','failed'] as const)('tile state %s never renders a video element', status => {
  const { container } = render(<MediaTray items={[{ id: 'v', type: 'video', previewUrl: 'blob:video', status, progress: 64, durationSeconds: 75 }]} onPick={vi.fn()} onRemove={vi.fn()} />);
  expect(container.querySelector('video')).toBeNull(); expect(container.querySelector('[aria-label="No preview"]')).not.toBeNull();
});
it.each([[['image'], 'summaryPhoto'], [['image','image','image'], 'summaryPhotos'], [['video'], 'summaryVideo'], [['video','video','video','video'], 'summaryVideos'], [['image','video'], 'summaryMixed']] as const)('footer count kinds %j', (types, key) => { expect(mediaCountKey(types.map(type => ({ type })) as MediaItem[])).toBe(key); });
