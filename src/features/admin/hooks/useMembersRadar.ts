/**
 * BRIEF_MEMBERS_RADAR Stage 3 — the five member RPCs Ben created by hand.
 * Types follow the brief's return shapes exactly. Every hook: staleTime 60s,
 * refetch on `admin-v2:refetch`, keys under ['admin','members',...].
 *
 * Seconds, actions, areas and screen labels are used EXACTLY as returned:
 * the server computes durations and drops passive events, and area / screen
 * names are data. Never recompute or refilter here, never hard-code an area.
 *
 * Behaviour, Sessions and Session raise permission denied for non-full admins;
 * the error propagates so the panel renders "Full admins only", never zeros.
 */
import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'full' | 'limited' | 'moderator';

export interface MembersOverviewMember {
  user_id: string;
  display_name: string | null;
  username: string | null;
  photo_url: string | null;
  home_club: string | null;
  index: number | null;
  created_at: string;
  last_seen_at: string | null;
  connected: boolean;
  rounds_total: number;
  admin_role: AdminRole | null;
  is_new: boolean;
  is_quiet: boolean;
  is_suspended: boolean;
  is_verified: boolean;
  /** null for non-full admins */
  email: string | null;
  /** 8 booleans, index 0 = 7 weeks ago, index 7 = this week */
  weeks_8: boolean[];
}

export interface MembersOverviewTeamRow {
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  role: string;
  granted_at: string | null;
  granted_by_name: string | null;
  expires_at: string | null;
  notes: string | null;
}

export interface MembersOverviewInvite {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  created_at: string;
  expires_at: string;
  expired: boolean;
}

export interface MembersOverview {
  total: number;
  /** Mutually exclusive buckets; they sum to total. */
  recency: { d1: number; d7: number; d14: number; d30: number; older: number };
  connected: number;
  no_handicap: number;
  new_7d: number;
  quiet: number;
  members: MembersOverviewMember[];
  team: MembersOverviewTeamRow[];
  invites: MembersOverviewInvite[];
  computed_at: string;
}

export interface MemberOverview {
  profile: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    photo_url: string | null;
    home_club: string | null;
    index: number | null;
    created_at: string;
    is_suspended: boolean;
    is_verified: boolean;
  };
  /** All null when never connected. */
  connection: {
    connected_at: string | null;
    synced: boolean | null;
    failing: boolean | null;
    last_synced_at: string | null;
  };
  index_series: { date: string; index: number }[];
  index_start: number | null;
  first_round_at: string | null;
  weeks_active_8: number;
  golf_year: { rounds: number; sub_80: number; birdies: number; courses: number };
  last_round: { gross: number; to_par: number; course_name: string; play_date: string } | null;
  app: { posts: number; reviews: number; invites_sent: number; brought_in: number };
  client: 'App' | 'iOS browser' | 'Android browser' | 'Desktop' | null;
  computed_at: string;
}

export interface SessionStep {
  at: string;
  kind: 'screen' | 'event' | 'error' | 'push';
  /** screen label (kind screen) */
  label?: string | null;
  area?: string | null;
  /** event name (other kinds) */
  name?: string | null;
  /** error message */
  detail?: string | null;
  /** kind screen */
  seconds?: number | null;
}

export interface MemberSession {
  session_id: string;
  started_at: string;
  ended_at: string | null;
  seconds: number;
  client: string | null;
  /** true when the session ended on the passive page_exit (never in steps) */
  ends_on_exit?: boolean;
  steps: SessionStep[];
}

export interface MemberBehaviour {
  window_days: number;
  total_seconds: number;
  sessions: number;
  avg_session_seconds: number;
  /** 24 numbers, seconds per hour of day, Europe/London */
  hourly: number[];
  /** dow 1 = Mon .. 7 = Sun */
  peak: { dow: number; hour: number } | null;
  /** max 8, desc */
  areas: { area: string; seconds: number; visits: number }[];
  /** max 12, desc */
  actions: { name: string; count: number }[];
  errors: number;
  never_opened: { areas: string[] };
  has: { reviewed: boolean; posted: boolean; invited: boolean };
  last_session: MemberSession | null;
  computed_at: string;
}

export interface MemberSessionSummary {
  session_id: string;
  started_at: string;
  ended_at: string | null;
  seconds: number;
  screens: number;
  events: number;
  errors: number;
  client: string | null;
}

export interface MemberSessionsPage {
  total: number;
  /** newest first */
  sessions: MemberSessionSummary[];
}

export interface MemberExtras {
  year: number;
  top100_year: number;
  /** Monday (Europe/London) of the oldest week */
  week_start: string;
  /** 8 session counts, oldest week first; null for limited admins */
  sessions_8: number[] | null;
  computed_at: string;
}

export const MEMBERS_KEY = ['admin', 'members'] as const;
const STALE = 60_000;
const SESSIONS_PAGE = 30;

/** Permission denied from a full-admin-only RPC renders "Full admins only". */
export function isPermissionDenied(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  if (!e) return false;
  return e.code === '42501' || /permission denied/i.test(e.message ?? '');
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, (args ?? {}) as never);
  if (error) throw error;
  return data as unknown as T;
}

function useRefetchOnAdminEvent() {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);
}

export function useMembersOverview() {
  useRefetchOnAdminEvent();
  return useQuery({
    queryKey: [...MEMBERS_KEY, 'overview'],
    queryFn: () => rpc<MembersOverview>('get_admin_members_overview'),
    staleTime: STALE,
  });
}

export function useMemberOverview(userId: string | null | undefined) {
  useRefetchOnAdminEvent();
  return useQuery({
    queryKey: [...MEMBERS_KEY, 'member', userId],
    queryFn: () => rpc<MemberOverview>('get_admin_member_overview', { p_user_id: userId }),
    enabled: !!userId,
    staleTime: STALE,
  });
}

export function useMemberBehaviour(userId: string | null | undefined, days = 30) {
  useRefetchOnAdminEvent();
  return useQuery({
    queryKey: [...MEMBERS_KEY, 'behaviour', userId, days],
    queryFn: () => rpc<MemberBehaviour>('get_admin_member_behaviour', { p_user_id: userId, p_days: days }),
    enabled: !!userId,
    staleTime: STALE,
    retry: (n, e) => !isPermissionDenied(e) && n < 2,
  });
}

export function useMemberSessions(userId: string | null | undefined) {
  useRefetchOnAdminEvent();
  return useInfiniteQuery({
    queryKey: [...MEMBERS_KEY, 'sessions', userId],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => rpc<MemberSessionsPage>('get_admin_member_sessions', {
      p_user_id: userId,
      p_limit: SESSIONS_PAGE,
      ...(pageParam ? { p_before: pageParam } : {}),
    }),
    // Page with p_before = the last started_at.
    getNextPageParam: (last) =>
      last.sessions.length < SESSIONS_PAGE ? null : last.sessions[last.sessions.length - 1]?.started_at ?? null,
    enabled: !!userId,
    staleTime: STALE,
    retry: (n, e) => !isPermissionDenied(e) && n < 2,
  });
}

export function useMemberSession(userId: string | null | undefined, sessionId: string | null | undefined) {
  useRefetchOnAdminEvent();
  return useQuery({
    queryKey: [...MEMBERS_KEY, 'session', userId, sessionId],
    queryFn: () => rpc<MemberSession>('get_admin_member_session', { p_user_id: userId, p_session_id: sessionId }),
    enabled: !!userId && !!sessionId,
    staleTime: STALE,
    retry: (n, e) => !isPermissionDenied(e) && n < 2,
  });
}

export function useMemberExtras(userId: string | null | undefined) {
  useRefetchOnAdminEvent();
  return useQuery({
    queryKey: [...MEMBERS_KEY, 'extras', userId],
    queryFn: () => rpc<MemberExtras>('get_admin_member_extras', { p_user_id: userId }),
    enabled: !!userId,
    staleTime: STALE,
  });
}
