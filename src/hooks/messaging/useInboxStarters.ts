/**
 * ADDENDUM TO BRIEF_MESSAGES_DARK — THE EMPTY STATE.
 *
 * §4 THE DATA, AND THE ONE THING THAT MUST NOT BE FAKED.
 *
 * The empty inbox is populated from THE SAME SET AS THE COMPOSE SHEET —
 * `usePlayedWith`'s two hops (user_follows, already prefetched on boot, then
 * ONE batched count_shared_rounds_batch). Nothing new is queried: this hook
 * reuses the compose sheet's exact query key, so opening compose after the
 * empty state costs zero requests, and it only runs when the inbox is
 * genuinely empty.
 *
 * §4 THE FALLBACK IS LABELLED AS ITSELF. If the member follows people but has
 * NO shared rounds with any of them, we return kind 'circle' — and the caller
 * changes the heading AND every row's context line with it. Presenting a
 * follow as a golfer you have played with is a lie the member can check in
 * seconds, so the two sets never share copy.
 *
 * §5 "NOTHING TO SHOW" IS NOT "THE READ FAILED".
 *   'bare'       the reads RESOLVED and the set is genuinely empty.
 *   'unresolved' a read threw. The caller shows the bare copy but keeps the
 *                action; it never claims the member has nobody.
 *   'loading'    still in flight.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchSharedRoundCounts } from '@/lib/whs/api';

export type InboxStarterKind = 'played' | 'circle' | 'bare' | 'unresolved' | 'loading';

export interface InboxStarter {
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  verified: boolean;
  /** Only ever > 0 on kind 'played'. */
  sharedRounds: number;
  /** §4 A row with no context to show carries NO context line — never a dash. */
  lastCourseName: string | null;
  lastPlayDate: string | null;
}

interface StarterSet {
  kind: 'played' | 'circle' | 'bare';
  members: InboxStarter[];
}

async function fetchProfiles(ids: string[]) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url, is_verified_golfer')
    .in('id', ids);
  if (error) throw error;
  return new Map(
    (data ?? []).map((p) => [
      p.id as string,
      {
        name: (p.display_name as string) || (p.username as string) || 'Golfer',
        username: (p.username as string) ?? null,
        avatarUrl: (p.profile_photo_url as string) ?? null,
        verified: !!p.is_verified_golfer,
      },
    ]),
  );
}

async function fetchStarterSet(userId: string, cap: number): Promise<StarterSet> {
  const { data: follows, error: followErr } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId)
    .limit(400);
  if (followErr) throw followErr;

  const ids = [...new Set((follows ?? []).map((f) => f.following_id as string))].filter(
    (id) => id && id !== userId,
  );
  if (ids.length === 0) return { kind: 'bare', members: [] };

  const counts = await fetchSharedRoundCounts(userId, ids);
  const partnerIds = ids
    .filter((id) => (counts[id] ?? 0) > 0)
    .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));

  // ── The played-with set. Real golf, real context. ──────────────────────
  if (partnerIds.length > 0) {
    const top = partnerIds.slice(0, cap);
    const byId = await fetchProfiles(top);
    return {
      kind: 'played',
      members: top.map((id) => {
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
        };
      }),
    };
  }

  // ── The fallback. Labelled as the circle, never as shared golf. ────────
  const top = ids.slice(0, cap);
  const byId = await fetchProfiles(top);
  return {
    kind: 'circle',
    members: top.map((id) => {
      const p = byId.get(id);
      return {
        userId: id,
        name: p?.name ?? 'Golfer',
        username: p?.username ?? null,
        avatarUrl: p?.avatarUrl ?? null,
        verified: p?.verified ?? false,
        sharedRounds: 0,
        lastCourseName: null,
        lastPlayDate: null,
      };
    }),
  };
}

export function useInboxStarters(
  userId: string | undefined,
  enabled: boolean,
  cap = 5,
): { kind: InboxStarterKind; members: InboxStarter[] } {
  const q = useQuery({
    // Same first hop and same batched RPC as the compose sheet; distinct key
    // only because the shape is capped and labelled.
    queryKey: ['messaging', 'inbox-starters', userId ?? '', cap],
    queryFn: () => fetchStarterSet(userId as string, cap),
    enabled: !!userId && enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  return useMemo(() => {
    if (!userId || !enabled) return { kind: 'loading' as const, members: [] };
    if (q.isError) return { kind: 'unresolved' as const, members: [] };
    if (!q.isFetched || q.isLoading) return { kind: 'loading' as const, members: [] };
    const set = q.data;
    if (!set) return { kind: 'unresolved' as const, members: [] };
    return { kind: set.kind, members: set.members };
  }, [userId, enabled, q.isError, q.isFetched, q.isLoading, q.data]);
}
