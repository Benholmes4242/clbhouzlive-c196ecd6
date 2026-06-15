import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

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
  created_at: string;
  role: string | null;
  last_seen_at: string | null;
}

export interface AdminUserDetail extends AdminUserRow {
  bio: string | null;
  email: string | null;
  posts_count: number;
  reviews_count: number;
  followers: number;
  following: number;
  top100_played: number;
}

export type UserFilterStatus =
  | 'all' | 'verified' | 'unverified' | 'admin' | 'new_today' | 'active_24h';

async function fetchAllUsers(): Promise<AdminUserRow[]> {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select(`id, display_name, username, profile_photo_url, country, home_club,
             eg_handicap_index, is_verified_golfer, created_at`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10000);
  if (error) throw error;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .limit(10000);
  const roleMap = new Map((roles ?? []).map(r => [r.user_id, r.role]));

  const { data: lastSeen } = await supabase
    .from('analytics_events')
    .select('user_id, created_at')
    .not('user_id', 'is', null)
    .gte('created_at', new Date(Date.now() - 30 * 86400_000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5000);
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

async function fetchUserDetail(userId: string): Promise<AdminUserDetail> {
  const [profile, role, posts, reviews, followers, following, top100] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', userId).single(),
    supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('course_ratings').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('user_courses').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('played', true),
  ]);
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
    created_at: p.created_at,
    bio: p.bio,
    email: (p as any).business_contact_email ?? null,
    role: role.data?.role ?? null,
    posts_count: posts.count ?? 0,
    reviews_count: reviews.count ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    top100_played: top100.count ?? 0,
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
    queryKey: ['admin-v3', 'users', 'all'],
    queryFn: fetchAllUsers,
    staleTime: 5 * 60_000,
  });

  const { data: activeIds = [] } = useQuery({
    queryKey: ['admin-v3', 'users', 'active-24h'],
    queryFn: fetchActive24h,
    staleTime: 3 * 60_000,
    enabled: filter === 'active_24h',
  });

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-v3', 'users', 'detail', drawerUserId],
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
    if (filter === 'verified')   rows = rows.filter(u => u.is_verified);
    if (filter === 'unverified') rows = rows.filter(u => !u.is_verified);
    if (filter === 'admin')      rows = rows.filter(u => !!u.role);
    if (filter === 'new_today') {
      const t0 = new Date(); t0.setHours(0, 0, 0, 0);
      rows = rows.filter(u => new Date(u.created_at) >= t0);
    }
    if (filter === 'active_24h') {
      const s = new Set(activeIds);
      rows = rows.filter(u => s.has(u.id));
    }
    return rows;
  }, [allUsers, search, filter, activeIds]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const counts = useMemo(() => {
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    return {
      all: allUsers.length,
      verified: allUsers.filter(u => u.is_verified).length,
      unverified: allUsers.filter(u => !u.is_verified).length,
      admin: allUsers.filter(u => !!u.role).length,
      new_today: allUsers.filter(u => new Date(u.created_at) >= t0).length,
      active_24h: activeIds.length,
    };
  }, [allUsers, activeIds]);

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
      qc.invalidateQueries({ queryKey: ['admin-v3', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin-v3', 'users', 'detail', userId] });
    },
    onError: () => toast.error('Failed to update role'),
  });

  return {
    users: paginated, filteredCount: filtered.length, allCount: allUsers.length,
    allUsers, isLoading, refetch,
    search, setSearch: (v: string) => { setSearch(v); setPage(1); },
    filter, setFilter: (v: UserFilterStatus) => { setFilter(v); setPage(1); },
    counts,
    page, setPage, pageSize, setPageSize,
    drawerUserId, setDrawerUserId,
    userDetail, detailLoading,
    updateRole: (userId: string, role: string | null) => roleMutation.mutate({ userId, role }),
    roleUpdating: roleMutation.isPending,
  };
}
