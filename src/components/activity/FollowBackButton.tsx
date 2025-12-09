import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
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

  // Shared base pill class for unified styling - SDS corners, 30% shorter height
  const basePillClass = "inline-flex items-center justify-center rounded-sq-xs border px-3 h-6 text-[11px] font-semibold transition-colors";

  // Already following - show muted "Following" state with unified styling
  if (isFollowing === 'following') {
    return (
      <span className={cn(basePillClass, "border-border bg-muted text-foreground/80 gap-1")}>
        <Check className="h-3 w-3" />
        Following
      </span>
    );
  }

  // Not following - show "Follow back" button with orange glass styling
  return (
    <button
      onClick={handleFollowBack}
      disabled={busy}
      className={cn(
        basePillClass,
        "border-orange-500 bg-orange-500/10 text-orange-600 hover:bg-orange-500/15",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      )}
    >
      {busy ? 'Following...' : 'Follow back'}
    </button>
  );
};
