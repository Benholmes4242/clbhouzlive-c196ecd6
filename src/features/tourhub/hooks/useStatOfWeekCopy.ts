/**
 * useStatOfWeekCopy — Fetches all cached AI standfirsts for StatOfTheWeek.
 *
 * Reads from `stat_of_week_copy` (one row per category_key). Returns a
 * Map<categoryKey, standfirstText>. The component falls back to a
 * deterministic template when a key is missing.
 *
 * The cache is refreshed weekly by the `generate-stat-of-week-copy`
 * edge function (Anthropic Claude Sonnet 4.5).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StatOfWeekCopyRow {
  category_key: string;
  standfirst_text: string;
  generated_at: string;
}

export function useStatOfWeekCopy() {
  return useQuery({
    queryKey: ['stat-of-week-copy'],
    queryFn: async (): Promise<Map<string, string>> => {
      const { data, error } = await supabase
        .from('stat_of_week_copy')
        .select('category_key, standfirst_text, generated_at');

      if (error) {
        console.error('[useStatOfWeekCopy]', error);
        return new Map();
      }

      const map = new Map<string, string>();
      for (const row of (data ?? []) as StatOfWeekCopyRow[]) {
        if (row.standfirst_text) map.set(row.category_key, row.standfirst_text);
      }
      return map;
    },
    staleTime: 60 * 60 * 1000, // 1 hour — refreshed by weekly cron anyway
  });
}
