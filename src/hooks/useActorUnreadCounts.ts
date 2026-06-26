import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';

export interface ActorUnreadCount {
  actorType: 'personal' | 'business';
  actorId: string;
  count: number;
}

/**
 * Per-actor unread notification counts for the current user.
 *
 * Returns a map keyed by `${actorType}:${actorId}` and a `hasOtherUnread`
 * convenience flag for the header switcher badge (true when any actor that
 * is NOT the active one has unread activity).
 *
 * Shared business inbox: business rows are visible to every manager (owner /
 * admin / editor) via RLS, so the count is the same for all managers.
 */
export function useActorUnreadCounts() {
  const { user } = useSupabaseSession();
  const { activeActor, availableActors } = useActiveActor();

  const actorKeys = availableActors.map(a => `${a.type}:${a.id}`).join('|');

  const query = useQuery({
    queryKey: ['actor-unread-counts', user?.id, actorKeys],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!user?.id || availableActors.length === 0) return {};

      // 1) Per-actor NOTIFICATION unread (excludes message types)
      const notifResults = await Promise.all(
        availableActors.map(async (actor) => {
          const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_actor_type', actor.type)
            .eq('recipient_actor_id', actor.id)
            .eq('is_deleted', false)
            .eq('is_read', false)
            .not('type', 'in', '("message","message_received","dm")');

          return { key: `${actor.type}:${actor.id}`, count: count ?? 0 };
        }),
      );

      const totals = notifResults.reduce<Record<string, number>>((acc, r) => {
        acc[r.key] = r.count;
        return acc;
      }, {});

      // 2) Per-actor DM unread (conversations w/ unread messages not sent by actor)
      const { data: dmRows, error: dmErr } = await supabase.rpc('get_actor_dm_unread_counts');
      if (!dmErr && Array.isArray(dmRows)) {
        for (const row of dmRows as Array<{ actor_type: string; actor_id: string; unread_count: number }>) {
          const key = `${row.actor_type}:${row.actor_id}`;
          if (key in totals) totals[key] += row.unread_count ?? 0;
        }
      }

      return totals;
    },
    enabled: !!user?.id && availableActors.length > 0,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });

  const counts = query.data ?? {};
  const activeKey = activeActor ? `${activeActor.type}:${activeActor.id}` : '';

  const hasOtherUnread = Object.entries(counts).some(
    ([k, c]) => k !== activeKey && c > 0,
  );

  const otherUnreadTotal = Object.entries(counts)
    .filter(([k]) => k !== activeKey)
    .reduce((sum, [, c]) => sum + c, 0);

  const countFor = (type: 'personal' | 'business', id: string) =>
    counts[`${type}:${id}`] ?? 0;

  return {
    counts,
    hasOtherUnread,
    otherUnreadTotal,
    countFor,
    isLoading: query.isLoading,
  };
}
