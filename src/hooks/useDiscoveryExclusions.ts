import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExclusionSets {
  followingIds: Set<string>;
  friendsAcceptedIds: Set<string>;
  friendsPendingIds: Set<string>;
  blockedIds: Set<string>;
  excludedIds: Set<string>;
}

/**
 * Fetches all relationship data for the viewer in batched queries (no N+1).
 * Returns sets of user IDs to exclude from discovery results:
 * - self
 * - already followed
 * - friends (accepted)
 * - pending friend requests (either direction)
 * - blocked users (either direction)
 */
export function useDiscoveryExclusions(viewerId: string | undefined) {
  return useQuery<ExclusionSets>({
    queryKey: ['discovery-exclusions', viewerId],
    queryFn: async () => {
      if (!viewerId) {
        return {
          followingIds: new Set<string>(),
          friendsAcceptedIds: new Set<string>(),
          friendsPendingIds: new Set<string>(),
          blockedIds: new Set<string>(),
          excludedIds: new Set<string>([viewerId || '']),
        };
      }

      // Batch all relationship queries in parallel
      const [followingResult, friendsResult, blocksResult] = await Promise.all([
        // 1. Get users the viewer follows
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', viewerId),
        
        // 2. Get all friend relationships (pending or accepted, either direction)
        supabase
          .from('user_friends')
          .select('user_id, friend_id, status')
          .or(`user_id.eq.${viewerId},friend_id.eq.${viewerId}`),
        
        // 3. Get all blocks (either direction)
        supabase
          .from('user_blocks')
          .select('blocker_id, blocked_id')
          .or(`blocker_id.eq.${viewerId},blocked_id.eq.${viewerId}`),
      ]);

      // Build following set
      const followingIds = new Set<string>(
        (followingResult.data || []).map(f => f.following_id)
      );

      // Build friends sets (accepted vs pending)
      const friendsAcceptedIds = new Set<string>();
      const friendsPendingIds = new Set<string>();
      
      for (const row of friendsResult.data || []) {
        const otherId = row.user_id === viewerId ? row.friend_id : row.user_id;
        if (row.status === 'accepted') {
          friendsAcceptedIds.add(otherId);
        } else if (row.status === 'pending') {
          friendsPendingIds.add(otherId);
        }
      }

      // Build blocked set (either direction)
      const blockedIds = new Set<string>();
      for (const row of blocksResult.data || []) {
        const otherId = row.blocker_id === viewerId ? row.blocked_id : row.blocker_id;
        blockedIds.add(otherId);
      }

      // Combined exclusion set
      const excludedIds = new Set<string>([
        viewerId,
        ...followingIds,
        ...friendsAcceptedIds,
        ...friendsPendingIds,
        ...blockedIds,
      ]);

      return {
        followingIds,
        friendsAcceptedIds,
        friendsPendingIds,
        blockedIds,
        excludedIds,
      };
    },
    enabled: !!viewerId,
    staleTime: 30 * 1000, // 30 seconds - relationships change frequently
    gcTime: 5 * 60 * 1000,
  });
}
