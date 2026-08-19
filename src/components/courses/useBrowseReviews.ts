/**
 * useBrowseReviews — the review pool for the Courses browse slots.
 *
 * SCOPE: country and region ONLY. A member filtered to Scotland must never be
 * shown a Portuguese review — they have excluded that place, and showing it
 * undercuts the whole reason reviews are on this page. The LENS (Best rated /
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
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

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
  course:golf_courses!course_id!inner ( id, name, country, region, sub_country, thumbnail_image )
`;

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
}

function mapRow(row: Row): LatestReview | null {
  const quote = String(row.review ?? '').trim();
  if (!quote || !row.course?.id) return null;
  const profile = row.user_profiles;
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
    // The slots carry NO photograph, so no media is read here.
    mediaUrl: null,
    mediaType: null,
    posterUrl: null,
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
        .not('review', 'is', null)
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

  return {
    /** Newest first, already scoped. Empty means NO slots — the correct absence. */
    pool: query.data ?? [],
    isPending: query.isPending,
  };
}

export default useBrowseReviews;
