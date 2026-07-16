import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HeroStoryKind =
  | 'course_record'
  | 'ace'
  | 'albatross'
  | 'eagle'
  | 'birdie_haul';

export interface HeroStoryRow {
  kind: HeroStoryKind;
  course_id: string | null;
  course_name: string;
  image: string | null;
  holder_name: string | null;
  holder_avatar: string | null;
  user_id: string | null;
  score_id: string | null;
  value: number | null;
  course_par: number | null;
  hole: number | null;
  happened_at: string | null;
}

export function useHeroStories() {
  return useQuery<HeroStoryRow[]>({
    queryKey: ['discover-rail-cache', 'hero_stories'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', 'hero_stories')
        .maybeSingle();
      if (error) throw error;
      const rows = (data?.payload ?? []) as unknown as HeroStoryRow[];
      return Array.isArray(rows) ? rows.slice(0, 5) : [];
    },
  });
}
