import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseDailyEditorialArgs {
  /** Which surface this editorial is for. Defaults to 'top100' for back-compat. */
  surface?:
    | 'top100'
    | 'global'
    | 'courses'
    | 'handicap'
    | 'intelligence_quote'
    | 'stat_of_week'
    | 'college_rivalry';
  seasonId: string | null;
  timeFilter: 'seasonal' | 'all_time';
  enabled?: boolean;
}

export interface EditorialCopy {
  eyebrow: string;
  headline: string;
  headlineTwo: string;
  standfirst: string;
  storyType: string;
  generatedBy: 'template' | 'ai_claude' | 'ai_claude_validated' | 'human_edit';
  date: string;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fetches the most recent editorial copy for the Top 100 front page.
 *
 * Returns the latest row on or before today for the given (seasonId, timeFilter).
 * If no row exists yet (e.g. very first day of a new season before the cron has
 * fired), returns `null` and the caller should fall back to a baseline template.
 */
export function useDailyEditorial({
  surface = 'top100',
  seasonId,
  timeFilter,
  enabled = true,
}: UseDailyEditorialArgs) {
  const today = todayUtc();

  return useQuery({
    queryKey: ['championship-editorial-daily', surface, seasonId, timeFilter, today],
    enabled: enabled && (timeFilter === 'all_time' || !!seasonId),
    staleTime: 1000 * 60 * 30, // 30 minutes
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<EditorialCopy | null> => {
      let query = supabase
        .from('championship_editorial_daily')
        .select('eyebrow, headline, headline_two, standfirst, story_type, generated_by, date')
        .eq('surface', surface)
        .eq('time_filter', timeFilter)
        .lte('date', today)
        .order('date', { ascending: false })
        .limit(1);

      if (timeFilter === 'seasonal' && seasonId) {
        query = query.eq('season_id', seasonId);
      } else if (timeFilter === 'all_time') {
        query = query.is('season_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('[useDailyEditorial] fetch error', error);
        return null;
      }
      if (!data) return null;

      return {
        eyebrow: data.eyebrow,
        headline: data.headline,
        headlineTwo: data.headline_two ?? '',
        standfirst: data.standfirst,
        storyType: data.story_type,
        generatedBy: data.generated_by as EditorialCopy['generatedBy'],
        date: data.date,
      };
    },
  });
}
