/** Shared elite-amateur reads. The server gates rows (owner, admin, or verified
 * member with show_tour_results on); the client never re-implements the switch,
 * so no rows means no Ranking tab. The summary key is shared with
 * SettingsWagrCard — one key, one shape (select *). */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAmateurSummary(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['amateur-summary', userId],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const result = await supabase.from('amateur_rank_summary').select('*').eq('user_id', userId!).maybeSingle();
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

export function useAmateurHistory(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['amateur-history', userId],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const result = await supabase.from('amateur_rank_history').select('*').eq('user_id', userId!)
        .order('week', { ascending: true }).order('id', { ascending: true });
      if (result.error) throw result.error;
      return result.data ?? [];
    },
  });
}

export function useAmateurEvents(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['amateur-events', userId],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const result = await supabase.from('amateur_events').select('*').eq('user_id', userId!)
        .order('event_week', { ascending: false }).order('wagr_event_id', { ascending: false });
      if (result.error) throw result.error;
      return result.data ?? [];
    },
  });
}


export function useAmateurCareer(userId: string, enabled: boolean) {
  return useQuery({ queryKey: ['amateur-career', userId], enabled: enabled && !!userId, queryFn: async () => {
    const result = await supabase.from('amateur_career_moments').select('*').eq('user_id', userId)
      .order('year', { ascending: false }).order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return result.data ?? [];
  } });
}
