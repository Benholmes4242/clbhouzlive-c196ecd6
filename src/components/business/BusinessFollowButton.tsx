import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFollowAsActor } from '@/hooks/useFollowAsActor';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowState } from '@/hooks/useFollowState';

interface BusinessFollowButtonProps {
  businessId: string;
  className?: string;
}

/**
 * Actor-aware BusinessFollowButton.
 *
 * Slice 3 migration: read side now subscribes to the canonical 5-element
 * follow-status key via useFollowState (was the legacy 4-element
 * ['business-follow-status', businessId, actorType, actorId] key).
 *
 * Write side intentionally retains useFollowAsActor — it handles the
 * business→business case via `business_outbound_follows`, which the
 * canonical useToggleFollow does not. patchFollow inside useToggleFollow
 * keeps the canonical key in sync for the personal→business path.
 */
export function BusinessFollowButton({ businessId, className }: BusinessFollowButtonProps) {
  const { user } = useSupabaseSession();
  const {
    followBusiness,
    unfollowBusiness,
    isFollowingBusiness: followPending,
    isUnfollowingBusiness: unfollowPending,
    actorType,
    actorId,
  } = useFollowAsActor();

  const { isFollowing: cachedFollowing } = useFollowState({
    targetActorType: 'business',
    targetActorId: businessId,
    viewerActorType: actorType,
    viewerActorId: actorId,
  });

  const isFollowing = cachedFollowing ?? false;
  const isPending = followPending || unfollowPending;

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
      <Button variant="default" className={className} disabled>
        Follow
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        className={`${className} border-[#E0E0E0] bg-white text-[#0F0F0F] hover:bg-gray-50`}
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
      variant="gradient"
      className={className}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? 'Following...' : 'Follow'}
    </Button>
  );
}
