import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SocialCounts } from './useSocialCounts';

interface UseRealtimeSocialCountsOptions {
  /** The logged-in viewer's user ID */
  viewerUserId: string | null;
  /** Profile being viewed (for personal profiles) */
  profileUserId?: string | null;
  /** Business being viewed (for business profiles) */
  businessId?: string | null;
}

/**
 * Subscribes to real-time changes on user_follows, user_friends, and business_follows
 * and updates React Query caches instantly without refetch delays.
 */
export function useRealtimeSocialCounts({
  viewerUserId,
  profileUserId,
  businessId,
}: UseRealtimeSocialCountsOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!viewerUserId) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Helper to safely update social counts cache
    const updateSocialCounts = (
      userId: string,
      updater: (prev: SocialCounts) => SocialCounts
    ) => {
      const queryKey = ['social-counts', 'personal', userId];
      const existing = queryClient.getQueryData<SocialCounts>(queryKey);
      if (existing) {
        queryClient.setQueryData<SocialCounts>(queryKey, updater(existing));
      }
    };

    // Helper to safely update business followers count cache
    const updateBusinessFollowersCount = (
      bizId: string,
      delta: number
    ) => {
      const queryKey = ['business-followers-count', bizId];
      const existing = queryClient.getQueryData<number>(queryKey);
      if (existing !== undefined) {
        queryClient.setQueryData<number>(queryKey, Math.max(0, existing + delta));
      }
    };

    // Helper to update business follow status cache
    const updateBusinessFollowStatus = (
      bizId: string,
      followerId: string,
      isFollowing: boolean
    ) => {
      const queryKey = ['business-follow-status', bizId, followerId];
      const existing = queryClient.getQueryData<boolean>(queryKey);
      if (existing !== undefined) {
        queryClient.setQueryData<boolean>(queryKey, isFollowing);
      }
    };

    // Helper to update user follow status cache
    const updateUserFollowStatus = (
      targetUserId: string,
      followerId: string,
      isFollowing: boolean
    ) => {
      const queryKey = ['user-follow-status', followerId, targetUserId];
      const existing = queryClient.getQueryData<boolean>(queryKey);
      if (existing !== undefined) {
        queryClient.setQueryData<boolean>(queryKey, isFollowing);
      }
    };

    // ============================================
    // 1. Subscribe to user_follows (user → user)
    // ============================================
    const userFollowsChannel = supabase
      .channel(`realtime-user-follows-${viewerUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_follows',
        },
        (payload) => {
          const { follower_id, following_id } = payload.new as {
            follower_id: string;
            following_id: string;
          };

          // Update following_id's followers count (+1)
          updateSocialCounts(following_id, (prev) => ({
            ...prev,
            followers: Math.max(0, prev.followers + 1),
          }));

          // Update follower_id's following count (+1)
          updateSocialCounts(follower_id, (prev) => ({
            ...prev,
            following: Math.max(0, prev.following + 1),
          }));

          // Update follow status if cached
          updateUserFollowStatus(following_id, follower_id, true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_follows',
        },
        (payload) => {
          const { follower_id, following_id } = payload.old as {
            follower_id: string;
            following_id: string;
          };

          // Update following_id's followers count (-1)
          updateSocialCounts(following_id, (prev) => ({
            ...prev,
            followers: Math.max(0, prev.followers - 1),
          }));

          // Update follower_id's following count (-1)
          updateSocialCounts(follower_id, (prev) => ({
            ...prev,
            following: Math.max(0, prev.following - 1),
          }));

          // Update follow status if cached
          updateUserFollowStatus(following_id, follower_id, false);
        }
      )
      .subscribe();

    channels.push(userFollowsChannel);

    // ============================================
    // 2. Subscribe to business_follows (user → business)
    // ============================================
    const businessFollowsChannel = supabase
      .channel(`realtime-business-follows-${viewerUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'business_follows',
        },
        (payload) => {
          const { business_id, follower_id } = payload.new as {
            business_id: string;
            follower_id: string;
          };

          // Update business followers count (+1)
          updateBusinessFollowersCount(business_id, 1);

          // Update follow status
          updateBusinessFollowStatus(business_id, follower_id, true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'business_follows',
        },
        (payload) => {
          const { business_id, follower_id } = payload.old as {
            business_id: string;
            follower_id: string;
          };

          // Update business followers count (-1)
          updateBusinessFollowersCount(business_id, -1);

          // Update follow status
          updateBusinessFollowStatus(business_id, follower_id, false);
        }
      )
      .subscribe();

    channels.push(businessFollowsChannel);

    // ============================================
    // 3. Subscribe to user_friends
    // ============================================
    const userFriendsChannel = supabase
      .channel(`realtime-user-friends-${viewerUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_friends',
        },
        (payload) => {
          const { user_id, friend_id, status } = payload.new as {
            user_id: string;
            friend_id: string;
            status: string;
          };

          // Only count accepted friendships
          if (status === 'accepted') {
            updateSocialCounts(user_id, (prev) => ({
              ...prev,
              friends: Math.max(0, prev.friends + 1),
            }));
            updateSocialCounts(friend_id, (prev) => ({
              ...prev,
              friends: Math.max(0, prev.friends + 1),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_friends',
        },
        (payload) => {
          const oldRow = payload.old as { user_id: string; friend_id: string; status: string };
          const newRow = payload.new as { user_id: string; friend_id: string; status: string };

          const wasAccepted = oldRow.status === 'accepted';
          const isAccepted = newRow.status === 'accepted';

          if (!wasAccepted && isAccepted) {
            // Became accepted: +1 for both
            updateSocialCounts(newRow.user_id, (prev) => ({
              ...prev,
              friends: Math.max(0, prev.friends + 1),
            }));
            updateSocialCounts(newRow.friend_id, (prev) => ({
              ...prev,
              friends: Math.max(0, prev.friends + 1),
            }));
          } else if (wasAccepted && !isAccepted) {
            // Was accepted, now not: -1 for both
            updateSocialCounts(newRow.user_id, (prev) => ({
              ...prev,
              friends: Math.max(0, prev.friends - 1),
            }));
            updateSocialCounts(newRow.friend_id, (prev) => ({
              ...prev,
              friends: Math.max(0, prev.friends - 1),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_friends',
        },
        (payload) => {
          const { user_id, friend_id, status } = payload.old as {
            user_id: string;
            friend_id: string;
            status: string;
          };

          // Only decrement if the deleted row was accepted
          if (status === 'accepted') {
            updateSocialCounts(user_id, (prev) => ({
              ...prev,
              friends: Math.max(0, prev.friends - 1),
            }));
            updateSocialCounts(friend_id, (prev) => ({
              ...prev,
              friends: Math.max(0, prev.friends - 1),
            }));
          }
        }
      )
      .subscribe();

    channels.push(userFriendsChannel);

    // Cleanup
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [viewerUserId, profileUserId, businessId, queryClient]);
}
