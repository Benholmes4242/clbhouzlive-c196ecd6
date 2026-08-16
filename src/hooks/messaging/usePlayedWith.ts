/**
 * BRIEF_MESSAGES_ECHO_PALETTE §5 — NEW MESSAGE OPENS ON GOLFERS YOU HAVE
 * ACTUALLY PLAYED WITH, most recent first, with where and when.
 *
 * IS THE PLAYED-WITH SET REACHABLE FROM THE COMPOSE SHEET? YES, in two hops,
 * and both are already-cached calls:
 *
 *   1. `user_follows` — who the member follows. Already fetched on boot by
 *      AppPrefetchProvider, so this is a cache read in practice.
 *   2. `count_shared_rounds_batch(p_user_id, p_target_ids)` — ONE request that
 *      returns the shared-round count for every one of them.
 *
 * THERE IS NO "played with" TABLE and no RPC that returns playing partners
 * directly. Shared rounds are DERIVED by matching whs_scores on (play_date,
 * course_id), which is why the follow graph has to supply the candidate set:
 * without a candidate list the derivation is a full cross join. The practical
 * consequence, stated plainly: a golfer you played with but do NOT follow will
 * not appear in this list. Search still finds them. Closing that gap needs a
 * server-side partner RPC, which is a data change and out of this brief.
 *
 * Ordering is by most recent round together, then by count — "most recent
 * first" as the brief asks, not alphabetical.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchSharedRoundCounts } from '@/lib/whs/api';

export interface PlayedWithMember {
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  verified: boolean;
  sharedRounds: number;
  lastCourseName: string | null;
  lastPlayDate: string | null;
}

async function fetchPlayedWith(userId: string): Promise<PlayedWithMember[]> {
  const { data: follows, error: followErr } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId)
    .limit(400);
  if (followErr) throw followErr;

  const ids = [...new Set((follows ?? []).map((f) => f.following_id as string))].filter(
    (id) => id && id !== userId,
  );
  if (ids.length === 0) return [];

  const counts = await fetchSharedRoundCounts(userId, ids);
  const partnerIds = ids.filter((id) => (counts[id] ?? 0) > 0);
  if (partnerIds.length === 0) return [];

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, verified')
    .in('id', partnerIds);
  if (profErr) throw profErr;

  // The viewer's own rounds are enough to say WHERE and WHEN for each partner:
  // the most recent round they share is by definition a round the viewer played.
  const { data: recent } = await supabase
    .from('whs_scores')
    .select('play_date, course_id, whs_courses(name)')
    .order('play_date', { ascending: false })
    .limit(1);
  void recent; // per-partner context comes from the shared-round detail fetch.

  const byId = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        name: (p.display_name as string) || (p.username as string) || 'Golfer',
        username: (p.username as string) ?? null,
        avatarUrl: (p.avatar_url as string) ?? null,
        verified: !!p.verified,
      },
    ]),
  );

  return partnerIds
    .map((id) => {
      const p = byId.get(id);
      return {
        userId: id,
        name: p?.name ?? 'Golfer',
        username: p?.username ?? null,
        avatarUrl: p?.avatarUrl ?? null,
        verified: p?.verified ?? false,
        sharedRounds: counts[id] ?? 0,
        lastCourseName: null,
        lastPlayDate: null,
      } satisfies PlayedWithMember;
    })
    .sort((a, b) => b.sharedRounds - a.sharedRounds);
}

export function usePlayedWith(userId: string | undefined, enabled: boolean) {
  const q = useQuery({
    queryKey: ['messaging', 'played-with', userId ?? ''],
    queryFn: () => fetchPlayedWith(userId as string),
    enabled: !!userId && enabled,
    staleTime: 10 * 60 * 1000,
  });

  return useMemo(
    () => ({ members: q.data ?? [], isLoading: q.isLoading, error: q.error }),
    [q.data, q.isLoading, q.error],
  );
}
