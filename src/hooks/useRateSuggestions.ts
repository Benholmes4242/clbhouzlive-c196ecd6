import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTryNextCourses } from '@/lib/whs/hooks';
import type { NudgeCourse } from './useRateNudgeCourse';

/**
 * List-variant of useRateNudgeCourse. Reuses the exact same data sources and
 * the same react-query cache key for played-unrated, so when the Courses page
 * has already loaded the tile, this returns instantly from cache.
 */
export function useRateSuggestions(
  userId: string | undefined,
  limit = 8,
): { courses: NudgeCourse[]; tier: 'played' | 'suggested' | null; loading: boolean } {
  const primary = useQuery({
    queryKey: ['played-unrated', userId], // SAME key as useRateNudgeCourse — shared cache
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_played_unrated_courses', {
        p_user_id: userId as string,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        course_id: string;
        name: string;
        region: string | null;
        thumbnail_image: string | null;
        last_played: string | null;
      }>;
    },
  });

  const fallback = useTryNextCourses(userId, 'GB', limit);

  return useMemo(() => {
    if (primary.isLoading) return { courses: [], tier: null, loading: true };
    const played = primary.data ?? [];
    if (played.length > 0) {
      return {
        courses: played.slice(0, limit).map((p) => ({
          courseId: p.course_id,
          name: p.name,
          region: p.region,
          thumbnail: p.thumbnail_image,
          lastPlayed: p.last_played,
          tier: 'played' as const,
        })),
        tier: 'played' as const,
        loading: false,
      };
    }
    const sugg = (fallback.data ?? []) as Array<{
      id: string;
      name: string;
      region?: string | null;
      thumbnail_image?: string | null;
    }>;
    return {
      courses: sugg.slice(0, limit).map((s) => ({
        courseId: s.id,
        name: s.name,
        region: s.region ?? null,
        thumbnail: s.thumbnail_image ?? null,
        lastPlayed: null,
        tier: 'suggested' as const,
      })),
      tier: sugg.length ? ('suggested' as const) : null,
      loading: false,
    };
  }, [primary.isLoading, primary.data, fallback.data, limit]);
}
