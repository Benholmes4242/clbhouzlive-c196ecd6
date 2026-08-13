/**
 * Resolves the gate's context from the URL: who invited you, or whose
 * profile you were sent. Both reads go through SECURITY DEFINER RPCs that
 * expose only names, usernames, a handicap index the member has chosen to
 * show, and aggregate counts — nothing else.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GateState } from './gateRoutes';

export interface GateCircleMember {
  name: string;
  rounds: number;
  handicap_index: number | null;
}

export interface GateIdentity {
  found: boolean;
  username?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  handicap_index?: number | null;
  rounds?: number;
  courses?: number;
  circle?: GateCircleMember[];
}

export function useGateContext(state: GateState) {
  const key =
    state.kind === 'invite'
      ? ['gate-context', 'invite', state.code]
      : state.kind === 'profile'
        ? ['gate-context', 'profile', state.username]
        : ['gate-context', 'none'];

  return useQuery<GateIdentity | null>({
    queryKey: key,
    queryFn: async () => {
      if (state.kind === 'invite') {
        if (!state.code) return null;
        const { data, error } = await supabase.rpc('gate_invite_context' as any, {
          p_code: state.code,
        });
        if (error) return null;
        return (data as unknown as GateIdentity) ?? null;
      }
      if (state.kind === 'profile') {
        const { data, error } = await supabase.rpc('gate_profile_context' as any, {
          p_username: state.username,
        });
        if (error) return null;
        return (data as unknown as GateIdentity) ?? null;
      }
      return null;
    },
    enabled: state.kind !== 'none' && !(state.kind === 'invite' && !state.code),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** Live course count — the figure the Courses page prints. */
export function useGateCourseCount() {
  return useQuery<number | null>({
    queryKey: ['gate-course-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('golf_courses')
        .select('id', { count: 'exact', head: true });
      if (error) return null;
      return count ?? null;
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
