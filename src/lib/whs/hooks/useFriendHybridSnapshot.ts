/**
 * useFriendHybridSnapshot — single-RPC fetch for the hybrid friend bottom sheet.
 *
 * Mirrors the get_gam_launch_payload pattern: one Postgres function call returns
 * a jsonb payload containing profile, recent_post, social, handicap, and
 * synced_friends_count. Replaces ~10 concurrent React Query subscriptions.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendHybridProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  is_public: boolean;
  created_at: string;
}

export interface FriendHybridRecentPost {
  id: string;
  content: string | null;
  course_id: string | null;
  created_at: string;
  like_count: number;
  visibility: string;
  comment_count: number;
}

export interface FriendHybridSocial {
  posts_count: number;
  followers_count: number;
  following_count: number;
  friends_count: number;
  mutual_count: number;
  is_following: boolean;
  is_friend: boolean;
}

export interface FriendHybridLastRound {
  play_date: string;
  adjusted_gross: number | null;
  handicap_differential: number | null;
  whs_course_id: string | null;
  golf_course_id: string | null;
  course_name: string | null;
}

export interface FriendHybridHandicap {
  is_synced: boolean;
  handicap_index: number | null;
  last_round: FriendHybridLastRound | null;
  trend: 'improving' | 'flat' | 'declining' | null;
  trend_delta: number | null;
  shared_rounds: number;
  active_streaks: number;
  badges_earned: number;
}

export interface FriendHybridSnapshot {
  profile: FriendHybridProfile;
  recent_post: FriendHybridRecentPost | null;
  social: FriendHybridSocial;
  handicap: FriendHybridHandicap;
  synced_friends_count: number;
}

export const friendHybridSnapshotKey = (viewerId: string | null, targetId: string | null) =>
  ['friend-hybrid-snapshot', viewerId, targetId] as const;

export function useFriendHybridSnapshot(
  viewerId: string | null | undefined,
  targetUserId: string | null | undefined,
) {
  return useQuery<FriendHybridSnapshot | null>({
    queryKey: friendHybridSnapshotKey(viewerId ?? null, targetUserId ?? null),
    enabled: !!viewerId && !!targetUserId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_friend_hybrid_snapshot', {
        p_viewer_id: viewerId!,
        p_target_user_id: targetUserId!,
      } as never);
      if (error) throw error;
      return (data as unknown as FriendHybridSnapshot) ?? null;
    },
  });
}
