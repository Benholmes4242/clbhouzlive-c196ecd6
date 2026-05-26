import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PulseFriend {
  user_id: string;
  display_name: string;
  first_name: string | null;
  profile_photo_url: string | null;
  handicap_index: number | null;
  delta90: number | null;
  last_played: string; // ISO date
  last_5_scores: number[]; // most recent first
  last_5_pars: number[];
  hot: boolean;
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

      // 3. Last 14 days of rounds
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);

      const { data: rounds } = await supabase
        .from('gam_round_stats' as any)
        .select('user_id, play_date, gross_score, course_par, hcp_at_time')
        .in('user_id', friendIds)
        .gte('play_date', fourteenDaysAgo)
        .eq('holes_played', 18)
        .order('play_date', { ascending: false });

      if (!rounds) return [];

      // 4. Current handicap via whs_connections → whs_handicap_snapshots
      const { data: connections } = await supabase
        .from('whs_connections')
        .select('id, user_id')
        .in('user_id', friendIds)
        .is('deleted_at', null);

      const connToUser = new Map<string, string>(
        (connections ?? []).map((c: any) => [c.id, c.user_id]),
      );
      const connectionIds = (connections ?? []).map((c: any) => c.id);

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

      // 5. Group rounds by friend
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
        if (lastPlayed < sevenDaysAgo) continue;

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

        result.push({
          user_id: profile.id,
          display_name: displayName,
          first_name: firstName,
          profile_photo_url: profile.profile_photo_url,
          handicap_index: handicapByUser.get(profile.id) ?? null,
          delta90: null, // V1
          last_played: lastPlayed,
          last_5_scores: lastFive.map((r) => r.gross_score).filter((s: any): s is number => s != null),
          last_5_pars: lastFive.map((r) => r.course_par).filter((p: any): p is number => p != null),
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
