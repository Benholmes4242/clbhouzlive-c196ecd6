/**
 * Audience segment head-counts for the Analytics > Growth "Audiences" grid.
 *
 * Reuses the EXACT predicates the Members page filter uses
 * (imported from ../lib/memberPredicates — single source of truth).
 * Uses cheap head-count queries where possible; falls back to a lightweight
 * profiles select when a segment can only be evaluated in JS. No history —
 * we have no snapshot table, so cards display current size only.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  newThisWeekCutoffMs, active24hCutoffMs, dormantCutoffMs,
  EG_AUTH_FAILED_STATUSES,
} from '../lib/memberPredicates';

async function headCount(builder: () => Promise<{ count: number | null }>): Promise<number> {
  const { count } = await builder();
  return count ?? 0;
}

async function fetchAudiences() {
  const nowIso = new Date().toISOString();
  void nowIso;

  const newThisWeekISO = new Date(newThisWeekCutoffMs()).toISOString();
  const active24hISO = new Date(active24hCutoffMs()).toISOString();
  const dormantISO = new Date(dormantCutoffMs()).toISOString();

  // 1) New this week: profiles created in the last 7d (head count).
  const newThisWeekP = supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', newThisWeekISO);

  // 2) Active 24h: distinct user_ids on analytics_events in last 24h.
  // Head-count cannot dedupe, so pull the id column bounded and count.
  const active24hP = supabase
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', active24hISO)
    .not('user_id', 'is', null)
    .limit(50000);

  // 3) Dormant 14d+: profiles NOT present in the active-in-last-14d set.
  // Head-count total profiles, then subtract distinct active-in-14d.
  const totalProfilesP = supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null);
  const active14dP = supabase
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', dormantISO)
    .not('user_id', 'is', null)
    .limit(50000);

  // 4) EG linked: whs_connections row count (display-only card).
  const egLinkedP = supabase
    .from('whs_connections')
    .select('user_id', { count: 'exact', head: true });

  // 5) EG issues: whs_connections with auth_failed status.
  const egIssuesP = supabase
    .from('whs_connections')
    .select('user_id', { count: 'exact', head: true })
    .in('last_sync_status', EG_AUTH_FAILED_STATUSES as unknown as string[]);

  // 6) Suspended: user_profiles.is_suspended = true.
  const suspendedP = supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('is_suspended', true);

  const [
    newThisWeek, active24hRows, totalProfiles, active14dRows,
    egLinked, egIssues, suspended,
  ] = await Promise.all([
    headCount(async () => await newThisWeekP),
    active24hP,
    headCount(async () => await totalProfilesP),
    active14dP,
    headCount(async () => await egLinkedP),
    headCount(async () => await egIssuesP),
    headCount(async () => await suspendedP),
  ]);

  const active24hCount = new Set((active24hRows.data ?? []).map(r => r.user_id).filter(Boolean) as string[]).size;
  const active14dCount = new Set((active14dRows.data ?? []).map(r => r.user_id).filter(Boolean) as string[]).size;
  const dormantCount = Math.max(0, totalProfiles - active14dCount);

  return {
    new_this_week: newThisWeek,
    active_24h: active24hCount,
    dormant_14d: dormantCount,
    eg_linked: egLinked,
    eg_issues: egIssues,
    suspended,
  };
}

export interface AudienceSizes {
  new_this_week: number;
  active_24h: number;
  dormant_14d: number;
  eg_linked: number;
  eg_issues: number;
  suspended: number;
}

export function useAudiences() {
  return useQuery<AudienceSizes>({
    queryKey: ['admin-v2', 'analytics', 'audiences'],
    queryFn: fetchAudiences,
    staleTime: 5 * 60_000,
  });
}
