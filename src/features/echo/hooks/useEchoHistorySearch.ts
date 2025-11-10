import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EchoHistorySearchFilters {
  query?: string;
  hasResponse?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  mode?: 'live' | 'static';
  starred?: boolean;
  sortMode?: 'default' | 'starred' | 'relevance';
  tag?: string;
}

export interface EchoHistoryResult {
  id: string;
  title: string;
  subtitle: string;
  has_response: boolean;
  is_starred: boolean;
  last_activity_at: string;
  message_count: number;
  relative_date: string;
  tags?: string[];
}

export function useEchoHistorySearch(
  filters: EchoHistorySearchFilters,
  opts?: { limit?: number; enabled?: boolean }
) {
  const limit = opts?.limit ?? 50;
  
  return useQuery<EchoHistoryResult[]>({
    queryKey: ['echoHistorySearch', filters, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('echo_history_search', {
        q: filters.query || null,
        filter_has_response: filters.hasResponse ?? null,
        date_from: filters.dateFrom?.toISOString() || null,
        date_to: filters.dateTo?.toISOString() || null,
        mode: filters.mode || null,
        filter_starred: filters.starred ?? null,
        filter_tag: filters.tag ? filters.tag.toLowerCase() : null,
        sort_mode: filters.sortMode || 'default',
        max_results: limit,
      });

      if (error) throw error;
      
      // Map RPC result to our interface
      const results = (data || []).map((row: any) => ({
        id: row.thread_id,
        title: row.first_user_question,
        subtitle: row.preview_snippet,
        has_response: row.has_response,
        is_starred: row.is_starred,
        last_activity_at: row.last_activity_at,
        message_count: row.message_count,
        relative_date: row.relative_date,
        tags: row.tags || [],
      })) as EchoHistoryResult[];
      
      return results;
    },
    enabled: opts?.enabled ?? true,
    staleTime: 30_000,
  });
}
