/** One cache per coach function, session scoped. Any read error overrides even stale cached data. Writes only via documented RPCs. */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import { coachKeys, type MyCoach, type MemberCoach, type CoachResults, type CoachGolfers } from './contracts';
export async function coachRpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase as unknown as { rpc: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }).rpc(name, args);
  if (error) throw error;
  return data as T;
}
export function useMyCoach(viewer?: string, enabled = true) {
  return useQuery({ queryKey: coachKeys.mine(viewer), enabled: !!viewer && enabled, retry: false, staleTime: 60_000, queryFn: () => coachRpc<MyCoach | null>('get_my_coach') });
}
export function useMemberCoach(id?: string, viewer?: string) {
  return useQuery({ queryKey: coachKeys.member(id, viewer), enabled: !!id && !!viewer, retry: false, staleTime: 60_000, queryFn: () => coachRpc<MemberCoach | null>('get_member_coach', { p_user_id: id }) });
}
export function useCoachResults(id?: string, viewer?: string, enabled = true) {
  return useQuery({ queryKey: coachKeys.results(id, viewer), enabled: !!id && !!viewer && enabled, retry: false, staleTime: 60_000, queryFn: () => coachRpc<CoachResults | null>('get_coach_results', { p_business_id: id }) });
}
export function useCoachGolfers(id?: string, viewer?: string, enabled = true) {
  return useQuery({ queryKey: coachKeys.golfers(id, viewer), enabled: !!id && !!viewer && enabled, retry: false, staleTime: 60_000, queryFn: () => coachRpc<CoachGolfers | null>('get_coach_golfers', { p_business_id: id }) });
}
export function useCoachHandicap(viewer?: string) {
  const connection = useWhsConnection(viewer);
  const trend = useHandicapTrend(connection.data?.id);
  return { current: connection.isError || trend.isError ? null : trend.data?.current ?? null, loading: !!viewer && (connection.isLoading || (!!connection.data?.id && trend.isLoading)), isError: connection.isError || trend.isError };
}
export function useInvalidateCoach(viewer?: string) {
  const client = useQueryClient();
  return async (businessId: string, oldBusinessId?: string) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: coachKeys.mine(viewer) }),
      client.invalidateQueries({ queryKey: ['get_member_coach', viewer] }),
      ...Array.from(new Set([businessId, oldBusinessId].filter(Boolean))).flatMap(id => [client.invalidateQueries({ queryKey: ['get_coach_results', id] }), client.invalidateQueries({ queryKey: ['get_coach_golfers', id] })]),
      client.invalidateQueries({ queryKey: ['business-you-followed', viewer] }),
    ]);
  };
}
