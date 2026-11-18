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
 * ORDER: created_at DESC. Never by rating (that would make the page an
 * advertisement) and never by reactions (they average 2.4 and cannot rank
 * anything).
 *
 * ONE read, no pagination: the slots consume at most a few dozen reviews on the
 * deepest scroll, so a single capped page covers every position the list can
 * reach. Shape is LatestReview so the shipped review sheet consumes it unchanged.
 *
 * LATEST_REVIEWS_MAGAZINE: the select embeds course_review_media and the
 * `review IS NOT NULL` filter is gone, so a media review without text
 * qualifies. Each row carries its full ordered media list (cover first,
 * then created_at ascending) plus photo/video counts. A second read marks
 * pool courses on any active Top 100 list (activeTop100CourseIds); a failed
 * Top 100 read means no stamps, never an error.
 *
 * NO SURFACE MAY PRINT A REVIEW TOTAL from this pool: it is capped at POOL_CAP
 * (80) and the sheet it feeds does not page, so any count is a cap, not a truth.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LatestReview, ReviewMediaItem } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { activeTop100CourseIds, type Top100MembershipRow } from './browse/playedRings';

/** Ceiling on the pool. Deepest reachable list consumes well under this. */
const POOL_CAP = 80;

const SELECT = `
  id,
  course_id,
  user_id,
  rating,
  review,
  created_at,
  design_score,
  condition_score,
  clubhouse_score,
  facilities_score,
  user_profiles:user_id ( id, username, display_name, profile_photo_url ),
  course:golf_courses!course_id!inner ( id, name, country, region, sub_country, thumbnail_image ),
  course_review_media ( id, media_type, media_url, poster_url, stream_id, is_cover, duration_seconds, created_at )
`;

interface MediaRow {
  id: string;
  media_type: string | null;
  media_url: string | null;
  poster_url: string | null;
  stream_id: string | null;
  is_cover: boolean | null;
  duration_seconds: number | null;
  created_at: string | null;
}

interface Row {
  id: string;
  user_id: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
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
    posterUrl: m.poster_url ?? null,
    streamId: m.stream_id ?? null,
    durationSeconds: m.duration_seconds ?? null,
  }));
}

function mapRow(row: Row): LatestReview | null {
  const quote = String(row.review ?? '').trim();
  if (!row.course?.id) return null;
  const profile = row.user_profiles;
  const media = orderMedia(row.course_review_media);
  return {
    reviewId: row.id,
    courseId: row.course.id,
    courseName: (row.course.name ?? '').trim(),
    courseImage: row.course.thumbnail_image ?? null,
    rating: Number(row.rating ?? 0),
    quote,
    at: row.created_at,
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
    queryKey: ['courses', 'browse-reviews', country ?? 'all', region ?? 'all'],
    staleTime: 60_000,
    queryFn: async (): Promise<LatestReview[]> => {
      let q = supabase
        .from('course_ratings')
        .select(SELECT)
        .eq('is_mock', false)
        .order('created_at', { ascending: false })
        .limit(POOL_CAP);
      if (country) q = q.eq('course.sub_country', country);
      if (country && region) q = q.eq('course.region', region);

      const { data, error } = await q;
      if (error) throw error;

      const rows = ((data ?? []) as unknown as Row[])
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
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('course_id, top100_lists!inner(slug, is_active)')
        .in('course_id', courseIds)
        .eq('top100_lists.is_active', true);
      if (error) return new Set<string>();
      return activeTop100CourseIds((data ?? []) as unknown as Top100MembershipRow[]);
    },
  });
  const top100 = top100Query.data;

  return {
    /** Newest first, already scoped, stamped. Empty means NO slots — the correct absence. */
    pool: top100 ? pool.map((r) => ({ ...r, top100: top100.has(r.courseId) })) : pool,
    isPending: query.isPending,
    isLoading: query.isLoading,
  };
}

export default useBrowseReviews;
