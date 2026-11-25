/**
 * useReviewMedia — the photo strip behind ReviewBottomSheet.
 *
 * WHY A READ AND NOT A PROP: BRIEF_SHEET_CAPS_ATW_AND_REVIEW §3c assumed the
 * tapped tile already holds the media array. It does not — useLatestReviews
 * collapses course_review_media down to a SINGLE cover (mediaUrl/mediaType/
 * posterUrl), and the feed RPC callers (Clubhouse, fullscreen viewer, course
 * reviews tab) carry no media at all. So the sheet reads the rows itself,
 * gated on `open`, and skips the read entirely when a caller does supply them.
 */

import { useQuery, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usablePoster } from '@/features/review-v2/lib/persistedPoster';

export interface ReviewMediaItem {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  posterUrl: string | null;
  streamId: string | null;
  isCover: boolean;
  width: number | null;
  height: number | null;
}

export const reviewMediaKey = (reviewId: string) => ['review-media', reviewId] as const;

const REVIEW_MEDIA_COLUMNS = 'id, media_type, media_url, poster_url, stream_id, is_cover, width, height, created_at';

/** One course_review_media row → ReviewMediaItem (BRIEF 20 B-r1: the one mapping). */
export function mapReviewMediaRow(m: any): ReviewMediaItem {
  return {
    id: String(m.id),
    mediaType: String(m.media_type ?? '').toLowerCase().includes('video') ? ('video' as const) : ('image' as const),
    mediaUrl: String(m.media_url),
    posterUrl: usablePoster(m.poster_url),
    streamId: m.stream_id ?? null,
    isCover: !!m.is_cover,
    width: typeof m.width === 'number' && m.width > 0 ? m.width : null,
    height: typeof m.height === 'number' && m.height > 0 ? m.height : null,
  };
}

/** Rows already ordered created_at ascending → usable items, cover first. */
function orderReviewMedia(rows: any[]): ReviewMediaItem[] {
  return rows.filter((m) => !!m.media_url).map(mapReviewMediaRow).sort((a, b) => Number(b.isCover) - Number(a.isCover));
}

export async function fetchReviewMedia(reviewId: string): Promise<ReviewMediaItem[]> {
  const { data, error } = await supabase
    .from('course_review_media' as any)
    .select(REVIEW_MEDIA_COLUMNS)
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return orderReviewMedia((data ?? []) as any[]);
}

/**
 * BRIEF 20 B-r1 — one read for many reviews; seeds every reviewMediaKey(id)
 * (empty arrays included) with exactly fetchReviewMedia's order.
 */
export async function fetchReviewMediaBatch(queryClient: QueryClient, reviewIds: readonly string[]): Promise<Map<string, ReviewMediaItem[]>> {
  const ids = [...new Set(reviewIds.filter(Boolean))];
  const out = new Map<string, ReviewMediaItem[]>();
  if (!ids.length) return out;
  const { data, error } = await supabase
    .from('course_review_media' as any)
    .select(`review_id, ${REVIEW_MEDIA_COLUMNS}`)
    .in('review_id', ids)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const grouped = new Map<string, any[]>(ids.map((id) => [id, []]));
  for (const row of (data ?? []) as any[]) grouped.get(String(row.review_id))?.push(row);
  for (const [id, rows] of grouped) {
    const items = orderReviewMedia(rows);
    out.set(id, items);
    queryClient.setQueryData(reviewMediaKey(id), items);
  }
  return out;
}

export function prefetchReviewMedia(queryClient: QueryClient, reviewId: string) {
  return queryClient.prefetchQuery({ queryKey: reviewMediaKey(reviewId), queryFn: () => fetchReviewMedia(reviewId), staleTime: 5 * 60 * 1000 });
}

export function useReviewMedia(reviewId: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: reviewMediaKey(reviewId ?? ''),
    enabled: !!reviewId && enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ReviewMediaItem[]> => {
      return fetchReviewMedia(reviewId as string);
    },
  });
}
