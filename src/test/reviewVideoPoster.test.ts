import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ SUPABASE_URL: 'https://app.test', supabase: { rpc: f.rpc, from: f.from } }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));

import { persistedPoster } from '@/features/review-v2/lib/persistedPoster';
import { uploadAndPublishReview } from '@/features/review-v2/lib/reviewUploadController';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { fetchReviewMedia } from '@/components/posts/useReviewMedia';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';

const streamId = '0123456789abcdef0123456789abcdef';
const thumbnail = generateStreamThumbnailUrl(streamId);
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

it('(a) an https poster is kept as-is', () => {
  expect(persistedPoster(['https://media.example/poster.jpg', 'https://media.example/other.jpg'], streamId)).toBe('https://media.example/poster.jpg');
  expect(persistedPoster(['blob:local', 'http://media.example/poster.jpg'], null)).toBe('http://media.example/poster.jpg');
});

it('(b) a blob: poster with a stream id becomes the Stream thumbnail URL', async () => {
  expect(persistedPoster(['blob:https://clbhouz.co.uk/preview'], streamId)).toBe(thumbnail);
  const order = vi.fn().mockResolvedValue({ data: [{ id: 'video', media_type: 'video', media_url: generateStreamHlsUrl(streamId), poster_url: 'blob:https://clbhouz.co.uk/preview', stream_id: streamId }], error: null });
  f.from.mockReturnValue({ select: () => ({ eq: () => ({ order }) }) });
  expect((await fetchReviewMedia('review'))[0]?.posterUrl).toBe(thumbnail);
});

it('(c) a data: poster with a stream id becomes the Stream thumbnail URL', () => {
  expect(persistedPoster(['data:image/jpeg;base64,cHJldmlldw=='], streamId)).toBe(thumbnail);
});

it('(d) a blob: poster with no stream id becomes null', () => {
  expect(persistedPoster(['blob:https://clbhouz.co.uk/preview'], null)).toBeNull();
});

it('(e) the publish payload saves the Stream thumbnail, not the input blob: poster', async () => {
  f.rpc.mockResolvedValue({ data: 'review', error: null });
  const outcome = await uploadAndPublishReview('persisted-poster-test', 'member', 'pending', [{
    id: 'video', type: 'video', file: new File(['clip'], 'clip.mp4', { type: 'video/mp4' }),
    streamId, uploadedUrl: generateStreamHlsUrl(streamId), posterUrl: 'blob:https://clbhouz.co.uk/preview',
  }]);
  expect(outcome).toEqual({ ok: true, ratingId: 'review' });
  expect(f.rpc).toHaveBeenCalledWith('publish_pending_review', expect.objectContaining({
    p_media: [expect.objectContaining({ media_type: 'video', stream_id: streamId, poster_url: thumbnail })],
  }));
});

it('(f) holeMediaPoster with a blob: poster_url and a stream id returns the Stream thumbnail', () => {
  expect(holeMediaPoster({ media_type: 'video', media_url: generateStreamHlsUrl(streamId), poster_url: 'blob:https://clbhouz.co.uk/preview', stream_id: streamId })).toBe(thumbnail);
});