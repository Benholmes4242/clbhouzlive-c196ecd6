/**
 * useSocialListV2 — Circle-design social list data hook.
 *
 * Infinite pagination over rpc('get_social_list'). Row type mirrors the
 * RPC return columns 1:1. totalCount surfaced from any row's total_count.
 *
 * Zero legacy imports (per Brief F2). Keep this file the single reader of
 * the new RPC so the v2 island can evolve without touching the old page.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Minimal structural typing for the get_social_list RPC — supabase's
// generated types don't include it. The RPC returns SocialListRow[].
type SocialListRpc = (
  fn: 'get_social_list',
  args: Record<string, unknown>,
) => Promise<{ data: SocialListRow[] | null; error: { message: string } | null }>;
const rpcSocialList = supabase.rpc as unknown as SocialListRpc;

export type FriendStatus =
  | 'friend'
  | 'pending_sent'
  | 'pending_received'
  | 'none'
  | null;

export interface SocialListRow {
  actor_type: 'personal' | 'business';
  actor_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  home_club: string | null;
  profile_type: string | null;
  business_slug: string | null;
  business_category: string | null;
  business_location: string | null;
  handicap_index: number | null;
  friend_status: FriendStatus;
  viewer_follows: boolean;
  mutual_count: number;
  mutual_usernames: string[] | null;
  followed_at: string | null;
  total_count: number;
}

export interface SocialListParams {
  actorType: 'personal' | 'business';
  actorId: string | undefined;
  direction: 'followers' | 'following';
  viewerId: string | undefined;
  /** Optional server-side filter — the RPC accepts 'friends' etc. Unused in v1. */
  filter?: string | null;
  pageSize?: number;
}

const PAGE_SIZE = 20;

export function useSocialListV2({
  actorType,
  actorId,
  direction,
  viewerId,
  filter = null,
  pageSize = PAGE_SIZE,
}: SocialListParams) {
  return useInfiniteQuery({
    // viewerId is part of the key: get_social_list emits per-viewer
    // friend_status / viewer_follows / mutuals, so caches from a different
    // viewer (or from a pre-session render where viewerId was undefined)
    // must NEVER be reused when the session user resolves.
    queryKey: ['social-list-v2', viewerId ?? null, actorType, actorId, direction, filter],
    enabled: !!actorId,
    initialPageParam: 0,
    staleTime: 60_000,
    queryFn: async ({ pageParam }) => {
      if (!actorId) return { rows: [] as SocialListRow[], totalCount: 0 };
      const { data, error } = await rpcSocialList('get_social_list', {
        p_profile_actor_type: actorType,
        p_profile_actor_id: actorId,
        p_direction: direction,
        // Session user only — never the profile owner, never a business actor.
        p_viewer_id: viewerId ?? null,
        p_filter: filter,
        p_page_size: pageSize,
        p_offset: (pageParam as number) * pageSize,
      });
      if (error) throw error;
      const rows = (data ?? []) as SocialListRow[];
      const totalCount = rows[0]?.total_count ?? 0;
      return { rows, totalCount };
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.rows.length === pageSize ? pages.length : undefined,
  });
}


/**
 * Two page-size-1 reads for the tab counts. We can't derive them from
 * page 0 of the primary query alone because that hook only knows one
 * direction at a time.
 */
export function useSocialListCounts(
  actorType: 'personal' | 'business',
  actorId: string | undefined,
  viewerId: string | undefined,
) {
  return useQuery({
    // viewerId in the key — mutual_count in the count row is viewer-scoped
    // even though totals are not, and this guarantees we never serve a
    // pre-session cached zero after login.
    queryKey: ['social-list-v2-counts', viewerId ?? null, actorType, actorId],
    enabled: !!actorId,
    staleTime: 60_000,

    queryFn: async () => {
      if (!actorId) return { followers: 0, following: 0 };
      const [f, g] = await Promise.all([
        rpcSocialList('get_social_list', {
          p_profile_actor_type: actorType,
          p_profile_actor_id: actorId,
          p_direction: 'followers',
          p_viewer_id: viewerId ?? null,
          p_filter: null,
          p_page_size: 1,
          p_offset: 0,
        }),
        rpcSocialList('get_social_list', {
          p_profile_actor_type: actorType,
          p_profile_actor_id: actorId,
          p_direction: 'following',
          p_viewer_id: viewerId ?? null,
          p_filter: null,
          p_page_size: 1,
          p_offset: 0,
        }),
      ]);
      if (f.error) throw f.error;
      if (g.error) throw g.error;
      const followers = ((f.data ?? []) as SocialListRow[])[0]?.total_count ?? 0;
      const following = ((g.data ?? []) as SocialListRow[])[0]?.total_count ?? 0;
      return { followers: Number(followers), following: Number(following) };
    },
  });
}

export const SOCIAL_LIST_V2_PAGE_SIZE = PAGE_SIZE;
