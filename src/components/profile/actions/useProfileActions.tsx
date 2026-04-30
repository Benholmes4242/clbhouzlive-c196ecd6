/**
 * @deprecated Use `useUserFollow` for ProfileSocialButtons.
 * This hook is retained only for BusinessProfileActions and legacy consumers.
 * Internals now route through the canonical `useToggleFollow`.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useRelationshipStatus } from '@/hooks/useRelationshipStatus';
import { useToggleFollow } from '@/hooks/useToggleFollow';

interface UseProfileActionsProps {
  targetUserId: string;
  currentUserId: string;
}

export const useProfileActions = ({ targetUserId, currentUserId }: UseProfileActionsProps) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const toggle = useToggleFollow();

  // Check relationship status to respect blocks
  const { data: relationship } = useRelationshipStatus(targetUserId);

  const invalidateAllRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['relationship-status'] });
    queryClient.invalidateQueries({ queryKey: ['followerCount'] });
    queryClient.invalidateQueries({ queryKey: ['followingCount'] });
    queryClient.invalidateQueries({ queryKey: ['followers'] });
    queryClient.invalidateQueries({ queryKey: ['following'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
    queryClient.invalidateQueries({ queryKey: ['user-follows'] });
    queryClient.invalidateQueries({ queryKey: ['social-counts'] });
  };

  const handleFollow = async (isFollowing: boolean) => {
    if (relationship?.hasBlockedThem || relationship?.isBlockedByThem) {
      toast.error("Action not allowed", {
        description: "You can't interact with this user.",
      });
      return;
    }

    setLoading(true);
    try {
      await toggle.mutateAsync({
        targetActorType: 'personal',
        targetActorId: targetUserId,
        targetUserId: targetUserId,
        viewerActorType: 'personal',
        viewerActorId: currentUserId,
        viewerUserId: currentUserId,
        isFollowing,
      });
      toast.success(isFollowing ? 'Unfollowed' : 'Following');
      invalidateAllRelatedQueries();
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error(error?.message || "Couldn't update follow");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleFollow
  };
};
