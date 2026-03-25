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
  last_seen_at:    string | null;
}

export interface AdminUserDetail extends AdminUserRow {
  bio:            string | null;
  posts_count:    number;
  reviews_count:  number;
  followers:      number;
  following:      number;
  top100_played:  number;
}

export type UserFilterStatus = 'all' | 'verified' | 'unverified' | 'admin' | 'new_today' | 'active_24h';

// ─── Activity Timeline Types ──────────────────────────────────────────────────

export interface UserActivityEvent {
  id: string;
  type: 'signup' | 'post' | 'review' | 'follow' | 'login' | 'page_view' | 'message' | 'course_played';
  label: string;
  detail: string | null;
  timestamp: string;
}

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
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) throw error;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .limit(10000);

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

// ─── Activity Timeline Fetcher ────────────────────────────────────────────────

async function fetchUserActivityTimeline(userId: string): Promise<UserActivityEvent[]> {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const iso = since.toISOString();

  const [profile, posts, reviews, follows, analyticsEvents, courses] = await Promise.all([
    supabase.from('user_profiles').select('created_at, display_name').eq('id', userId).single(),
    supabase.from('posts').select('id, created_at, content').eq('user_id', userId).gte('created_at', iso).order('created_at', { ascending: false }).limit(50),
    supabase.from('course_ratings').select('id, created_at, rating, course_id').eq('user_id', userId).gte('created_at', iso).order('created_at', { ascending: false }).limit(50),
    supabase.from('user_follows').select('id, created_at, following_id').eq('follower_id', userId).gte('created_at', iso).order('created_at', { ascending: false }).limit(30),
    supabase.from('analytics_events').select('id, created_at, name, props').eq('user_id', userId).gte('created_at', iso).in('name', ['login_success', 'page_view', 'message_sent']).order('created_at', { ascending: false }).limit(100),
    supabase.from('user_courses').select('id, created_at, course_id').eq('user_id', userId).eq('played', true).gte('created_at', iso).order('created_at', { ascending: false }).limit(30),
  ]);

  const events: UserActivityEvent[] = [];

  if (profile.data) {
    events.push({ id: 'signup', type: 'signup', label: 'Joined Clbhouz', detail: null, timestamp: profile.data.created_at });
  }

  for (const p of posts.data ?? []) {
    events.push({ id: `post-${p.id}`, type: 'post', label: 'Published a post', detail: p.content?.slice(0, 80) || null, timestamp: p.created_at });
  }

  for (const r of reviews.data ?? []) {
    events.push({ id: `review-${r.id}`, type: 'review', label: 'Submitted a review', detail: r.rating ? `Rating: ${r.rating}` : null, timestamp: r.created_at });
  }

  for (const f of follows.data ?? []) {
    events.push({ id: `follow-${f.id}`, type: 'follow', label: 'Followed a user', detail: null, timestamp: f.created_at });
  }

  for (const c of courses.data ?? []) {
    events.push({ id: `course-${c.id}`, type: 'course_played', label: 'Marked course as played', detail: null, timestamp: c.created_at });
  }

  for (const e of analyticsEvents.data ?? []) {
    const label = e.name === 'login_success' ? 'Logged in'
      : e.name === 'message_sent' ? 'Sent a message'
      : 'Viewed a page';
    const detail = e.name === 'page_view' ? (e.props as any)?.path ?? null : null;
    events.push({
      id: `ae-${e.id}`,
      type: e.name === 'login_success' ? 'login' : e.name === 'message_sent' ? 'message' : 'page_view',
      label,
      detail,
      timestamp: e.created_at,
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 150);
}

// ─── Active users set (for active_24h filter) ─────────────────────────────────

async function fetchActiveUserIds24h(): Promise<string[]> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data } = await supabase
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', since)
    .not('user_id', 'is', null)
    .limit(10000);
  const ids = new Set((data ?? []).map(r => r.user_id).filter(Boolean) as string[]);
  return [...ids];
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

  const { data: activeUserIds = [] } = useQuery({
    queryKey: ['admin-v2', 'users', 'active-24h'],
    queryFn: fetchActiveUserIds24h,
    staleTime: 3 * 60_000,
    enabled: filter === 'active_24h',
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
    if (filter === 'new_today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      rows = rows.filter(u => new Date(u.created_at) >= startOfToday);
    }
    if (filter === 'active_24h') {
      const activeSet = new Set(activeUserIds);
      rows = rows.filter(u => activeSet.has(u.id));
    }

    return rows;
  }, [allUsers, search, filter, activeUserIds]);

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
        await supabase.from('user_roles').delete().eq('user_id', userId);
        const { error } = await supabase.from('user_roles').insert(
          { user_id: userId, role: role as AppRole }
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
    users:            paginated,
    allFilteredUsers: filtered,
    allCount:         allUsers.length,
    filteredCount:    filtered.length,
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

// ─── Activity Timeline Hook ───────────────────────────────────────────────────

export function useUserActivityTimeline(userId: string | null) {
  return useQuery({
    queryKey: ['admin-v2', 'users', 'timeline', userId],
    queryFn: () => fetchUserActivityTimeline(userId!),
    enabled: !!userId,
    staleTime: 2 * 60_000,
  });
}
