/**
 * useToggleFollow — canonical follow/unfollow mutation hook.
 *
 * Architectural rule: every follow mutation in the app routes through this
 * hook. Optimistic updates flow via `patchFollow` (single source of truth
 * for cache patching). Rollback re-applies the inverse delta.
 *
 * Replaces 6 legacy follow hooks (each kept as a deprecated wrapper during
 * PR 3 migration). Mirrors the engagement-state useLikeMutation pattern.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { patchFollow, type FollowTarget } from '@/lib/followCache';

export interface ToggleFollowParams extends FollowTarget {
  /** Current state BEFORE toggle. We invert it inside the mutation. */
  isFollowing: boolean;
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ToggleFollowParams) => {
      const next = !params.isFollowing;

      if (params.targetActorType === 'business') {
        if (params.isFollowing) {
          const { error } = await supabase
            .from('business_follows')
            .delete()
            .eq('follower_id', params.viewerUserId ?? '')
            .eq('business_id', params.targetActorId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('business_follows')
            .insert({
              follower_id: params.viewerUserId ?? '',
              business_id: params.targetActorId,
            });
          // 23505 = unique violation = already following = no-op
          if (error && (error as any).code !== '23505') throw error;
        }
      } else {
        if (params.isFollowing) {
          const { error } = await supabase
            .from('user_follows')
            .delete()
            .eq('follower_id', params.viewerUserId ?? '')
            .eq('following_id', params.targetUserId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_follows')
            .insert({
              follower_id: params.viewerUserId ?? '',
              following_id: params.targetUserId,
            });
          if (error && (error as any).code !== '23505') throw error;
        }
      }

      return { next };
    },

    onMutate: async (params) => {
      const next = !params.isFollowing;

      // Cancel only the canonical follow-status key for this target — broad
      // cancellation would race other surfaces. patchFollow handles the rest.
      await queryClient.cancelQueries({
        queryKey: [
          'follow-status',
          params.viewerActorType,
          params.viewerActorId,
          params.targetActorType,
          params.targetActorId,
        ],
      });

      // Optimistic patch across every cache surface.
      patchFollow(queryClient, params, { isFollowing: next });

      return { wasFollowing: params.isFollowing };
    },

    onError: (_err, params, ctx) => {
      // Rollback: reapply the prior state.
      if (ctx) {
        patchFollow(queryClient, params, { isFollowing: ctx.wasFollowing });
      }
    },
  });
}
