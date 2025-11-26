import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RelationshipStatus {
  isFriend: boolean;
  hasPendingFriendRequestToThem: boolean;
  hasPendingFriendRequestFromThem: boolean;
  isFollowing: boolean;
  isFollower: boolean;
  hasBlockedThem: boolean;
  isBlockedByThem: boolean;
}

/**
 * Hook to get the complete relationship status between the current user and a target user.
 * Uses the get_relationship_status RPC function to efficiently query all relationship types.
 * 
 * @param targetUserId - The ID of the user to check relationship status with
 * @returns RelationshipStatus object with all relationship flags
 */
export function useRelationshipStatus(targetUserId: string | undefined) {
  return useQuery({
    queryKey: ['relationship-status', targetUserId],
    enabled: !!targetUserId,
    queryFn: async () => {
      if (!targetUserId) {
        return {
          isFriend: false,
          hasPendingFriendRequestToThem: false,
          hasPendingFriendRequestFromThem: false,
          isFollowing: false,
          isFollower: false,
          hasBlockedThem: false,
          isBlockedByThem: false,
        };
      }

      const { data, error } = await supabase.rpc('get_relationship_status', {
        target_user_id: targetUserId,
      });

      if (error) {
        console.error('Error fetching relationship status:', error);
        throw error;
      }

      // RPC returns jsonb, parse it properly
      if (typeof data === 'object' && data !== null) {
        return data as unknown as RelationshipStatus;
      }

      // Fallback to empty state
      return {
        isFriend: false,
        hasPendingFriendRequestToThem: false,
        hasPendingFriendRequestFromThem: false,
        isFollowing: false,
        isFollower: false,
        hasBlockedThem: false,
        isBlockedByThem: false,
      };
    },
    staleTime: 30_000, // 30 seconds - balance between freshness and performance
  });
}
