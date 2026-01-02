/**
 * useUserJourneyCourses - Fetches all courses in user's journey
 * Returns played and want_to_play courses (wishlist removed)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type JourneyTab = 'played' | 'want_to_play';

export interface JourneyCourse {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  region: string | null;
  thumbnail_image: string | null;
  top100_rank: number | null;
  top100_list: string | null;
  journey_status: JourneyTab;
  added_at: string;
  rating?: number;
}

export function useUserJourneyCourses(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-journey-courses', userId],
    queryFn: async (): Promise<{
      played: JourneyCourse[];
      want_to_play: JourneyCourse[];
    }> => {
      if (!userId) {
        return { played: [], want_to_play: [] };
      }

      // Fetch ratings (played courses)
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses:course_id (
            id,
            name,
            country,
            sub_country,
            region,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .eq('is_mock', false)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      // Fetch shortlists (want_to_play only, but also include legacy wishlist and treat as want_to_play)
      const { data: shortlists, error: shortlistsError } = await supabase
        .from('course_shortlists')
        .select(`
          course_id,
          list_key,
          created_at,
          golf_courses:course_id (
            id,
            name,
            country,
            sub_country,
            region,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .in('list_key', ['want_to_play', 'wishlist']) // Include legacy wishlist
        .order('created_at', { ascending: false });

      if (shortlistsError) throw shortlistsError;

      // Fetch Top 100 memberships for badges
      const courseIds = [
        ...(ratings?.map(r => (r.golf_courses as any)?.id).filter(Boolean) || []),
        ...(shortlists?.map(s => (s.golf_courses as any)?.id).filter(Boolean) || []),
      ];

      let top100Map = new Map<string, { rank: number; list: string }>();
      
      if (courseIds.length > 0) {
        const { data: memberships } = await supabase
          .from('course_top100_memberships')
          .select(`
            course_id,
            rank,
            top100_lists:list_id (slug)
          `)
          .in('course_id', courseIds);

        memberships?.forEach((m: any) => {
          const existing = top100Map.get(m.course_id);
          if (!existing || (m.rank < existing.rank)) {
            top100Map.set(m.course_id, {
              rank: m.rank,
              list: m.top100_lists?.slug || 'global',
            });
          }
        });
      }

      // Transform ratings to JourneyCourse
      const played: JourneyCourse[] = (ratings || [])
        .filter((r: any) => r.golf_courses)
        .map((r: any) => {
          const course = r.golf_courses;
          const top100 = top100Map.get(course.id);
          return {
            id: course.id,
            name: course.name,
            country: course.country,
            sub_country: course.sub_country,
            region: course.region,
            thumbnail_image: course.thumbnail_image,
            top100_rank: top100?.rank || null,
            top100_list: top100?.list || null,
            journey_status: 'played' as const,
            added_at: r.created_at,
            rating: r.rating,
          };
        });

      // Transform shortlists to JourneyCourse (all go to want_to_play now)
      const want_to_play: JourneyCourse[] = (shortlists || [])
        .filter((s: any) => s.golf_courses)
        .map((s: any) => {
          const course = s.golf_courses;
          const top100 = top100Map.get(course.id);
          return {
            id: course.id,
            name: course.name,
            country: course.country,
            sub_country: course.sub_country,
            region: course.region,
            thumbnail_image: course.thumbnail_image,
            top100_rank: top100?.rank || null,
            top100_list: top100?.list || null,
            journey_status: 'want_to_play' as const,
            added_at: s.created_at,
          };
        });

      return { played, want_to_play };
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}
