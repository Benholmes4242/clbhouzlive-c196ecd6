import { useActiveActor } from '@/context/ActiveActorContext';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Unified follow/unfollow hook that handles following for both personal and business actors.
 * 
 * When acting as personal:
 * - Uses user_follows for following users
 * - Uses business_follows for following businesses
 * 
 * When acting as business:
 * - Uses business_outbound_follows for all follow relationships
 */
export function useFollowAsActor() {
  const { activeActor } = useActiveActor();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const actorType = activeActor?.type || 'personal';
  const actorId = activeActor?.id || user?.id || '';

  /**
   * Follow a personal profile (user)
   */
  const followUserMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (actorType === 'business') {
        // Business following a personal profile
        const { error } = await supabase
          .from('business_outbound_follows')
          .insert({
            follower_business_id: actorId,
            following_type: 'personal',
            following_id: targetUserId,
          });
        if (error) throw error;

        // Create follow notification from business to personal user
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          recipient_actor_type: 'personal',
          recipient_actor_id: targetUserId,
          actor_id: actorId,
          type: 'follow',
          title: 'New follower',
          message: 'A business started following you',
          entity_type: 'business',
          entity_id: actorId,
          data: {
            follower_actor_type: 'business',
            follower_actor_id: actorId,
          },
        });
      } else {
        // Personal following a personal profile
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });
        if (error) throw error;

        // Create follow notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          recipient_actor_type: 'personal',
          recipient_actor_id: targetUserId,
          actor_id: user.id,
          type: 'follow',
          title: 'New follower',
          message: 'started following you',
          entity_type: 'user',
          entity_id: user.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actor-following'] });
      queryClient.invalidateQueries({ queryKey: ['social-counts'] });
      queryClient.invalidateQueries({ queryKey: ['follow-status'] });
    },
  });

  /**
   * Follow a business profile
   */
  const followBusinessMutation = useMutation({
    mutationFn: async (targetBusinessId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (actorType === 'business') {
        // Business following a business
        const { error } = await supabase
          .from('business_outbound_follows')
          .insert({
            follower_business_id: actorId,
            following_type: 'business',
            following_id: targetBusinessId,
          });
        if (error) throw error;

        // Create notification for the target business
        // Get any owner of the target business for user_id (legacy field)
        const { data: targetOwner } = await supabase
          .from('business_members')
          .select('user_profile_id')
          .eq('business_id', targetBusinessId)
          .eq('role', 'owner')
          .limit(1)
          .single();

        await supabase.from('notifications').insert({
          user_id: targetOwner?.user_profile_id || targetBusinessId, // For legacy RLS
          recipient_actor_type: 'business',
          recipient_actor_id: targetBusinessId,
          actor_id: actorId,
          type: 'follow',
          title: 'New follower',
          message: 'started following your business',
          entity_type: 'business',
          entity_id: actorId,
          data: {
            follower_actor_type: 'business',
            follower_actor_id: actorId,
          },
        });
      } else {
        // Personal following a business
        const { error } = await supabase
          .from('business_follows')
          .insert({
            follower_id: user.id,
            business_id: targetBusinessId,
          });
        if (error) throw error;

        // Create notification for the business
        const { data: targetOwner } = await supabase
          .from('business_members')
          .select('user_profile_id')
          .eq('business_id', targetBusinessId)
          .eq('role', 'owner')
          .limit(1)
          .single();

        await supabase.from('notifications').insert({
          user_id: targetOwner?.user_profile_id || targetBusinessId, // For legacy RLS
          recipient_actor_type: 'business',
          recipient_actor_id: targetBusinessId,
          actor_id: user.id,
          type: 'follow',
          title: 'New follower',
          message: 'started following your business',
          entity_type: 'business',
          entity_id: targetBusinessId,
          data: {
            follower_actor_type: 'personal',
            follower_actor_id: user.id,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actor-following'] });
      queryClient.invalidateQueries({ queryKey: ['social-counts'] });
      queryClient.invalidateQueries({ queryKey: ['business-follow-status'] });
    },
  });

  /**
   * Unfollow a personal profile (user)
   */
  const unfollowUserMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (actorType === 'business') {
        const { error } = await supabase
          .from('business_outbound_follows')
          .delete()
          .eq('follower_business_id', actorId)
          .eq('following_type', 'personal')
          .eq('following_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actor-following'] });
      queryClient.invalidateQueries({ queryKey: ['social-counts'] });
      queryClient.invalidateQueries({ queryKey: ['follow-status'] });
    },
  });

  /**
   * Unfollow a business profile
   */
  const unfollowBusinessMutation = useMutation({
    mutationFn: async (targetBusinessId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (actorType === 'business') {
        const { error } = await supabase
          .from('business_outbound_follows')
          .delete()
          .eq('follower_business_id', actorId)
          .eq('following_type', 'business')
          .eq('following_id', targetBusinessId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('business_id', targetBusinessId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actor-following'] });
      queryClient.invalidateQueries({ queryKey: ['social-counts'] });
      queryClient.invalidateQueries({ queryKey: ['business-follow-status'] });
    },
  });

  /**
   * Check if current actor is following a user
   */
  const checkIfFollowingUser = async (targetUserId: string): Promise<boolean> => {
    if (!user?.id) return false;

    if (actorType === 'business') {
      const { data } = await supabase
        .from('business_outbound_follows')
        .select('id')
        .eq('follower_business_id', actorId)
        .eq('following_type', 'personal')
        .eq('following_id', targetUserId)
        .maybeSingle();
      return !!data;
    } else {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
      return !!data;
    }
  };

  /**
   * Check if current actor is following a business
   */
  const checkIfFollowingBusiness = async (targetBusinessId: string): Promise<boolean> => {
    if (!user?.id) return false;

    if (actorType === 'business') {
      const { data } = await supabase
        .from('business_outbound_follows')
        .select('id')
        .eq('follower_business_id', actorId)
        .eq('following_type', 'business')
        .eq('following_id', targetBusinessId)
        .maybeSingle();
      return !!data;
    } else {
      const { data } = await supabase
        .from('business_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('business_id', targetBusinessId)
        .maybeSingle();
      return !!data;
    }
  };

  return {
    // Follow actions
    followUser: (targetUserId: string) => followUserMutation.mutateAsync(targetUserId),
    followBusiness: (targetBusinessId: string) => followBusinessMutation.mutateAsync(targetBusinessId),
    unfollowUser: (targetUserId: string) => unfollowUserMutation.mutateAsync(targetUserId),
    unfollowBusiness: (targetBusinessId: string) => unfollowBusinessMutation.mutateAsync(targetBusinessId),
    
    // Status checks
    checkIfFollowingUser,
    checkIfFollowingBusiness,
    
    // Loading states
    isFollowingUser: followUserMutation.isPending,
    isUnfollowingUser: unfollowUserMutation.isPending,
    isFollowingBusiness: followBusinessMutation.isPending,
    isUnfollowingBusiness: unfollowBusinessMutation.isPending,
    
    // Current actor info
    actorType,
    actorId,
  };
}
