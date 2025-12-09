import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFollow } from '@/hooks/useFollow';
import { toast } from 'sonner';

interface FollowBackButtonProps {
  actorId: string;
  actorDisplayName: string;
  isMock?: boolean;
}

export const FollowBackButton: React.FC<FollowBackButtonProps> = ({
  actorId,
  actorDisplayName,
  isMock = false,
}) => {
  const { isFollowing, busy, follow, ensureInitial } = useFollow(actorId);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && actorId) {
      ensureInitial().then(() => setInitialized(true));
    }
  }, [actorId, ensureInitial, initialized]);

  const handleFollowBack = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    if (isMock) {
      // For mock data, simulate the action
      toast.info('This is sample data');
      return;
    }
    
    try {
      await follow();
      toast.success(`You're now following ${actorDisplayName}.`);
    } catch (error) {
      toast.error("We couldn't follow them. Please try again.");
    }
  };

  // Don't show anything until we've checked the follow status
  if (!initialized || isFollowing === 'unknown') {
    return null;
  }

  // Already following - show muted "Following" state
  if (isFollowing === 'following') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-muted-foreground bg-muted/60 rounded-sq-pill">
        <Check className="h-3 w-3" />
        Following
      </span>
    );
  }

  // Not following - show "Follow back" button
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleFollowBack}
      disabled={busy}
      className={cn(
        "h-7 px-3 text-xs font-medium rounded-sq-pill",
        "border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
      )}
    >
      {busy ? 'Following...' : 'Follow back'}
    </Button>
  );
};
