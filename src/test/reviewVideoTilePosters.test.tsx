import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReviewMediaItem } from '@/components/posts/useReviewMedia';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
const calls = vi.hoisted(() => ({ open: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: calls.open }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null }) }));
vi.mock('@/components/posts/useReviewMedia', async importOriginal => ({ ...await importOriginal<typeof import('@/components/posts/useReviewMedia')>(), useReviewMedia: () => ({ data: [] }) }));
vi.mock('@/components/posts/useReviewPost', () => ({ useReviewPost: () => ({ data: { id: 'post', mediaItems: [{ id: 'video', type: 'video', streamId: '0123456789abcdef0123456789abcdef' }] } }) }));
vi.mock('@/features/pro-verification/useProMembers', () => ({ useProMembers: () => ({ members: new Map() }) }));
vi.mock('@/features/amateur-ranking/useAmateurMembers', () => ({ useAmateurMembers: () => ({ members: new Map() }) }));
vi.mock('@/components/ui/SquircleAvatar', async importOriginal => ({ ...await importOriginal<typeof import('@/components/ui/SquircleAvatar')>(), SquircleAvatar: () => <span /> }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('@/components/explore-tab-new/courseled/RoundEngagementActions', () => ({ RoundEngagementActions: () => null }));
vi.mock('@/components/course-media-tab/HoleInlineVideo', () => ({ HoleInlineVideo: () => <span /> }));
import { fetchReviewMedia } from '@/components/posts/useReviewMedia';
import { ReviewBottomSheet } from '@/components/posts/ReviewBottomSheet';
import { ReviewRailSlot } from '@/components/courses/ReviewRailSlot';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';
const stream = '0123456789abcdef0123456789abcdef';
const thumbnail = `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${stream}/thumbnails/thumbnail.jpg`;
const video: ReviewMediaItem = { id: 'video', mediaType: 'video', mediaUrl: 'https://example.com/review.mp4', posterUrl: null, streamId: stream, isCover: true, width: 1080, height: 1920 };
function sheet(item: ReviewMediaItem) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={client}><ReviewBottomSheet isOpen onClose={() => {}} user={{ id: 'member', name: 'Member' }} courseId="course" courseName="Course" rating={8} reviewId="review" resolvedMedia={[item]} resolvedReviewText="Review" /></QueryClientProvider></MemoryRouter>);
}
function review(streamId: string | null): LatestReview {
  return { reviewId: 'review', courseId: 'course', courseName: 'Course', courseImage: null, userId: 'member', reviewerName: 'Member', reviewerUsername: null, reviewerAvatar: null, rating: 8, quote: 'Review', at: '2026-11-18', mediaUrl: null, mediaType: null, posterUrl: null, courseCountry: null, courseRegion: null, courseSubCountry: null, breakdown: { design: null, conditions: null, clubhouse: null, facilities: null }, media: [
    { id: 'photo', type: 'image', url: 'https://example.com/photo.jpg', posterUrl: null, streamId: null, durationSeconds: null, width: null, height: null },
    { id: 'video', type: 'video', url: video.mediaUrl, posterUrl: null, streamId, durationSeconds: 20, width: 1080, height: 1920 },
  ] };
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });
describe('review video tile posters', () => {
  it('fetchReviewMedia selects and maps stream_id with JSON-safe null fallback', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'video', media_type: 'video', media_url: video.mediaUrl, poster_url: null, stream_id: stream }, { id: 'photo', media_type: 'image', media_url: 'photo.jpg' }], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    vi.spyOn(supabase, 'from').mockReturnValue({ select } as unknown as ReturnType<typeof supabase.from>);
    const rows = await fetchReviewMedia('review');
    expect(select).toHaveBeenCalledWith('id, media_type, media_url, poster_url, stream_id, is_cover, width, height, created_at');
    expect(rows.map(row => row.streamId)).toEqual([stream, null]);
    expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
  });
  it('sheet video uses a Stream thumbnail and carries it into viewer opening', () => {
    sheet(video);
    const tile = screen.getByRole('button', { name: 'Video 1 of 1' });
    expect(tile.querySelector('img')).toHaveAttribute('src', thumbnail);
    expect(document.querySelector(`img[src="${video.mediaUrl}"]`)).toBeNull();
    fireEvent.click(tile);
    expect(calls.open).toHaveBeenCalledWith(expect.objectContaining({ posterUrl: thumbnail, openedFrom: 'review-sheet' }));
  });
  it('sheet video without a derivable poster has no image and no playback opening poster', () => {
    sheet({ ...video, streamId: null });
    const tile = screen.getByRole('button', { name: 'Video 1 of 1' });
    expect(tile.querySelector('img')).toBeNull();
    expect(tile.querySelector('svg')).not.toBeNull();
    fireEvent.click(tile);
    expect(calls.open).toHaveBeenCalledWith(expect.objectContaining({ posterUrl: null }));
  });
  it('Latest reviews small video tile derives the Stream thumbnail and viewer poster', () => {
    const { container } = render(<MemoryRouter><ReviewRailSlot reviews={[review(stream)]} onReviewPress={() => {}} /></MemoryRouter>);
    const tile = container.querySelector('[data-review-media-id="video"]');
    if (!tile) throw new Error('Missing small video tile');
    expect(tile.querySelector('img')).toHaveAttribute('src', thumbnail);
    expect(container.querySelector(`img[src="${video.mediaUrl}"]`)).toBeNull();
    expect(container.querySelector('[data-review-media-id="photo"] img')).toHaveAttribute('src', 'https://example.com/photo.jpg');
    fireEvent.click(tile);
    expect(calls.open).toHaveBeenCalledWith(expect.objectContaining({ posterUrl: thumbnail }));
  });
  it('Latest reviews unknown video has no small image, unsafe ambient or opening poster', () => {
    const r = review(null);
    const small = render(<MemoryRouter><ReviewRailSlot reviews={[r]} onReviewPress={() => {}} /></MemoryRouter>);
    const tile = small.container.querySelector('[data-review-media-id="video"]');
    if (!tile) throw new Error('Missing small video tile');
    expect(tile.querySelector('img')).toBeNull();
    expect(tile.querySelector('[data-review-vid]')).not.toBeNull();
    fireEvent.click(tile);
    expect(calls.open).toHaveBeenCalledWith(expect.objectContaining({ posterUrl: null }));
    small.unmount();
    const cover = render(<MemoryRouter><ReviewRailSlot reviews={[{ ...r, media: r.media?.slice(1) }]} onReviewPress={() => {}} /></MemoryRouter>);
    expect([...cover.container.querySelectorAll<HTMLElement>('[style]')].some(el => el.style.backgroundImage.includes(video.mediaUrl))).toBe(false);
  });
});