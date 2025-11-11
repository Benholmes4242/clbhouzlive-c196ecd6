import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchChatHistory } from '../data/history.fetchers';

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
      const payload = {
        q: filters.query || null,
        filter_has_response: filters.hasResponse ?? null,
        date_from: filters.dateFrom?.toISOString() || null,
        date_to: filters.dateTo?.toISOString() || null,
        mode: filters.mode || null,
        filter_starred: filters.starred ?? null,
        filter_tag: filters.tag ? String(filters.tag).toLowerCase() : null,
        sort_mode: filters.sortMode || 'default',
        max_results: limit,
      };

      let { data, error } = await supabase.rpc('echo_history_search', payload);

      // Fallback to legacy signature if prod DB not updated yet
      if (error && /echo_history_search.*no function/i.test(error.message)) {
        const legacyPayload = {
          q: payload.q,
          filter_starred: payload.filter_starred,
          max_results: payload.max_results,
        };
        const legacy = await supabase.rpc('echo_history_search', legacyPayload);
        if (legacy.error) throw legacy.error;
        data = legacy.data;
      } else if (error) {
        // Surface error with context for debugging
        console.error('[useEchoHistorySearch] RPC error', { message: error.message, details: (error as any).details, hint: (error as any).hint, code: (error as any).code, payload });
        // Graceful fallback: use dual-read history (legacy conversations + new threads)
        try {
          const fallback = await fetchChatHistory(limit);
          return fallback.map((item: any) => ({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle || item.preview_text || '',
            has_response: typeof item.has_response === 'boolean' ? item.has_response : (item.subtitle ? item.subtitle !== '(No response yet)' : true),
            is_starred: false,
            last_activity_at: item.created_at,
            message_count: item.message_count ?? 0,
            relative_date: item.relative_date ?? '',
            tags: [],
          })) as EchoHistoryResult[];
        } catch (fbErr) {
          console.error('[useEchoHistorySearch] Fallback fetchChatHistory failed', fbErr);
          throw new Error(`Echo history search failed: ${error.message}`);
        }
      }

      // Map RPC result to our interface
      const results = (data || []).map((row: any) => ({
        id: row.thread_id,
        title: row.first_user_question,
        subtitle: row.preview_snippet ?? row.first_user_question ?? '',
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
