/**
 * useBrowseReviews — the review pool for the Courses browse slots.
 *
 * SCOPE: the hook accepts country and region and still scopes when given
 * them. The Courses page calls it UNSCOPED, because section 07 (Latest
 * reviews) is app-wide and the country/region filter belongs to section 08
 * alone; the reviews sheet it feeds is app-wide for the same reason. The LENS (Best rated /
 * Toughest / Records to chase) is an ORDERING and a review is not ordered by
 * toughness, so it is deliberately NOT part of the key.
 *
 * ORDER: CONTENT-LED, newest content first. A review that gains photos or
 * words later keeps its original created_at, so ordering by it buried such a
 * review among its old neighbours (or past the read caps). Both reads order
 * by review_date (set to now() on every save) and the merged pool sorts by
 * contentAt: the newest usable media row's created_at for a media review,
 * else coalesce(review_date, created_at). The card's date label still reads
 * the review's own date (`at`). Never by rating (that would make the page an
 * advertisement) and never by reactions (they average 2.4 and cannot rank
 * anything).
 *
 * TWO parallel reads, no pagination: a MEDIA read (inner-joined
 * course_review_media with a URL, 40 newest) and a WORDS read (non-blank
 * review text, 60 newest), merged, deduped by id, sorted created_at desc and
 * capped at POOL_CAP. One read of the newest ratings of any kind let
 * score-only ratings crowd every rail-worthy review out of the cap, leaving
 * the heading with no rails. Either read failing throws; never a half pool.
 * Shape is LatestReview so the shipped review sheet consumes it unchanged.
 *
 * LATEST_REVIEWS_MAGAZINE: the select embeds course_review_media and the
 * `review IS NOT NULL` filter is gone, so a media review without text
 * qualifies. Each row carries its full ordered media list (cover first,
 * then created_at ascending) plus photo/video counts. A second read marks
 * pool courses on any active Top 100 list (activeTop100CourseIds); a failed
 * Top 100 read means no stamps, never an error.
 * Top 100 query data stays JSON-safe (sorted unique arrays); Sets exist only
 * in the memoized consumer layer, which treats legacy non-array data as empty.
 *
 * NO SURFACE MAY PRINT A REVIEW TOTAL from this pool: it is capped at POOL_CAP
 * (80) and the sheet it feeds does not page, so any count is a cap, not a truth.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LatestReview, ReviewMediaItem } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { activeTop100CourseIds, type Top100MembershipRow } from './browse/playedRings';
import { usablePoster } from '@/features/review-v2/lib/persistedPoster';

/** Ceiling on the pool. Deepest reachable list consumes well under this. */
const POOL_CAP = 80;

const SELECT_BASE = `
  id,
  course_id,
  user_id,
  rating,
  review,
  created_at,
  review_date,
  design_score,
  condition_score,
  clubhouse_score,
  facilities_score,
  user_profiles:user_id ( id, username, display_name, profile_photo_url ),
  course:golf_courses!course_id!inner ( id, name, country, region, sub_country, thumbnail_image ),`;
const MEDIA_COLS = 'id, media_type, media_url, poster_url, stream_id, is_cover, duration_seconds, created_at, width, height';
export const MEDIA_SELECT = `${SELECT_BASE}
  course_review_media!inner ( ${MEDIA_COLS} )
`;
export const WORDS_SELECT = `${SELECT_BASE}
  course_review_media ( ${MEDIA_COLS} )
`;
const MEDIA_LIMIT = 40;
const WORDS_LIMIT = 60;

interface MediaRow {
  id: string;
  media_type: string | null;
  media_url: string | null;
  poster_url: string | null;
  stream_id: string | null;
  is_cover: boolean | null;
  duration_seconds: number | null;
  created_at: string | null;
  width: number | null;
  height: number | null;
}

interface Row {
  id: string;
  user_id: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  review_date?: string | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  user_profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
  course: {
    id: string;
    name: string | null;
    country: string | null;
    region: string | null;
    sub_country: string | null;
    thumbnail_image: string | null;
  } | null;
  course_review_media: MediaRow[] | null;
}

/** Media rows with a URL, cover first then created_at ascending. */
function orderMedia(rows: MediaRow[] | null): ReviewMediaItem[] {
  const usable = (rows ?? []).filter((m) => !!m.media_url);
  usable.sort((a, b) =>
    Number(b.is_cover === true) - Number(a.is_cover === true)
    || String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));
  return usable.map((m) => ({
    id: m.id,
    type: String(m.media_type ?? '').toLowerCase().includes('video') ? 'video' : 'image',
    url: m.media_url as string,
    posterUrl: usablePoster(m.poster_url),
    streamId: m.stream_id ?? null,
    durationSeconds: m.duration_seconds ?? null,
    width: m.width ?? null,
    height: m.height ?? null,
  }));
}

/** When this review's content last arrived: newest usable media, else the last save. */
export function contentAt(row: Pick<Row, 'created_at' | 'review_date' | 'course_review_media'>): string {
  const media = (row.course_review_media ?? []).filter((m) => !!m.media_url && !!m.created_at).map((m) => m.created_at as string);
  if (media.length > 0) return media.reduce((a, b) => (new Date(b).getTime() > new Date(a).getTime() ? b : a));
  return row.review_date ?? row.created_at;
}

export function mapRow(row: Row): LatestReview | null {
  const quote = String(row.review ?? '').trim();
  if (!row.course?.id) return null;
  const profile = row.user_profiles;
  const media = orderMedia(row.course_review_media);
  // Neither words nor usable media: no rail can show it.
  if (!quote && media.length === 0) return null;
  return {
    reviewId: row.id,
    courseId: row.course.id,
    courseName: (row.course.name ?? '').trim(),
    courseImage: row.course.thumbnail_image ?? null,
    rating: Number(row.rating ?? 0),
    quote,
    at: row.created_at,
    contentAt: contentAt(row),
    userId: row.user_id ?? null,
    reviewerName: (profile?.display_name ?? profile?.username ?? '').trim(),
    reviewerUsername: profile?.username ?? null,
    reviewerAvatar: profile?.profile_photo_url ?? null,
    mediaUrl: media[0]?.url ?? null,
    mediaType: media[0]?.type ?? null,
    posterUrl: media[0]?.posterUrl ?? null,
    mediaCount: media.length,
    photoCount: media.filter((m) => m.type === 'image').length,
    videoCount: media.filter((m) => m.type === 'video').length,
    mediaId: media[0]?.id ?? null,
    media,
    courseCountry: row.course.country ?? null,
    courseRegion: row.course.region ?? null,
    courseSubCountry: row.course.sub_country ?? null,
    breakdown: {
      design: row.design_score ?? null,
      conditions: row.condition_score ?? null,
      clubhouse: row.clubhouse_score ?? null,
      facilities: row.facilities_score ?? null,
    },
  };
}

export function useBrowseReviews(country: string | null, region: string | null) {
  const query = useQuery({
    queryKey: ['courses', 'browse-reviews-v3', country ?? 'all', region ?? 'all'],
    staleTime: 60_000,
    queryFn: async (): Promise<LatestReview[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scope = (q: any) => {
        let out = q;
        if (country) out = out.eq('course.sub_country', country);
        if (country && region) out = out.eq('course.region', region);
        return out;
      };
      const mediaQ = scope(supabase
        .from('course_ratings')
        .select(MEDIA_SELECT)
        .eq('is_mock', false)
        .not('course_review_media.media_url', 'is', null)
        .order('review_date', { ascending: false, nullsFirst: false })
        .limit(MEDIA_LIMIT));
      const wordsQ = scope(supabase
        .from('course_ratings')
        .select(WORDS_SELECT)
        .eq('is_mock', false)
        .not('review', 'is', null)
        .neq('review', '')
        .order('review_date', { ascending: false, nullsFirst: false })
        .limit(WORDS_LIMIT));
      const [mediaRes, wordsRes] = (await Promise.all([mediaQ, wordsQ])) as Array<{ data: unknown[] | null; error: unknown }>;
      if (mediaRes.error) throw mediaRes.error;
      if (wordsRes.error) throw wordsRes.error;

      const byId = new Map<string, Row>();
      for (const r of [...((mediaRes.data ?? []) as unknown as Row[]), ...((wordsRes.data ?? []) as unknown as Row[])]) {
        // The words read carries the full media list; the inner media read may be filtered.
        const prev = byId.get(r.id);
        if (!prev || (r.course_review_media?.length ?? 0) > (prev.course_review_media?.length ?? 0)) byId.set(r.id, r);
      }
      const merged = [...byId.values()]
        .map((r) => ({ r, t: new Date(contentAt(r)).getTime() || 0 }))
        .sort((a, b) => b.t - a.t)
        .map(({ r }) => r)
        .slice(0, POOL_CAP);

      const rows = merged
        .map(mapRow)
        .filter((r): r is LatestReview => !!r);

      /**
       * NAME BACKFILL, same reason as useLatestReviews: the embedded
       * user_profiles join resolves only for readers that satisfy RLS on that
       * table, so an unhydrated session collapses every byline. public_profiles
       * is the anon-readable projection of the same rows.
        */
      const missing = Array.from(
        new Set(rows.filter((r) => !r.reviewerName && r.userId).map((r) => r.userId as string)),
      );
      if (missing.length > 0) {
        const { data: pub } = await supabase
          .from('public_profiles')
          .select('id, username, display_name, profile_photo_url')
          .in('id', missing);
        const byId = new Map((pub ?? []).map((p: { id: string } & Record<string, unknown>) => [p.id, p]));
        for (const r of rows) {
          const p = r.userId ? byId.get(r.userId) : null;
          if (!p) continue;
          r.reviewerName = String((p.display_name as string) ?? (p.username as string) ?? '').trim();
          r.reviewerUsername = r.reviewerUsername ?? ((p.username as string) ?? null);
          r.reviewerAvatar = r.reviewerAvatar ?? ((p.profile_photo_url as string) ?? null);
        }
      }

      return rows;
    },
  });

  const pool = query.data ?? [];

  /** TOP 100 STAMPS: one read for the pool's courses; any active list counts
   *  once. A failed read means no stamps, never an error. */
  const courseIds = Array.from(new Set(pool.map((r) => r.courseId))).sort();
  const top100Query = useQuery({
    queryKey: ['courses', 'browse-reviews-top100', courseIds.join(',')],
    enabled: courseIds.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('course_id, top100_lists!inner(slug, is_active)')
        .in('course_id', courseIds)
        .eq('top100_lists.is_active', true);
      if (error) return [];
      return Array.from(activeTop100CourseIds((data ?? []) as unknown as Top100MembershipRow[])).sort();
    },
  });
  const top100 = useMemo(() => new Set(Array.isArray(top100Query.data) ? top100Query.data : []), [top100Query.data]);

  return {
    /** Newest first, already scoped, stamped. Empty means NO slots — the correct absence. */
    pool: pool.map((r) => ({ ...r, top100: top100.has(r.courseId) })),
    isPending: query.isPending,
    isLoading: query.isLoading,
  };
}

export default useBrowseReviews;
