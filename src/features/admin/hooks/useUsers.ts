import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import type { Database } from '@/integrations/supabase/types';
import {
  isNewThisWeek, isDormant14dPlus, isActive24h, hasEgIssue, isSuspended,
  isConnected, isNotConnected,
  EG_AUTH_FAILED_STATUSES as EG_AUTH_FAILED_STATUSES_SHARED,
} from '../lib/memberPredicates';


type AppRole = Database['public']['Enums']['app_role'];

export interface AdminUserRow {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  country: string | null;
  home_club: string | null;
  handicap_index: number | null;
  is_verified: boolean;
  is_suspended: boolean;
  created_at: string;
  role: string | null;
  last_seen_at: string | null;
}

export interface AdminWhsConnection {
  last_sync_status: string | null;
  last_synced_at: string | null;
}

export interface AdminUserDetail extends AdminUserRow {
  bio: string | null;
  email: string | null;
  email_confirmed: boolean | null;
  posts_count: number;
  reviews_count: number;
  followers: number;
  following: number;
  top100_played: number;
  reports_received: number;
  whs_connection: AdminWhsConnection | null;
}

/**
 * EG-issue definition. `auth_failed` is the exact status the
 * egSyncHealth.auth_failed counter used by DashboardPage / HealthPage /
 * useDashboard reflects (see supabase/functions/sync-whs-due/index.ts).
 * Re-exported from memberPredicates so Members + Analytics resolve to the
 * same set.
 */
export const EG_AUTH_FAILED_STATUSES = EG_AUTH_FAILED_STATUSES_SHARED;

export type UserFilterStatus =
  | 'all'
  | 'new_this_week'
  | 'active_24h'
  | 'dormant_14d'
  | 'eg_issues'
  | 'suspended'
  | 'verified'
  | 'admin'
  | 'connected'
  | 'not_connected';


const ANALYTICS_LOOKBACK_DAYS = 14;

async function fetchAllUsers(): Promise<AdminUserRow[]> {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select(`id, display_name, username, profile_photo_url, country, home_club,
             eg_handicap_index, is_verified_golfer, is_suspended, created_at`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10000);
  if (error) throw error;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .limit(10000);
  const roleMap = new Map((roles ?? []).map(r => [r.user_id, r.role]));

  // Extended to 14d so it doubles as the "dormant 14d+" filter source.
  const { data: lastSeen } = await supabase
    .from('analytics_events')
    .select('user_id, created_at')
    .not('user_id', 'is', null)
    .gte('created_at', new Date(Date.now() - ANALYTICS_LOOKBACK_DAYS * 86400_000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10000);
  const lastSeenMap = new Map<string, string>();
  for (const e of lastSeen ?? []) {
    if (e.user_id && !lastSeenMap.has(e.user_id)) lastSeenMap.set(e.user_id, e.created_at);
  }

  return (profiles ?? []).map(p => ({
    id: p.id,
    display_name: p.display_name,
    username: p.username,
    avatar_url: p.profile_photo_url,
    country: p.country,
    home_club: p.home_club,
    handicap_index: p.eg_handicap_index,
    is_verified: p.is_verified_golfer ?? false,
    is_suspended: p.is_suspended ?? false,
    created_at: p.created_at,
    role: roleMap.get(p.id) ?? null,
    last_seen_at: lastSeenMap.get(p.id) ?? null,
  }));
}

async function fetchActive24h(): Promise<string[]> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data } = await supabase
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', since)
    .not('user_id', 'is', null)
    .limit(10000);
  return [...new Set((data ?? []).map(r => r.user_id).filter(Boolean) as string[])];
}

async function fetchEgIssueUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from('whs_connections')
    .select('user_id')
    .in('last_sync_status', EG_AUTH_FAILED_STATUSES as unknown as string[])
    .limit(10000);
  return [...new Set((data ?? []).map(r => r.user_id).filter(Boolean) as string[])];
}

/**
 * The FULL set of members with a live handicap connection - one query against
 * whs_connections, no pagination and no per-page slicing, so `not_connected`
 * is the true complement rather than "not connected, on this page only".
 */
async function fetchConnectedUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from('whs_connections')
    .select('user_id')
    .limit(10000);
  return [...new Set((data ?? []).map(r => r.user_id).filter(Boolean) as string[])];
}

async function fetchUserDetail(userId: string): Promise<AdminUserDetail> {
  // Split into two batches to avoid TS "excessively deep" inference on the
  // supabase query builder union.
  const profileP = supabase.from('user_profiles').select('*').eq('id', userId).single();
  const roleP = supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
  const whsP = supabase.from('whs_connections')
    .select('last_sync_status, last_synced_at')
    .eq('user_id', userId).maybeSingle();
  const countHead = (table: 'posts' | 'course_ratings' | 'user_follows' | 'user_courses' | 'reports') =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from(table).select('id', { count: 'exact', head: true }) as any);
  const postsP = countHead('posts').eq('user_id', userId);
  const reviewsP = countHead('course_ratings').eq('user_id', userId);
  const followersP = countHead('user_follows').eq('following_id', userId);
  const followingP = countHead('user_follows').eq('follower_id', userId);
  const top100P = countHead('user_courses').eq('user_id', userId).eq('played', true);
  const reportsP = countHead('reports').eq('reported_user_id', userId);
  const [profile, role, posts, reviews, followers, following, top100, reports, whs] =
    await Promise.all([profileP, roleP, postsP, reviewsP, followersP, followingP, top100P, reportsP, whsP]);
  if (profile.error) throw profile.error;
  const p = profile.data;
  return {
    id: p.id,
    display_name: p.display_name,
    username: p.username,
    avatar_url: p.profile_photo_url,
    country: p.country,
    home_club: p.home_club,
    handicap_index: p.eg_handicap_index,
    is_verified: p.is_verified_golfer ?? false,
    is_suspended: p.is_suspended ?? false,
    created_at: p.created_at,
    bio: p.bio,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    email: (p as any).business_contact_email ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    email_confirmed: (p as any).email_confirmed ?? null,
    role: role.data?.role ?? null,
    posts_count: posts.count ?? 0,
    reviews_count: reviews.count ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    top100_played: top100.count ?? 0,
    reports_received: reports.count ?? 0,
    whs_connection: whs.data ?? null,
    last_seen_at: null,
  };
}

export function useUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilterStatus>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);

  const { data: allUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'users', 'all'],
    queryFn: fetchAllUsers,
    staleTime: 5 * 60_000,
  });

  const { data: activeIds = [] } = useQuery({
    queryKey: ['admin-v2', 'users', 'active-24h'],
    queryFn: fetchActive24h,
    staleTime: 3 * 60_000,
  });

  const { data: egIssueIds = [] } = useQuery({
    queryKey: ['admin-v2', 'users', 'eg-issues'],
    queryFn: fetchEgIssueUserIds,
    staleTime: 3 * 60_000,
  });

  const { data: connectedIds = [] } = useQuery({
    queryKey: ['admin-v2', 'users', 'connected'],
    queryFn: fetchConnectedUserIds,
    staleTime: 3 * 60_000,
  });

  const { data: userDetail, isLoading: detailLoading, isError: detailError, refetch: refetchDetail } = useQuery({
    queryKey: ['admin-v2', 'users', 'detail', drawerUserId],
    queryFn: () => fetchUserDetail(drawerUserId!),
    enabled: !!drawerUserId,
    staleTime: 2 * 60_000,
  });

  const filtered = useMemo(() => {
    let rows = allUsers;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(u =>
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.home_club?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }
    if (filter === 'admin') rows = rows.filter(u => !!u.role);
    if (filter === 'new_this_week') rows = rows.filter(u => isNewThisWeek(u));
    if (filter === 'active_24h') {
      const s = new Set(activeIds);
      rows = rows.filter(u => isActive24h(u, s));
    }
    if (filter === 'dormant_14d') rows = rows.filter(u => isDormant14dPlus(u));
    if (filter === 'eg_issues') {
      const s = new Set(egIssueIds);
      rows = rows.filter(u => hasEgIssue(u, s));
    }
    if (filter === 'connected') {
      const s = new Set(connectedIds);
      rows = rows.filter(u => isConnected(u, s));
    }
    if (filter === 'not_connected') {
      const s = new Set(connectedIds);
      rows = rows.filter(u => isNotConnected(u, s));
    }
    if (filter === 'suspended') rows = rows.filter(u => isSuspended(u));
    if (filter === 'verified') rows = rows.filter(u => u.is_verified);
    return rows;
  }, [allUsers, search, filter, activeIds, egIssueIds, connectedIds]);

  // Roster sort: last activity desc; users without activity sink to the bottom
  // ordered by join date desc.
  const sorted = useMemo(() => {
    const clone = filtered.slice();
    clone.sort((a, b) => {
      const aT = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
      const bT = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
      if (aT !== bT) return bT - aT;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return clone;
  }, [filtered]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const counts = useMemo(() => {
    const activeSet = new Set(activeIds);
    const egSet = new Set(egIssueIds);
    const connSet = new Set(connectedIds);
    return {
      all: allUsers.length,
      new_this_week: allUsers.filter(u => isNewThisWeek(u)).length,
      active_24h: allUsers.filter(u => isActive24h(u, activeSet)).length,
      dormant_14d: allUsers.filter(u => isDormant14dPlus(u)).length,
      eg_issues: allUsers.filter(u => hasEgIssue(u, egSet)).length,
      suspended: allUsers.filter(u => isSuspended(u)).length,
      verified: allUsers.filter(u => u.is_verified).length,
      admin: allUsers.filter(u => !!u.role).length,
      connected: allUsers.filter(u => isConnected(u, connSet)).length,
      not_connected: allUsers.filter(u => isNotConnected(u, connSet)).length,
    };

  }, [allUsers, activeIds, egIssueIds, connectedIds]);

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string | null }) => {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      if (role && role !== 'none') {
        const { error } = await supabase.from('user_roles').insert({
          user_id: userId, role: role as AppRole,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, { userId, role }) => {
      toast.success(role ? `Role set to ${role}` : 'Role removed');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'users', 'detail', userId] });
    },
    onError: () => toast.error('Failed to update role'),
  });

  return {
    users: paginated, filteredCount: sorted.length, allCount: allUsers.length,
    allUsers, isLoading, refetch,
    search, setSearch: (v: string) => { setSearch(v); setPage(1); },
    filter, setFilter: (v: UserFilterStatus) => { setFilter(v); setPage(1); },
    counts,
    page, setPage, pageSize, setPageSize,
    drawerUserId, setDrawerUserId,
    userDetail, detailLoading, detailError, refetchDetail,
    updateRole: (userId: string, role: string | null) => roleMutation.mutate({ userId, role }),
    roleUpdating: roleMutation.isPending,
  };
}
