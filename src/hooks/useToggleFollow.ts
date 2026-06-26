/**
 * useToggleFollow — canonical follow/unfollow mutation hook.
 *
 * PHASE 1 (actor-aware follows): writes to the unified `follows` table
 * with the ACTIVE actor as the follower (not hardcoded personal). The
 * DB trigger `mirror_follows_to_legacy` keeps `user_follows` and
 * `business_follows` in sync during the cutover so existing readers
 * keep working unchanged.
 *
 * Idempotent: a 23505 unique-violation on the (follower_actor, following_actor)
 * edge is treated as success (same lesson as likes — never let a duplicate
 * write turn into a perceived failure that mis-renders the UI).
 *
 * Optimistic updates still flow through `patchFollow` (single source of
 * truth for cache patching). Rollback re-applies the inverse delta.
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

      const followerActorType = params.viewerActorType ?? 'personal';
      const followerActorId = params.viewerActorId ?? params.viewerUserId ?? '';
      const followerUserId = params.viewerUserId ?? '';

      if (!followerActorId || !followerUserId) {
        throw new Error('useToggleFollow: missing viewer identity');
      }

      if (params.isFollowing) {
        // Unfollow: delete from unified table; triggers cascade to legacy.
        const { error, count } = await supabase
          .from('follows')
          .delete({ count: 'exact' })
          .eq('follower_actor_type', followerActorType)
          .eq('follower_actor_id', followerActorId)
          .eq('following_actor_type', params.targetActorType)
          .eq('following_actor_id', params.targetActorId);
        if (error) throw error;
        if ((count ?? 0) === 0) {
          // Row already gone — treat as success.
          patchFollow(queryClient, params, { isFollowing: false });
          return { next: false };
        }
      } else {
        // Follow: idempotent insert. 23505 → already followed, treat as success.
        const { error } = await supabase.from('follows').insert({
          follower_actor_type: followerActorType,
          follower_actor_id: followerActorId,
          following_actor_type: params.targetActorType,
          following_actor_id: params.targetActorId,
          follower_user_id: followerUserId,
        });
        if (error) {
          if ((error as any).code === '23505') {
            patchFollow(queryClient, params, { isFollowing: true });
            return { next: true };
          }
          throw error;
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
