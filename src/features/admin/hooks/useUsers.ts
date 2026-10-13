/**
 * ⚠️ POSTGREST RETURNS AT MOST 2000 ROWS — whatever `.limit()` says.
 *
 * REMEDIATED (batch 1): last-seen and the Active 24h / Dormant 14d sets came
 * from a raw 14-day analytics_events select — 18,500 rows, of which the client
 * received 2000 — so the list disagreed with the correct cards above it on the
 * same page. Both now come from get_admin_member_last_seen, one row per
 * member, sharing get_admin_audiences' population exactly.
 *
 * STANDING RULE: no admin figure is computed by counting rows in the browser.
 * Counting happens in Postgres. A new metric needs an RPC, not a select and a
 * Set.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import type { Database } from '@/integrations/supabase/types';
import { EG_AUTH_FAILED_STATUSES as EG_AUTH_FAILED_STATUSES_SHARED } from '../lib/memberPredicates';


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
  /** App role from user_roles. Read ONLY by the member sheet's full-admin
   *  "App role" chips (BRIEF_MEMBERS_RADAR 2.3). */
  role: string | null;
  /** Admin tag from get_admin_members_overview().members[].admin_role. The ONLY source of the
   *  ADMINS tile, its filter and the role badge. */
  admin_role: string | null;
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


async function fetchEgIssueUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from('whs_connections')
    .select('user_id')
    .in('last_sync_status', EG_AUTH_FAILED_STATUSES as unknown as string[])
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
    admin_role: null,
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

/**
 * The Members list reads get_admin_members_overview (useMembersOverview). What
 * remains here serves the Member screen's legacy More actions (detail + role)
 * and the one legacy ?filter=eg_issues deep link the overview has no flag for.
 */
export function useAdminUserDetail(userId: string | null) {
  const qc = useQueryClient();
  const detail = useQuery({
    queryKey: ['admin-v2', 'users', 'detail', userId],
    queryFn: () => fetchUserDetail(userId!),
    enabled: !!userId,
  });
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
    userDetail: detail.data,
    detailLoading: detail.isLoading,
    detailError: detail.isError,
    refetchDetail: detail.refetch,
    updateRole: (userId: string, role: string | null) => roleMutation.mutate({ userId, role }),
    roleUpdating: roleMutation.isPending,
  };
}

/** Legacy ?filter=eg_issues only: members whose handicap sync auth failed. */
export function useEgIssueUserIds(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-v2', 'users', 'eg-issues'],
    queryFn: fetchEgIssueUserIds,
    enabled,
    staleTime: 5 * 60_000,
  });
}
