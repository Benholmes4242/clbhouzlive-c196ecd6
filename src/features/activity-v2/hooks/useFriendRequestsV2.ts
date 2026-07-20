import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { patchFollow } from '@/lib/followCache';

// Minimal structural rpc caller — get_activity_friend_requests is not in the
// generated Supabase types but the call/error shape is stable.
type RpcResult<T> = { data: T | null; error: { message: string } | null };
const rpcFriendRequests = supabase.rpc.bind(supabase) as unknown as (
  name: string,
  args: Record<string, unknown>,
) => Promise<RpcResult<FriendRequestRowV2[]>>;

/**
 * Friend-requests strip data for Activity V2.
 * Row shape mirrors public.get_activity_friend_requests RETURNS TABLE.
 */
export interface FriendRequestRowV2 {
  request_id: string;
  requester_user_id: string;
  requester_username: string | null;
  requester_display_name: string | null;
  requester_avatar_url: string | null;
  mutual_friend_count: number;
  requested_at: string;
}

export function useFriendRequestsV2() {
  const { user } = useSupabaseSession();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ['activity-v2-friend-requests', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await rpcFriendRequests('get_activity_friend_requests', {
        p_user_id: userId,
      });
      if (error) throw error;
      return (data ?? []) as FriendRequestRowV2[];
    },
  });

  return { ...query, ...useFriendRequestMutations() };
}

/**
 * Accept / decline write path — mirrors the legacy
 * src/components/activity/FriendRequestButtons.tsx logic:
 *   accept  -> update user_friends SET status='accepted' WHERE id=requestId
 *              (fallback: (user_id=requester, friend_id=me, status='pending'))
 *   decline -> delete user_friends WHERE id=requestId (same fallback)
 * Trigger auto_follow_on_friend_accept creates reciprocal user_follows on
 * accept, so we patchFollow() both directions for viewer parity.
 */
function useFriendRequestMutations() {
  const qc = useQueryClient();
  const { user } = useSupabaseSession();

  const invalidateAll = (viewerId: string) => {
    qc.invalidateQueries({ queryKey: ['activity-v2-friend-requests'] });
    qc.invalidateQueries({ queryKey: ['activity-v2'] });
    qc.invalidateQueries({ queryKey: ['activity-feed'] });
    qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
    qc.invalidateQueries({ queryKey: ['friendRequests'] });
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['friendship'] });
    qc.invalidateQueries({ queryKey: ['relationship-status'] });
    qc.invalidateQueries({ queryKey: ['discovery-exclusions'] });
    qc.invalidateQueries({ queryKey: ['whs-friend-leaderboard', viewerId] });
    qc.invalidateQueries({ queryKey: ['whs-friend-rivalries', viewerId] });
    qc.invalidateQueries({ queryKey: ['whs-friends-activity', viewerId] });
  };

  const optimisticRemove = (requestId: string) => {
    qc.setQueriesData<FriendRequestRowV2[]>(
      { queryKey: ['activity-v2-friend-requests'] },
      (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((r) => r.request_id !== requestId);
      },
    );
  };

  const accept = useMutation({
    mutationFn: async (args: { requestId: string; requesterId: string }) => {
      const viewerId = user?.id;
      if (!viewerId) throw new Error('Not authenticated');
      let err = null;
      if (args.requestId && args.requestId.length > 10) {
        const r = await supabase
          .from('user_friends')
          .update({ status: 'accepted' })
          .eq('id', args.requestId);
        err = r.error;
      } else {
        const r = await supabase
          .from('user_friends')
          .update({ status: 'accepted' })
          .eq('user_id', args.requesterId)
          .eq('friend_id', viewerId)
          .eq('status', 'pending');
        err = r.error;
      }
      if (err) throw err;

      patchFollow(
        qc,
        {
          targetActorType: 'personal',
          targetActorId: args.requesterId,
          targetUserId: args.requesterId,
          viewerUserId: viewerId,
        },
        { isFollowing: true },
      );
      patchFollow(
        qc,
        {
          targetActorType: 'personal',
          targetActorId: viewerId,
          targetUserId: viewerId,
          viewerUserId: args.requesterId,
        },
        { isFollowing: true },
      );
      return args;
    },
    onMutate: (args) => {
      optimisticRemove(args.requestId);
    },
    onError: () => {
      toast.error("Couldn't update this request. Try again.");
    },
    onSettled: () => {
      if (user?.id) invalidateAll(user.id);
    },
  });

  const decline = useMutation({
    mutationFn: async (args: { requestId: string; requesterId: string }) => {
      const viewerId = user?.id;
      if (!viewerId) throw new Error('Not authenticated');
      let err = null;
      if (args.requestId && args.requestId.length > 10) {
        const r = await supabase.from('user_friends').delete().eq('id', args.requestId);
        err = r.error;
      } else {
        const r = await supabase
          .from('user_friends')
          .delete()
          .eq('user_id', args.requesterId)
          .eq('friend_id', viewerId)
          .eq('status', 'pending');
        err = r.error;
      }
      if (err) throw err;
      return args;
    },
    onMutate: (args) => {
      optimisticRemove(args.requestId);
    },
    onError: () => {
      toast.error("Couldn't update this request. Try again.");
    },
    onSettled: () => {
      if (user?.id) invalidateAll(user.id);
    },
  });

  return { acceptRequest: accept, declineRequest: decline };
}
