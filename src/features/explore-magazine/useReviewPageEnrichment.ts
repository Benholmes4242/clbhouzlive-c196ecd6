import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export interface ReviewBreakdown {
  design: number | null;
  conditions: number | null;
  clubhouse: number | null;
  facilities: number | null;
}

/**
 * BRIEF_EXPLORE_REVIEW_TILE_C5 §1 — THE MEMBER'S OWN MEDIA.
 *
 * `subject.image_url` is the COURSE thumbnail, always: the stream RPC sets it
 * from golf_courses.thumbnail_image. A review that carries the member's own
 * photographs must show one of them, and the course photo is the FALLBACK.
 *
 * ONE ANSWER, resolved here, so the card never re-sorts a list per render.
 */
export interface ReviewCardMedia {
  mediaId: string;
  kind: 'video' | 'image';
  /** A video's own source (the viewer plays it); an image's URL. */
  url: string;
  /** A VIDEO ALWAYS HAS ONE HERE — a poster-less video is not a candidate. */
  posterUrl: string | null;
  streamId: string | null;
  durationS: number | null;
}

export interface ReviewPageEnrichment {
  breakdown: ReviewBreakdown;
  photoCount: number;
  /** §1's single answer: the member's video, else their image, else null (the
   *  card then falls back to the course thumbnail exactly as before). */
  reviewMedia: ReviewCardMedia | null;
}

export interface ReviewMediaRow {
  id: string;
  media_url: string | null;
  media_type: string | null;
  poster_url: string | null;
  stream_id: string | null;
  is_cover: boolean | null;
  status: string | null;
  duration_seconds: number | null;
}

interface ReviewEnrichmentRow {
  id: string;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  course_review_media: ReviewMediaRow[] | null;
}

/** §1.3 — the upload pipeline writes 'attached' on success. Anything else is
 *  mid-flight or failed, and is treated as absent. */
const ATTACHED = 'attached';

function isAttached(row: ReviewMediaRow): boolean {
  return row.status === ATTACHED;
}

/** §2.3 — the photo count is IMAGES ALONE. It used to be the row count, which
 *  was only ever a photo count because the query filtered videos out. */
export function countReviewPhotos(rows: ReviewMediaRow[]): number {
  return rows.filter((row) => isAttached(row) && row.media_type === 'image').length;
}

/**
 * §1.1 THE ORDER, and it is not negotiable:
 *   a. the member's VIDEO — the first attached video WITH a usable poster
 *   b. the member's IMAGE — `is_cover` first, then any
 *   c. null, so the card takes the course thumbnail
 *
 * §1.2 A VIDEO WITH NO POSTER IS NOT A CANDIDATE. `poster_url` is filled by a
 * background poll after upload, so a just-posted video can have none; rendering
 * it anyway is a black rectangle, which the post composer shipped twice.
 *
 * §1.4 THERE IS NO `display_order`, and `is_cover` DEFAULTS TO index === 0, so
 * it is not evidence the member chose anything: it breaks ties between IMAGES
 * and never outranks a video.
 */
export function pickReviewCardMedia(rows: ReviewMediaRow[]): ReviewCardMedia | null {
  const usable = rows.filter(isAttached);

  const video = usable.find(
    (row) => row.media_type === 'video' && !!row.poster_url?.trim() && !!row.media_url?.trim(),
  );
  if (video) {
    return {
      mediaId: video.id,
      kind: 'video',
      url: video.media_url as string,
      posterUrl: video.poster_url as string,
      streamId: video.stream_id,
      durationS: video.duration_seconds,
    };
  }

  const images = usable.filter((row) => row.media_type === 'image' && !!row.media_url?.trim());
  const image = images.find((row) => row.is_cover === true) ?? images[0];
  if (image) {
    return {
      mediaId: image.id,
      kind: 'image',
      url: image.media_url as string,
      posterUrl: null,
      streamId: null,
      durationS: null,
    };
  }

  return null;
}

function normaliseIds(reviewIds: string[]): string[] {
  return Array.from(new Set(reviewIds.filter(Boolean))).sort();
}

/** A loaded review is never fetched again as later stream pages append IDs. */
const resolved = new Map<string, ReviewPageEnrichment>();

export function useReviewPageEnrichment(reviewIds: string[]): Map<string, ReviewPageEnrichment> {
  const ids = useMemo(() => normaliseIds(reviewIds), [reviewIds]);
  const idKey = ids.join('|');
  const [, setVersion] = useState(0);
  const missing = ids.filter((id) => !resolved.has(id));
  const missingKey = missing.join('|');

  const query = useQuery({
    queryKey: ['explore', 'review-page-enrichment-v1', missingKey],
    enabled: missing.length > 0,
    staleTime: Infinity,
    gcTime: 60 * 60_000,
    queryFn: async (): Promise<Map<string, ReviewPageEnrichment>> => {
      const out = new Map<string, ReviewPageEnrichment>();
      /* §2 ONE CHANGE, NO NEW ROUND TRIP: the same batched join, widened to
         carry the media it already fetched and no longer filtered to images —
         that filter is why videos were invisible. */
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          id,
          design_score,
          condition_score,
          clubhouse_score,
          facilities_score,
          course_review_media!left(id, media_url, media_type, poster_url, stream_id, is_cover, status, duration_seconds)
        `)
        .in('id', missing);
      if (error) throw error;

      for (const row of (data ?? []) as ReviewEnrichmentRow[]) {
        const media = row.course_review_media ?? [];
        out.set(row.id, {
          breakdown: {
            design: row.design_score,
            conditions: row.condition_score,
            clubhouse: row.clubhouse_score,
            facilities: row.facilities_score,
          },
          photoCount: countReviewPhotos(media),
          reviewMedia: pickReviewCardMedia(media),
        });
      }
      /* A requested ID with no visible row is resolved as absent. This prevents
         repeated reads on every render while preserving the card's empty state. */
      for (const id of missing) {
        if (!out.has(id)) {
          out.set(id, {
            breakdown: { design: null, conditions: null, clubhouse: null, facilities: null },
            photoCount: 0,
            reviewMedia: null,
          });
        }
      }
      return out;
    },
  });

  useEffect(() => {
    if (!query.data) return;
    for (const [id, value] of query.data) resolved.set(id, value);
    setVersion((value) => value + 1);
  }, [query.data]);

  return useMemo(() => {
    const out = new Map<string, ReviewPageEnrichment>();
    for (const id of ids) {
      const value = resolved.get(id);
      if (value) out.set(id, value);
    }
    return out;
  }, [idKey, query.data]);
}
