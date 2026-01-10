import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsCollegeFollowed, useFollowCollegeMutations } from '../../hooks/useCollegeMovers';
import { Button } from '@/components/ui/button';

interface FollowCollegeButtonProps {
  normalizedName: string;
  className?: string;
}

export function FollowCollegeButton({ normalizedName, className }: FollowCollegeButtonProps) {
  const { user } = useSupabaseSession();
  const isFollowed = useIsCollegeFollowed(user?.id, normalizedName);
  const { follow, unfollow } = useFollowCollegeMutations(user?.id);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleClick = async () => {
    if (!user) {
      // Could show auth modal here
      return;
    }
    
    setIsAnimating(true);
    try {
      if (isFollowed) {
        await unfollow.mutateAsync(normalizedName);
      } else {
        await follow.mutateAsync(normalizedName);
      }
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };
  
  const isPending = follow.isPending || unfollow.isPending;
  
  return (
    <Button
      variant={isFollowed ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'gap-2 transition-all duration-200',
        isFollowed && 'bg-primary/10 border-primary/30 text-primary',
        isAnimating && 'scale-95',
        className
      )}
    >
      <Heart 
        className={cn(
          'w-4 h-4 transition-all duration-200',
          isFollowed && 'fill-current',
          isAnimating && 'scale-125'
        )} 
      />
      {isFollowed ? 'Following' : 'Follow'}
    </Button>
  );
}
