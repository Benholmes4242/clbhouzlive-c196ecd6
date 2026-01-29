import { useActiveActor } from '@/context/ActiveActorContext';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery } from '@tanstack/react-query';

export interface ActorFollowing {
  followingUsers: string[];
  followingBusinesses: string[];
  friendIds: string[];
}

/**
 * Gets the list of who the active actor follows.
 * Used for feed filtering to show content from followed entities.
 * 
 * For personal actors:
 * - Gets user_follows (following users)
 * - Gets business_follows (following businesses)
 * - Gets user_friends (mutual friendships)
 * 
 * For business actors:
 * - Gets business_outbound_follows (all follow relationships)
 * - Business actors don't have "friends" - only follows
 */
export function useActorFollowing() {
  const { activeActor } = useActiveActor();
  const { user } = useSupabaseSession();

  const actorType = activeActor?.type || 'personal';
  const actorId = activeActor?.id || user?.id || '';

  return useQuery<ActorFollowing>({
    queryKey: ['actor-following', actorType, actorId],
    queryFn: async () => {
      const followingUsers: string[] = [];
      const followingBusinesses: string[] = [];
      const friendIds: string[] = [];

      if (!user?.id) {
        return { followingUsers, followingBusinesses, friendIds };
      }

      if (actorType === 'business') {
        // Get business's outbound follows
        const { data: outboundFollows } = await supabase
          .from('business_outbound_follows')
          .select('following_type, following_id')
          .eq('follower_business_id', actorId);

        outboundFollows?.forEach(f => {
          if (f.following_type === 'personal') {
            followingUsers.push(f.following_id);
          } else if (f.following_type === 'business') {
            followingBusinesses.push(f.following_id);
          }
        });

        // Business actors don't have friends, but we return empty array for consistency
      } else {
        // Get personal user's follows
        const { data: userFollows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        userFollows?.forEach(f => followingUsers.push(f.following_id));

        // Get followed businesses
        const { data: businessFollows } = await supabase
          .from('business_follows')
          .select('business_id')
          .eq('follower_id', user.id);

        businessFollows?.forEach(f => followingBusinesses.push(f.business_id));

        // Get friends (accepted friendships)
        const { data: friendships } = await supabase
          .from('user_friends')
          .select('friend_id, user_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');

        friendships?.forEach(f => {
          if (f.user_id === user.id) {
            friendIds.push(f.friend_id);
          } else {
            friendIds.push(f.user_id);
          }
        });
      }

      return { followingUsers, followingBusinesses, friendIds };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });
}
