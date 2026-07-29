import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HeroStoryKind =
  | 'course_record'
  | 'ace'
  | 'albatross'
  | 'eagle'
  | 'birdie_haul';

/**
 * Feat chips attached to the round behind a hero story.
 * jsonb, may be {} - parse defensively at the render site.
 */
export interface HeroChips {
  birdies?: number | null;
  eagles?: number | null;
  beat_par?: boolean | null;
  clean_card?: boolean | null;
}

/**
 * Narrative payload. jsonb or null; the shape depends on the row kind:
 *   course_record  { kind:'beat', name, by, self, stood }
 *   ace|albatross  { kind:'rarity', ordinal, total }
 *   eagle          { kind:'first_at_course' }
 *   birdie_haul    { kind:'most_at_course', count }
 */
export type HeroStoryDetail =
  | { kind: 'beat'; name?: string | null; by?: number | null; self?: boolean | null; stood?: string | number | null }
  | { kind: 'rarity'; ordinal?: number | null; total?: number | null }
  | { kind: 'first_at_course' }
  | { kind: 'most_at_course'; count?: number | null }
  | { kind: string };

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
  /** jsonb, may be {} */
  chips?: HeroChips | null;
  /** jsonb, may be null */
  story?: HeroStoryDetail | null;
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
