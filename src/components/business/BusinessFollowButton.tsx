import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsFollowingBusiness, useBusinessFollowMutation } from '@/hooks/useBusinessFollow';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface BusinessFollowButtonProps {
  businessId: string;
  className?: string;
}

export function BusinessFollowButton({ businessId, className }: BusinessFollowButtonProps) {
  const { user } = useSupabaseSession();
  const { data: isFollowing, isLoading: statusLoading } = useIsFollowingBusiness(businessId, user?.id);
  const { follow, unfollow, isFollowing: followPending, isUnfollowing: unfollowPending } = 
    useBusinessFollowMutation(businessId, user?.id);

  const isPending = followPending || unfollowPending;

  const handleClick = () => {
    if (!user) return;
    if (isFollowing) {
      unfollow();
    } else {
      follow();
    }
  };

  if (!user) {
    return (
      <Button variant="default" className={className} disabled>
        Follow
      </Button>
    );
  }

  if (statusLoading) {
    return (
      <Button variant="outline" className={className} disabled>
        ...
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        className={className}
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
