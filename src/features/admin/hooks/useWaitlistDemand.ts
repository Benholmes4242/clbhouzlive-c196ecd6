import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WHS_COUNTRIES } from '@/lib/whs/whsCountries';

export interface WaitlistSummaryRow {
  country_id: string;
  body_name: string;
  total: number;
  joined_last_7d: number;
  latest_join: string | null;
  country_name: string;
  iso: string | null;
}

export interface WaitlistDrilldownRow {
  id: string;
  user_id: string;
  created_at: string;
  body_name: string;
  country_id: string;
  notified_live: boolean;
  profile: {
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
}

export interface WaitlistNotifyStatus {
  pending: number;
  total: number;
}

export const WAITLIST_SUMMARY_KEY = ['admin-v2', 'waitlist', 'summary'] as const;
export const WAITLIST_DRILLDOWN_KEY = (countryId: string | null) =>
  ['admin-v2', 'waitlist', 'drilldown', countryId] as const;

function enrichCountry(row: {
  country_id: string;
  body_name: string;
}): { country_name: string; iso: string | null } {
  const match = WHS_COUNTRIES.find((c) => c.id === row.country_id);
  return {
    country_name: match?.name ?? row.body_name,
    iso: match?.iso ?? null,
  };
}

export function useWaitlistSummary() {
  return useQuery({
    queryKey: WAITLIST_SUMMARY_KEY,
    queryFn: async (): Promise<WaitlistSummaryRow[]> => {
      const { data, error } = await supabase.rpc('admin_waitlist_summary');
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        country_id: string;
        body_name: string;
        total: number;
        joined_last_7d: number;
        latest_join: string | null;
      }>;
      return rows.map((r) => ({
        ...r,
        total: Number(r.total ?? 0),
        joined_last_7d: Number(r.joined_last_7d ?? 0),
        ...enrichCountry(r),
      }));
    },
    staleTime: 60_000,
  });
}

export function useWaitlistDrilldown(countryId: string | null) {
  return useQuery({
    queryKey: WAITLIST_DRILLDOWN_KEY(countryId),
    enabled: !!countryId,
    queryFn: async (): Promise<WaitlistDrilldownRow[]> => {
      if (!countryId) return [];
      const { data, error } = await supabase
        .from('handicap_authority_waitlist')
        .select('id, user_id, created_at, body_name, country_id')
        .eq('country_id', countryId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        id: string;
        user_id: string;
        created_at: string;
        body_name: string;
        country_id: string;
      }>;
      if (!rows.length) return [];

      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', ids);
      const byId = new Map(
        (profiles ?? []).map((p: any) => [p.id as string, p]),
      );
      return rows.map((r) => ({
        ...r,
        profile: byId.get(r.user_id)
          ? {
              display_name: byId.get(r.user_id)!.display_name ?? null,
              username: byId.get(r.user_id)!.username ?? null,
              profile_photo_url: byId.get(r.user_id)!.profile_photo_url ?? null,
            }
          : null,
      }));
    },
    staleTime: 30_000,
  });
}
