import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
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
  
  const handleClick = async () => {
    if (!user) return;
    
    if (isFollowed) {
      await unfollow.mutateAsync(normalizedName);
    } else {
      await follow.mutateAsync(normalizedName);
    }
  };
  
  const isPending = follow.isPending || unfollow.isPending;
  
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      animate={isFollowed ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant={isFollowed ? 'secondary' : 'outline'}
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          'gap-2 transition-all duration-200',
          isFollowed && 'bg-primary/10 border-primary/30 text-primary',
          className
        )}
      >
        <Heart 
          className={cn(
            'w-4 h-4 transition-all duration-200',
            isFollowed && 'fill-current'
          )} 
        />
        {isFollowed ? 'Following' : 'Follow'}
      </Button>
    </motion.div>
  );
}
