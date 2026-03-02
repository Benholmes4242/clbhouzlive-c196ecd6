import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFollowAsActor } from '@/hooks/useFollowAsActor';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery } from '@tanstack/react-query';

interface BusinessFollowButtonProps {
  businessId: string;
  className?: string;
}

/**
 * Actor-aware BusinessFollowButton
 * Uses useFollowAsActor to handle follow/unfollow for both personal and business actors.
 * Re-checks follow status when active actor changes.
 */
export function BusinessFollowButton({ businessId, className }: BusinessFollowButtonProps) {
  const { user } = useSupabaseSession();
  const { 
    followBusiness, 
    unfollowBusiness, 
    checkIfFollowingBusiness,
    isFollowingBusiness: followPending,
    isUnfollowingBusiness: unfollowPending,
    actorType,
    actorId,
  } = useFollowAsActor();

  // Actor-aware follow status query - re-fetches when actor changes
  const { data: isFollowing, isLoading: statusLoading } = useQuery({
    queryKey: ['business-follow-status', businessId, actorType, actorId],
    enabled: !!businessId && !!user?.id,
    queryFn: () => checkIfFollowingBusiness(businessId),
    staleTime: 60_000,
  });

  const isPending = followPending || unfollowPending;
  const neutralFollowButtonClass = `${className} border-[#E0E0E0] bg-white text-[#0F0F0F] hover:bg-gray-50`;

  const handleClick = async () => {
    if (!user) return;
    if (isFollowing) {
      await unfollowBusiness(businessId);
    } else {
      await followBusiness(businessId);
    }
  };

  if (!user) {
    return (
      <Button variant="outline" className={neutralFollowButtonClass} disabled>
        Follow
      </Button>
    );
  }

  if (statusLoading) {
    return (
      <Button variant="outline" className={neutralFollowButtonClass} disabled>
        ...
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        className={neutralFollowButtonClass}
        onClick={handleClick}
        disabled={isPending}
      >
        <Check className="h-4 w-4 mr-1.5" />
        Following
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className={neutralFollowButtonClass}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? 'Following...' : 'Follow'}
    </Button>
  );
}
