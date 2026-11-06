/** Pro-profile reads are disabled outside verified tour-pro callers. Paged
 * event joins preserve all years; source selection never mixes tour and OWGR.
 * Failed reads suppress dependent sections even when cached data exists.
 * Explicit event projection leaves retired course-par database fields unread.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseWorldRank, type ProEvent } from './proProfileRules';
export function useProEvents(userId: string) {
  return useQuery({ queryKey: ['pro-profile', 'events', userId], enabled: !!userId, staleTime: 60_000, queryFn: async () => {
    const events: ProEvent[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from('pro_events').select('id,user_id,source,event_name,tour_name,start_date,end_date,country,venue,finish,to_par,total_strokes,scheduled_rounds,tee_time,tee_hole,owgr_event_id,owgr_points,owgr_rank_before,owgr_rank_after,owgr_year,owgr_week,created_at,updated_at,rounds:pro_event_rounds(*)').eq('user_id', userId).order('id').range(offset, offset + 999);
      if (error) throw error;
      events.push(...(data ?? []) as ProEvent[]);
      if (!data || data.length < 1000) return events;
    }
  } });
}
export function useProWorldRank(userId: string) {
  return useQuery({ queryKey: ['pro-profile', 'rank', userId], enabled: !!userId, staleTime: 300_000, queryFn: async () => {
    const { data, error } = await supabase.rpc('get_pro_world_rank', { p_user_id: userId });
    if (error) throw error; return parseWorldRank(data);
  } });
}
export function useProWatch(userId: string, viewerId?: string) {
  return useQuery({ queryKey: ['pro-profile', 'watch', userId, viewerId], enabled: !!userId, staleTime: 30_000, queryFn: async () => {
    const { data, error } = await supabase.rpc('get_pro_score_watch', { p_pro_id: userId });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as { watching?: boolean; count?: number } | null;
    return { watching: row?.watching === true, count: typeof row?.count === 'number' ? row.count : 0 };
  } });
}