import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTryNextCourses } from '@/lib/whs/hooks';

export interface NudgeCourse {
  courseId: string;
  name: string;
  region: string | null;
  thumbnail: string | null;
  lastPlayed: string | null;
  tier: 'played' | 'suggested';
}

export function useRateNudgeCourse(userId: string | undefined) {
  const primary = useQuery({
    queryKey: ['played-unrated', userId],
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

  const fallback = useTryNextCourses(userId, 'GB', 10);

  return useMemo<{ course: NudgeCourse | null; loading: boolean }>(() => {
    if (primary.isLoading) return { course: null, loading: true };
    const played = primary.data ?? [];
    if (played.length > 0) {
      const p = played[Math.floor(Math.random() * played.length)];
      return {
        course: {
          courseId: p.course_id,
          name: p.name,
          region: p.region,
          thumbnail: p.thumbnail_image,
          lastPlayed: p.last_played,
          tier: 'played',
        },
        loading: false,
      };
    }
    const sugg = fallback.data ?? [];
    if (sugg.length > 0) {
      const s: any = sugg[Math.floor(Math.random() * sugg.length)];
      return {
        course: {
          courseId: s.id,
          name: s.name,
          region: s.region ?? null,
          thumbnail: s.thumbnail_image ?? null,
          lastPlayed: null,
          tier: 'suggested',
        },
        loading: false,
      };
    }
    return { course: null, loading: false };
  }, [primary.isLoading, primary.data, fallback.data]);
}
