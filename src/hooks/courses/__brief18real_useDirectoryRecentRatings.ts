/**
 * useDirectoryRecentRatings — the idle content of the course directory sheet.
 *
 * Recency of rating is a real dated event (course_ratings.created_at), not a
 * computed popularity score. The RPC only returns courses with a non-null
 * aggregate, so every row can carry a rating chip.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DirectoryRatedCourse {
  course_id: string;
  course_name: string;
  sub_country: string | null;
  country: string | null;
  thumbnail_image: string | null;
  avg_overall_score: number | null;
  review_count: number | null;
  last_rated_at: string | null;
}

export function useDirectoryRecentRatings(
  country: string | null,
  enabled: boolean,
  limit = 8,
) {
  return useQuery({
    queryKey: ['directory-recent-ratings', country ?? 'all', limit],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DirectoryRatedCourse[]> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('get_directory_recent_ratings', {
        p_country: country,
        p_limit: limit,
      });
      if (error) return [];
      const rows = (data ?? []) as Record<string, unknown>[];
      const seen = new Set<string>();
      const out: DirectoryRatedCourse[] = [];
      for (const raw of rows) {
        const id = String(raw.course_id ?? '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push({
          course_id: id,
          course_name: String(raw.course_name ?? ''),
          sub_country: (raw.sub_country as string) ?? null,
          country: (raw.country as string) ?? null,
          thumbnail_image: (raw.thumbnail_image as string) ?? null,
          avg_overall_score:
            raw.avg_overall_score === null || raw.avg_overall_score === undefined
              ? null
              : Number(raw.avg_overall_score),
          review_count:
            raw.review_count === null || raw.review_count === undefined
              ? null
              : Number(raw.review_count),
          last_rated_at: (raw.last_rated_at as string) ?? null,
        });
      }
      return out;
    },
  });
}
