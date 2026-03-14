import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppRole = Database['public']['Enums']['app_role'];

export interface AdminUserRow {
  id:              string;
  display_name:    string | null;
  username:        string | null;
  avatar_url:      string | null;
  country:         string | null;
  home_club:       string | null;
  handicap_index:  number | null;
  is_verified:     boolean;
  created_at:      string;
  role:            string | null;
}

export interface AdminUserDetail extends AdminUserRow {
  bio:            string | null;
  posts_count:    number;
  reviews_count:  number;
  followers:      number;
  following:      number;
  top100_played:  number;
}

export type UserFilterStatus = 'all' | 'verified' | 'unverified' | 'admin';

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchAllUsers(): Promise<AdminUserRow[]> {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      display_name,
      username,
      profile_photo_url,
      country,
      home_club,
      eg_handicap_index,
      is_verified_golfer,
      created_at
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role');

  const roleMap = new Map((roles ?? []).map(r => [r.user_id, r.role]));

  return (profiles ?? []).map(p => ({
    id:             p.id,
    display_name:   p.display_name,
    username:       p.username,
    avatar_url:     p.profile_photo_url,
    country:        p.country,
    home_club:      p.home_club,
    handicap_index: p.eg_handicap_index,
    is_verified:    p.is_verified_golfer ?? false,
    created_at:     p.created_at,
    role:           roleMap.get(p.id) ?? null,
  }));
}

async function fetchUserDetail(userId: string): Promise<AdminUserDetail> {
  const [profile, roleData, posts, reviews, followers, following, top100] = await Promise.all([
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
    id:             p.id,
    display_name:   p.display_name,
    username:       p.username,
    avatar_url:     p.profile_photo_url,
    country:        p.country,
    home_club:      p.home_club,
    handicap_index: p.eg_handicap_index,
    is_verified:    p.is_verified_golfer ?? false,
    created_at:     p.created_at,
    bio:            p.bio,
    role:           roleData.data?.role ?? null,
    posts_count:    posts.count ?? 0,
    reviews_count:  reviews.count ?? 0,
    followers:      followers.count ?? 0,
    following:      following.count ?? 0,
    top100_played:  top100.count ?? 0,
  };
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useAdminV2Users() {
  const qc = useQueryClient();
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState<UserFilterStatus>('all');
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);

  const { data: allUsers = [], isLoading, refetch } = useQuery({
    queryKey:  ['admin-v2', 'users', 'all'],
    queryFn:   fetchAllUsers,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey:  ['admin-v2', 'users', 'detail', drawerUserId],
    queryFn:   () => fetchUserDetail(drawerUserId!),
    enabled:   !!drawerUserId,
    staleTime: 2 * 60_000,
  });

  // Client-side filter + search + paginate
  const filtered = useMemo(() => {
    let rows = allUsers;

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(u =>
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }

    if (filter === 'verified')   rows = rows.filter(u => u.is_verified);
    if (filter === 'unverified') rows = rows.filter(u => !u.is_verified);
    if (filter === 'admin')      rows = rows.filter(u => !!u.role);

    return rows;
  }, [allUsers, search, filter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilter = (v: string) => { setFilter(v as UserFilterStatus); setPage(1); };

  // ─── Role mutation ─────────────────────────────────────────────────────────

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string | null }) => {
      if (!role || role === 'none') {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').upsert(
          { user_id: userId, role: role as AppRole },
          { onConflict: 'user_id,role' }
        );
        if (error) throw error;
      }
    },
    onSuccess: (_, { userId, role }) => {
      toast.success(`Role ${role ? `set to ${role}` : 'removed'}`);
      qc.invalidateQueries({ queryKey: ['admin-v2', 'users', 'all'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'users', 'detail', userId] });
    },
    onError: () => toast.error('Failed to update role'),
  });

  // ─── Counts for filter pills ───────────────────────────────────────────────

  const counts = useMemo(() => ({
    all:        allUsers.length,
    verified:   allUsers.filter(u => u.is_verified).length,
    unverified: allUsers.filter(u => !u.is_verified).length,
    admin:      allUsers.filter(u => !!u.role).length,
  }), [allUsers]);

  return {
    users:         paginated,
    allCount:      allUsers.length,
    filteredCount: filtered.length,
    isLoading,
    refetch,
    search,      setSearch: handleSearch,
    filter,      setFilter: handleFilter,
    counts,
    page,        setPage,
    pageSize,    setPageSize,
    selectedIds, setSelectedIds,
    drawerUserId, setDrawerUserId,
    userDetail,   detailLoading,
    updateRole: (userId: string, role: string | null) =>
      roleMutation.mutate({ userId, role }),
    roleUpdating: roleMutation.isPending,
  };
}
