import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HeroCourse {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  cover_image_url: string | null;
  rank_in_list: number;
}

export interface Top100ListSummary {
  id: string;
  name: string;
  slug: string;
  short_label: string;
  total_courses: number;
  played_count: number;
  hero_course: HeroCourse | null;
}

export function useTop100ListsWithHero(userId?: string) {
  return useQuery({
    queryKey: ['top100-lists-with-hero', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top100_lists_with_hero_courses', {
        target_user_id: userId || null,
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.list_id,
        name: item.list_name,
        slug: item.list_slug,
        short_label: item.list_short_label,
        total_courses: Number(item.total_courses),
        played_count: Number(item.played_count),
        hero_course: item.hero_course_id
          ? {
              id: item.hero_course_id,
              name: item.hero_course_name,
              country: item.hero_course_country,
              region: item.hero_course_region,
              cover_image_url: item.hero_course_thumbnail,
              rank_in_list: item.hero_course_rank,
            }
          : null,
      })) as Top100ListSummary[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
