import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerSearchResult {
  id: string;
  display_name: string;
  username: string | null;
  profile_photo_url: string | null;
  handicap_index: number | null;
}

export function usePlayerSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['player-search', q],
    queryFn: async (): Promise<PlayerSearchResult[]> => {
      if (q.length < 2) return [];

      // Escape % and _ to keep ilike behaviour predictable. Comma is illegal in
      // PostgREST or-filter values, so strip it.
      const safe = q.replace(/[,()]/g, ' ').trim();
      if (safe.length < 2) return [];

      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .or(`display_name.ilike.%${safe}%,username.ilike.%${safe}%`)
        .limit(20);

      if (error) throw error;
      if (!profiles || profiles.length === 0) return [];

      const userIds = (profiles as any[]).map((p) => p.id);

      const { data: connections } = await supabase
        .from('whs_connections')
        .select('id, user_id')
        .in('user_id', userIds)
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

      return (profiles as any[]).map((p) => ({
        id: p.id,
        display_name: p.display_name ?? 'Player',
        username: p.username ?? null,
        profile_photo_url: p.profile_photo_url ?? null,
        handicap_index: handicapByUser.get(p.id) ?? null,
      }));
    },
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}
