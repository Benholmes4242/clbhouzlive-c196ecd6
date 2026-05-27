import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PulseFriend {
  user_id: string;
  display_name: string;
  first_name: string | null;
  profile_photo_url: string | null;
  handicap_index: number | null;
  delta90: number | null;
  hcp_series: number[]; // 90D points, oldest → newest
  last_played: string; // ISO date
  hot: boolean;
}

type HcpPoint = { ts: number; value: number };

const TARGET_DAYS = 90;
const MIN_HISTORY_DAYS = 80;
const DAY_MS = 86_400_000;

function computeDelta(series: HcpPoint[], currentHcp: number | null): number | null {
  if (currentHcp == null || series.length === 0) return null;
  const now = Date.now();
  const earliestTs = series[0].ts;
  if (now - earliestTs < MIN_HISTORY_DAYS * DAY_MS) return null;
  const targetTs = now - TARGET_DAYS * DAY_MS;
  let closest = series[0];
  let closestDiff = Math.abs(closest.ts - targetTs);
  for (const pt of series) {
    const diff = Math.abs(pt.ts - targetTs);
    if (diff < closestDiff) {
      closest = pt;
      closestDiff = diff;
    }
  }
  const raw = currentHcp - closest.value;
  return Math.round(raw * 10) / 10;
}

export function usePulseFriends(userId: string | undefined) {
  return useQuery({
    queryKey: ['pulse-friends', userId],
    queryFn: async (): Promise<PulseFriend[]> => {
      if (!userId) return [];

      // 1. Accepted friendships (bidirectional)
      const { data: friendships } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (!friendships || friendships.length === 0) return [];

      const friendIds = Array.from(
        new Set(
          friendships.map((f: any) => (f.user_id === userId ? f.friend_id : f.user_id)),
        ),
      ).filter(Boolean) as string[];

      if (friendIds.length === 0) return [];

      // 2. Profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .in('id', friendIds);

      if (!profiles) return [];

      // Last 30 days of rounds (used both for hot-streak detection from last 5 and the 30-day inclusion filter)
      const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString().slice(0, 10);

      const { data: rounds } = await supabase
        .from('gam_round_stats' as any)
        .select('user_id, play_date, gross_score, course_par, hcp_at_time')
        .in('user_id', friendIds)
        .gte('play_date', thirtyDaysAgo)
        .eq('holes_played', 18)
        .order('play_date', { ascending: false });

      if (!rounds) return [];

      // 4. Connections
      const { data: connections } = await supabase
        .from('whs_connections')
        .select('id, user_id')
        .in('user_id', friendIds)
        .is('deleted_at', null);

      const connToUser = new Map<string, string>(
        (connections ?? []).map((c: any) => [c.id, c.user_id]),
      );
      const userToConnection = new Map<string, string>(
        (connections ?? []).map((c: any) => [c.user_id, c.id]),
      );
      const connectionIds = (connections ?? []).map((c: any) => c.id);

      // 5. Current handicap (latest snapshot per user)
      const handicapByUser = new Map<string, number>();
      if (connectionIds.length > 0) {
        const { data: snaps } = await supabase
          .from('whs_handicap_snapshots' as any)
          .select('connection_id, handicap_index, observed_at')
          .in('connection_id', connectionIds)
          .order('observed_at', { ascending: false });

        for (const s of (snaps ?? []) as any[]) {
          const uid = connToUser.get(s.connection_id);
          if (!uid) continue;
          if (!handicapByUser.has(uid)) handicapByUser.set(uid, Number(s.handicap_index));
        }
      }

      // 6. Build 90D hcp series per connection (snapshots ∪ score-derived points)
      const sinceIso = new Date(Date.now() - TARGET_DAYS * DAY_MS).toISOString();
      const sinceDate = sinceIso.split('T')[0];
      const seriesByConnection = new Map<string, HcpPoint[]>();

      if (connectionIds.length > 0) {
        const [{ data: snapshots }, { data: scoreHcps }] = await Promise.all([
          supabase
            .from('whs_handicap_snapshots' as any)
            .select('connection_id, observed_at, handicap_index')
            .in('connection_id', connectionIds)
            .gte('observed_at', sinceIso)
            .order('observed_at', { ascending: true }),
          supabase
            .from('whs_scores' as any)
            .select('connection_id, play_date, handicap_index_at_time')
            .in('connection_id', connectionIds)
            .not('handicap_index_at_time', 'is', null)
            .gte('play_date', sinceDate)
            .order('play_date', { ascending: true }),
        ]);

        for (const s of (snapshots ?? []) as any[]) {
          const list = seriesByConnection.get(s.connection_id) ?? [];
          list.push({ ts: new Date(s.observed_at).getTime(), value: Number(s.handicap_index) });
          seriesByConnection.set(s.connection_id, list);
        }

        for (const sc of (scoreHcps ?? []) as any[]) {
          const list = seriesByConnection.get(sc.connection_id) ?? [];
          const dayMs = new Date(sc.play_date + 'T00:00:00Z').getTime();
          const sameDay = list.find((p) => Math.abs(p.ts - dayMs) < DAY_MS / 2);
          if (!sameDay) {
            list.push({ ts: dayMs, value: Number(sc.handicap_index_at_time) });
          }
          seriesByConnection.set(sc.connection_id, list);
        }

        for (const [, list] of seriesByConnection) {
          list.sort((a, b) => a.ts - b.ts);
        }
      }

      // 7. Group rounds by friend
      const roundsByFriend = new Map<string, any[]>();
      for (const r of rounds as any[]) {
        const list = roundsByFriend.get(r.user_id) ?? [];
        list.push(r);
        roundsByFriend.set(r.user_id, list);
      }

      const result: PulseFriend[] = [];
      for (const profile of profiles as any[]) {
        const friendRounds = roundsByFriend.get(profile.id) ?? [];
        if (friendRounds.length === 0) continue;

        const lastPlayed = friendRounds[0].play_date;
        if (lastPlayed < thirtyDaysAgo) continue;

        const lastFive = friendRounds.slice(0, 5);
        let strongRounds = 0;
        for (const r of lastFive) {
          if (r.gross_score == null || r.course_par == null) continue;
          const courseHcp = Math.round(r.hcp_at_time ?? 18);
          const netVsPar = r.gross_score - courseHcp - r.course_par;
          if (netVsPar <= 2) strongRounds++;
        }
        const hot = strongRounds >= 3;

        const displayName: string = profile.display_name ?? 'Player';
        const firstName = displayName.split(' ')[0] || null;

        const connId = userToConnection.get(profile.id);
        const series = connId ? (seriesByConnection.get(connId) ?? []) : [];
        const currentHcp = handicapByUser.get(profile.id) ?? null;
        const delta90 = computeDelta(series, currentHcp);

        result.push({
          user_id: profile.id,
          display_name: displayName,
          first_name: firstName,
          profile_photo_url: profile.profile_photo_url,
          handicap_index: currentHcp,
          delta90,
          hcp_series: series.map((p) => p.value),
          last_played: lastPlayed,
          hot,
        });
      }

      result.sort((a, b) => {
        if (a.hot !== b.hot) return a.hot ? -1 : 1;
        return b.last_played.localeCompare(a.last_played);
      });

      return result;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}
